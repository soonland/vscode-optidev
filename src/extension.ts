import * as vscode from 'vscode';

const devCommandDefault: string = 'npm run dev';
const cypressCommandDefault: string = 'npm run cypress:open';
const devCommandKey: string = 'devCommand';
const cypressCommandKey: string = 'cypressCommand';
const startTerminalsAutomaticallyKey: string = 'startTerminalsAutomatically';

function showConfiguration() {
    const devCommand = vscode.workspace.getConfiguration('optiDev').get<string>(devCommandKey, devCommandDefault);
    const cypressCommand = vscode.workspace.getConfiguration('optiDev').get<string>(cypressCommandKey, cypressCommandDefault);
    const startTerminalsOnStartup = vscode.workspace.getConfiguration('optiDev').get<boolean>(startTerminalsAutomaticallyKey, false);

    const items: vscode.QuickPickItem[] = [
        { label: 'Dev Command', detail: devCommand },
        { label: 'Cypress Command', detail: cypressCommand },
        { label: 'Start Terminals Automatically', detail: startTerminalsOnStartup ? 'Yes' : 'No' },
        { label: '$(arrow-left) Back', alwaysShow: true }
    ];

    const quickPick = vscode.window.createQuickPick();
    quickPick.items = items;
    quickPick.placeholder = 'Current Configuration';
    quickPick.onDidChangeSelection(selection => {
        if (selection[0]) {
            if (selection[0].label === '$(arrow-left) Back') {
                quickPick.hide();
                // go back to the previous menu
                showMainMenu();
            } else {
                vscode.window.showInformationMessage(`Selected: ${selection[0].label}`);
            }
        }
    });
    quickPick.show();
}

function showMainMenu() {
    const items: vscode.QuickPickItem[] = [
        { label: 'Configure Dev Command', alwaysShow: true },
        { label: 'Configure Cypress Command', alwaysShow: true },
        { label: 'Configure Start Terminals Automatically', alwaysShow: true},
        { label: 'Show Current Configuration', alwaysShow: true }
    ];

    const quickPick = vscode.window.createQuickPick();
    quickPick.items = items;
    quickPick.placeholder = 'Main Menu';
    quickPick.onDidChangeSelection(selection => {
        if (selection[0]) {
            quickPick.hide();
            if (selection[0].label === 'Configure Dev Command') {
                vscode.commands.executeCommand('optidev.configureDevCommand');
            } else if (selection[0].label === 'Configure Cypress Command') {
                vscode.commands.executeCommand('optidev.configureCypressCommand');
            } else if (selection[0].label === 'Configure Start Terminals Automatically') {
                vscode.commands.executeCommand('optidev.configureStartTerminalsOnStartup');
            } else if (selection[0].label === 'Show Current Configuration') {
                showConfiguration();
            }
        }
    });
    quickPick.show();
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "start-dev-cypress-terminals" is now active!');

    // Start terminals command
    let startTerminals = vscode.commands.registerCommand('optidev.startTerminals', () => {
        startTerminalsAutomatically(context);
    });

    // Check configuration
    checkConfiguration(context);

    // Configure Dev Command
    let configureDevCommand = vscode.commands.registerCommand('optidev.configureDevCommand', async () => {
        await configureCommand(devCommandKey, 'OptiDev: Configure Dev Server Command');
    });

    // Configure Cypress Command
    let configureCypressCommand = vscode.commands.registerCommand('optidev.configureCypressCommand', async () => {
        await configureCommand(cypressCommandKey, 'OptiDev: Configure Cypress Command');
    });
    
    // Configure Start Terminals Automatically
    let configureStartTerminalsOnStartup = vscode.commands.registerCommand('optidev.configureStartTerminalsOnStartup', async () => {
        const startTerminalsOnStartup = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Start terminals automatically on startup?' });
        if (startTerminalsOnStartup === 'Yes') {
            await vscode.workspace.getConfiguration('optiDev').update(startTerminalsAutomaticallyKey, true, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('Automatic start of terminals is enabled');
        } else {
            await vscode.workspace.getConfiguration('optiDev').update(startTerminalsAutomaticallyKey, false, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('Automatic start of terminals is disabled');
        }
    });

    // Show current configuration
    let showCurrentConfig = vscode.commands.registerCommand('optidev.showCurrentConfig', () => {
        showConfiguration();
    });

    // Show main menu
    let showMainMenuCommand = vscode.commands.registerCommand('optidev.showMainMenu', () => {
        showMainMenu();
    });

    context.subscriptions.push(startTerminals, configureDevCommand, configureCypressCommand, configureStartTerminalsOnStartup, showCurrentConfig, showMainMenuCommand);
}

function startTerminalsAutomatically(context: vscode.ExtensionContext) {
    // Get the current workspace folder
    const currentWorkspace = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (!currentWorkspace) {
        vscode.window.showErrorMessage('No workspace folder is open');
        return;
    }

    console.log(`Current workspace: ${currentWorkspace}`);

    const startTerminalsAutomatically = vscode.workspace.getConfiguration('optiDev').get<boolean>(startTerminalsAutomaticallyKey, false);
    if (!startTerminalsAutomatically) {
        vscode.window.showInformationMessage('Automatic start of terminals is disabled');
        return;
    }

    // Get the commands from the configuration
    const devCommand = vscode.workspace.getConfiguration('optiDev').get<string>(devCommandKey, devCommandDefault);
    const cypressCommand = vscode.workspace.getConfiguration('optiDev').get<string>(cypressCommandKey, cypressCommandDefault);

    console.log(`Dev command: ${devCommand}`);
    console.log(`Cypress command: ${cypressCommand}`);

    // Function to find a terminal by name
    function findTerminal(name: string): vscode.Terminal | undefined {
        return vscode.window.terminals.find(terminal => terminal.name === name);
    }

    // Function to check if a terminal is running
    function isTerminalRunning(name: string): boolean {
        const lastRunKey = `optiDev.${name}LastRun`;
        const lastRun = context.workspaceState.get<number>(lastRunKey, 0);
        const now = Date.now();
        const isRunning = (now - lastRun) < 60000; // 1 minute
        if (!isRunning) {
            context.workspaceState.update(lastRunKey, now);
        }
        return isRunning;
    }

    // Create or reuse the first terminal (Dev Server)
    let terminal1 = findTerminal('Dev Server');
    if (terminal1) {
        if (!isTerminalRunning('Dev Server')) {
            terminal1.sendText(devCommand);
            terminal1.show();
            console.log('Reused Dev Server terminal and sent command');
        } else {
            console.log('Dev Server terminal is already running');
        }
    } else {
        terminal1 = vscode.window.createTerminal({ name: 'Dev Server', cwd: currentWorkspace });
        terminal1.sendText(devCommand);
        terminal1.show();
        console.log('Started new Dev Server terminal');
    }

    // Create or reuse the second terminal (Cypress)
    let terminal2 = findTerminal('Cypress');
    if (terminal2) {
        if (!isTerminalRunning('Cypress')) {
            terminal2.sendText(cypressCommand);
            terminal2.show();
            console.log('Reused Cypress terminal and sent command');
        } else {
            console.log('Cypress terminal is already running');
        }
    } else {
        terminal2 = vscode.window.createTerminal({ name: 'Cypress', cwd: currentWorkspace });
        terminal2.sendText(cypressCommand);
        terminal2.show();
        console.log('Started new Cypress terminal');
    }
}

async function configureCommand(commandKey: string, prompt: string) {
    const command = await vscode.window.showInputBox({ prompt });
    if (command) {
        await vscode.workspace.getConfiguration('optiDev').update(commandKey, command, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`${commandKey} set to: ${command}`);
    }
}

function checkConfiguration(context: vscode.ExtensionContext) {
    const devCommand = vscode.workspace.getConfiguration('optiDev').get<string>(devCommandKey);
    const cypressCommand = vscode.workspace.getConfiguration('optiDev').get<string>(cypressCommandKey);
    const startTerminalsOnStartup = vscode.workspace.getConfiguration('optiDev').get<boolean>(startTerminalsAutomaticallyKey, false);

    if (!devCommand || !cypressCommand || !startTerminalsOnStartup) {
        vscode.window.showWarningMessage(
            'OptiDev commands are not configured. Would you like to set them now?',
            'Yes', 'No'
        ).then(async selection => {
            if (selection === 'Yes') {
                await vscode.commands.executeCommand('optidev.configureDevCommand');
                await vscode.commands.executeCommand('optidev.configureCypressCommand');
                await vscode.commands.executeCommand('optidev.configureStartTerminalsOnStartup');
                vscode.window.showInformationMessage('All configurations are set and terminals started');
            }
        })
    } else {
        startTerminalsAutomatically(context);
    }
}

export function deactivate() {}

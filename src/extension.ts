import * as vscode from 'vscode';

let terminalCount = 0; // Track the number of terminals created

const OPTIDEV = 'optiDev';

// Constants for menu options
const CREATE_NEW_TERMINAL = 'Create New Terminal';
const EDIT_TERMINAL = 'Edit Terminal';
const DELETE_TERMINAL = 'Delete Terminal';
const SHOW_CURRENT_CONFIGURATION = 'Show Current Configuration';


// Constants for quick pick options
const YES = 'Yes';
const NO = 'No';

// Validate terminal name and command
const validateTerminalName = (text: string) => {
    if (text === '') {
        return 'Name cannot be empty';
    }
    return null;
}

const validateTerminalCommand = (text: string) => {
    if (text === '') {
        return 'Command cannot be empty';
    }
    return null;
}

function createNewTerminal(context: vscode.ExtensionContext) {
    vscode.window.showInputBox({ prompt: 'Enter command to run in new terminal', placeHolder: 'Terminal Command', validateInput: (text: string) => validateTerminalCommand(text)
     }).then(command => {
        if (command === undefined) {
            return;
        }
        vscode.window.showInputBox({ prompt: 'Enter a name for new terminal', placeHolder: 'Terminal Name', validateInput: 
            (text: string) => validateTerminalName(text)
         }).then(name => {
            if (name === undefined) {
                return;
            }
            const terminalName = `Terminal ${name ?? ++terminalCount}`;
            const terminal = vscode.window.createTerminal({ name: terminalName });
            vscode.window.showQuickPick([YES, NO], { placeHolder: 'Would you like to launch this terminal automatically ?' }).then(start => {
                if (start === YES) {
                    terminal.sendText(command);
                }
                terminal.show();
                // Save the new terminal configuration
                const terminalsConfig = vscode.workspace.getConfiguration(OPTIDEV).get<{ name: string, command: string, start: boolean }[]>('terminals', []);
                terminalsConfig.push({ name: terminalName, command, start: start === YES});
                console.log(`Terminals config: ${JSON.stringify(terminalsConfig)}`);
                vscode.workspace.getConfiguration(OPTIDEV).update('terminals', terminalsConfig, vscode.ConfigurationTarget.Workspace).then(() => {
                    console.log('Terminals configuration updated');
                    vscode.window.showInformationMessage(`Created ${terminalName} with command: ${command}`);
                });
            }
            );
        });
    });
}

async function editTerminal(context: vscode.ExtensionContext) {
    const terminalsConfig = vscode.workspace.getConfiguration(OPTIDEV).get<{ name: string, command: string, start: boolean }[]>('terminals', []);
    if (terminalsConfig.length === 0) {
        vscode.window.showInformationMessage('No terminals configured.');
        return;
    }

    const terminalNames = terminalsConfig.map(term => term.name);
    const selectedTerminal = await vscode.window.showQuickPick(terminalNames, { placeHolder: 'Select terminal to edit' });

    if (selectedTerminal) {
        const terminalConfig = terminalsConfig.find(term => term.name === selectedTerminal);

        if (terminalConfig) {
            const newCommand = await vscode.window.showInputBox({ prompt: 'Enter new command', value: terminalConfig.command });

            if (newCommand) {
                terminalConfig.command = newCommand;
                await vscode.window.showQuickPick([YES, NO], { placeHolder: 'Would you like to launch this terminal automatically ?' }).then(async start => {
                    terminalConfig.start = start === YES;
                    await vscode.workspace.getConfiguration(OPTIDEV).update('terminals', terminalsConfig, vscode.ConfigurationTarget.Workspace);
                    vscode.window.showInformationMessage(`Updated terminal "${selectedTerminal}" command to: ${newCommand}`);
                })
            }
        }
    }
}

async function deleteTerminal(context: vscode.ExtensionContext) {
    const terminals = vscode.workspace.getConfiguration(OPTIDEV).get<any[]>('terminals', []);
    if (terminals.length === 0) {
        vscode.window.showInformationMessage('No terminals to delete.');
        return;
    }

    const terminalNames = terminals.map(terminal => terminal.name);
    const terminalToDelete = await vscode.window.showQuickPick(terminalNames, { placeHolder: 'Select terminal to delete' });

    if (terminalToDelete) {
        const confirmation = await vscode.window.showWarningMessage(
            `Are you sure you want to delete the terminal configuration "${terminalToDelete}"?`,
            { modal: true, detail: 'This action cannot be undone.' },
            YES, NO
        );

        if (confirmation === YES) {
            const updatedTerminals = terminals.filter(terminal => terminal.name !== terminalToDelete);
            await vscode.workspace.getConfiguration(OPTIDEV).update('terminals', updatedTerminals, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage(`Terminal "${terminalToDelete}" has been deleted.`);
        } else {
            vscode.window.showInformationMessage('Delete action canceled.');
        }
    }
}

function showConfiguration() {

    const terminals = vscode.workspace.getConfiguration(OPTIDEV).get<
        { name: string, command: string, start: boolean }[]
    >('terminals', []);

    const quickPick = vscode.window.createQuickPick();
    const items: vscode.QuickPickItem[] = terminals.map<vscode.QuickPickItem>(terminal => ({ label: terminal.name, detail: terminal.command, description: terminal.start ? 'Auto-start enabled' : 'Auto-start disabled'}));
    items.push({ label: '$(arrow-left) Back', alwaysShow: true });
    quickPick.items = items;
    quickPick.placeholder = 'Current Configuration';
    quickPick.onDidChangeSelection(selection => {
        if (selection[0]) {
            if (selection[0].label === '$(arrow-left) Back') {
                quickPick.hide();
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
        { label: CREATE_NEW_TERMINAL, alwaysShow: true },
        { label: EDIT_TERMINAL, alwaysShow: true },
        { label: DELETE_TERMINAL, alwaysShow: true },
        { label: SHOW_CURRENT_CONFIGURATION, alwaysShow: true }
    ];

    const quickPick = vscode.window.createQuickPick();
    quickPick.items = items;
    quickPick.placeholder = 'Main Menu';
    quickPick.onDidChangeSelection(selection => {
        if (selection[0]) {
            quickPick.hide();
            if (selection[0].label === CREATE_NEW_TERMINAL) {
                vscode.commands.executeCommand('optidev.createNewTerminal');
            } else if (selection[0].label === EDIT_TERMINAL) {
                vscode.commands.executeCommand('optidev.editTerminal');
            } else if (selection[0].label === DELETE_TERMINAL) {
                vscode.commands.executeCommand('optidev.deleteTerminal');
            } else if (selection[0].label === SHOW_CURRENT_CONFIGURATION) {
                showConfiguration();
            }
        }
    });
    quickPick.show();
}

async function checkAndMigrateConfiguration(context: vscode.ExtensionContext) {
    // Check for the old configuration format
    const devCommand = vscode.workspace.getConfiguration(OPTIDEV).get<string>('devCommand');
    const cypressCommand = vscode.workspace.getConfiguration(OPTIDEV).get<string>('cypressCommand');
    const startTerminalsOnStartup = vscode.workspace.getConfiguration(OPTIDEV).get<boolean>('startTerminalsAutomatically');

    const legacyConfigExists = devCommand !== undefined && cypressCommand !== undefined && startTerminalsOnStartup !== undefined;
    console.log(`Migrating configuration from old format: ${
        JSON.stringify({ devCommand, cypressCommand, startTerminalsOnStartup })
    }`);

    if (legacyConfigExists) {
        // Migrate legacy configuration to new format
        const terminalsConfig = [
            { name: 'Dev Server', command: devCommand, start: startTerminalsOnStartup},
            { name: 'Cypress', command: cypressCommand, start: startTerminalsOnStartup}
        ];

        console.log(`Migrating configuration to new format: ${JSON.stringify(terminalsConfig)}`);
        await vscode.workspace.getConfiguration(OPTIDEV).update('terminals', terminalsConfig, vscode.ConfigurationTarget.Workspace).then(() => {
            console.log('Migrated configuration to new format');
        });
        await vscode.workspace.getConfiguration(OPTIDEV).update('devCommand', undefined, vscode.ConfigurationTarget.Workspace).then(() => {
            console.log('Removed old devCommand configuration');
        });
        await vscode.workspace.getConfiguration(OPTIDEV).update('cypressCommand', undefined, vscode.ConfigurationTarget.Workspace).then(() => {
            console.log('Removed old cypressCommand configuration');
        });
        await vscode.workspace.getConfiguration(OPTIDEV).update('startTerminalsAutomatically', undefined, vscode.ConfigurationTarget.Workspace).then(() => {
            console.log('Removed old startTerminalsAutomatically configuration');
        });
        vscode.window.showInformationMessage('Migrated existing configuration to new format.');
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "OptiDev: Terminals" is now active!');

    // Register commands with workspace configuration
    // Register the command to create a new terminal
    let createNewTerminalCommand = vscode.commands.registerCommand('optidev.createNewTerminal', () => {
        createNewTerminal(context);
    });

    let editTerminalCommand = vscode.commands.registerCommand('optidev.editTerminal', () => {
        editTerminal(context);
    });

    let deleteTerminalCommand = vscode.commands.registerCommand('optidev.deleteTerminal', () => {
        deleteTerminal(context);
    });

    let showCurrentConfig = vscode.commands.registerCommand('optidev.showCurrentConfig', () => {
        showConfiguration();
    });

    let showMainMenuCommand = vscode.commands.registerCommand('optidev.showMainMenu', () => {
        showMainMenu();
    });

    // Check configuration on startup
    checkConfiguration(context);

    context.subscriptions.push(createNewTerminalCommand, editTerminalCommand, deleteTerminalCommand, showCurrentConfig, showMainMenuCommand);
}

function startTerminalsAutomatically(context: vscode.ExtensionContext) {
    const currentWorkspace = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    if (!currentWorkspace) {
        vscode.window.showErrorMessage('No workspace folder is open');
        return;
    }

    console.log(`Current workspace: ${currentWorkspace}`);

    function findTerminal(name: string): vscode.Terminal | undefined {
        return vscode.window.terminals.find(terminal => terminal.name === name);
    }

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

    // Restore terminals on startup
    const terminalsConfig = vscode.workspace.getConfiguration(OPTIDEV).get<{ name: string, command: string, start: boolean }[]>('terminals', []);
    terminalsConfig.forEach(termConfig => {
        let t = findTerminal(termConfig.name);
        if (t) {
            if (!isTerminalRunning(termConfig.name)) {
                if (termConfig.start) {
                    t.show();
                    t.sendText(termConfig.command);
                    console.log(`Reused ${termConfig.name} terminal and sent command`);
                }    
            } else {
                console.log(`${termConfig.name} terminal is already running`);
            }
        } else {
            t = vscode.window.createTerminal({ name: termConfig.name, cwd: currentWorkspace });
            if (termConfig.start) {
                t.show();
                t.sendText(termConfig.command);
                console.log(`Started new ${termConfig.name} terminal`);
            }
        }
    });
}

async function checkConfiguration(context: vscode.ExtensionContext) {
        
    await checkAndMigrateConfiguration(context).then(async () => {
        console.log('Configuration check completed');
        const configuration = vscode.workspace.getConfiguration(OPTIDEV);
        let terminals = configuration.get<{ name: string, command: string, start: boolean }[]>('terminals');
        console.log(`Terminals configuration: ${JSON.stringify(terminals)}`);
    
        if (terminals === undefined || terminals.length === 0) {
            vscode.window.showWarningMessage(
                'OptiDev commands are not configured. Would you like to set them now?',
                YES, NO
            ).then(async selection => {
                if (selection === YES) {
                    await vscode.commands.executeCommand('optidev.createNewTerminal').then(() => {
                        vscode.window.showInformationMessage('All configurations are set and terminals started');
                    });
                }
            });
        } else {
            startTerminalsAutomatically(context);
        }
    });    
}

export function deactivate() {}

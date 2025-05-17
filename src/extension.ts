import * as vscode from "vscode";
import { TerminalTreeProvider } from "./terminalTreeProvider";
import { TerminalWebview } from "./terminalWebview";

let terminalCount = 0; // Track the number of terminals created

const OPTIDEV = "optiDev";
const YES = "Oui";
const NO = "Non";

function createNewTerminal(context: vscode.ExtensionContext) {
  TerminalWebview.createOrShow(context.extensionUri);
}

async function editTerminal(context: vscode.ExtensionContext, item?: any) {
  if (item && item.terminalData) {
    // Si appelé depuis le menu contextuel avec un item, éditer ce terminal
    TerminalWebview.createOrShow(context.extensionUri, item.terminalData);
  } else {
    // Si appelé depuis la commande globale, créer un nouveau terminal
    TerminalWebview.createOrShow(context.extensionUri);
  }
}

async function deleteTerminal(context: vscode.ExtensionContext, item?: any) {
  if (!item?.terminalData) {
    return;
  }

  const terminalName = item.terminalData.name;
  const confirmation = await vscode.window.showWarningMessage(
    `Êtes-vous sûr de vouloir supprimer le terminal "${terminalName}" ?`,
    { modal: true },
    YES,
    NO
  );

  if (confirmation === YES) {
    // Supprimer le terminal s'il est en cours d'exécution
    const terminal = vscode.window.terminals.find(
      (t) => t.name === terminalName
    );
    if (terminal) {
      terminal.dispose();
    }

    // Supprimer la configuration
    const terminals = vscode.workspace
      .getConfiguration(OPTIDEV)
      .get<any[]>("terminals", []);
    const updatedTerminals = terminals.filter((t) => t.name !== terminalName);
    await vscode.workspace
      .getConfiguration(OPTIDEV)
      .update(
        "terminals",
        updatedTerminals,
        vscode.ConfigurationTarget.Workspace
      );

    vscode.commands.executeCommand("optidev.refreshTerminals");
    vscode.window.showInformationMessage(
      `Terminal "${terminalName}" supprimé.`
    );
  }
}

async function checkAndMigrateConfiguration(context: vscode.ExtensionContext) {
  // Check for the old configuration format
  const devCommand = vscode.workspace
    .getConfiguration(OPTIDEV)
    .get<string>("devCommand");
  const cypressCommand = vscode.workspace
    .getConfiguration(OPTIDEV)
    .get<string>("cypressCommand");
  const startTerminalsOnStartup = vscode.workspace
    .getConfiguration(OPTIDEV)
    .get<boolean>("startTerminalsAutomatically");

  const legacyConfigExists =
    devCommand !== undefined &&
    cypressCommand !== undefined &&
    startTerminalsOnStartup !== undefined;
  console.log(
    `Migrating configuration from old format: ${JSON.stringify({
      devCommand,
      cypressCommand,
      startTerminalsOnStartup,
    })}`
  );

  if (legacyConfigExists) {
    // Migrate legacy configuration to new format
    const terminalsConfig = [
      {
        name: "Dev Server",
        command: devCommand,
        start: startTerminalsOnStartup,
      },
      {
        name: "Cypress",
        command: cypressCommand,
        start: startTerminalsOnStartup,
      },
    ];

    console.log(
      `Migrating configuration to new format: ${JSON.stringify(
        terminalsConfig
      )}`
    );
    await vscode.workspace
      .getConfiguration(OPTIDEV)
      .update(
        "terminals",
        terminalsConfig,
        vscode.ConfigurationTarget.Workspace
      )
      .then(() => {
        console.log("Migrated configuration to new format");
      });
    await vscode.workspace
      .getConfiguration(OPTIDEV)
      .update("devCommand", undefined, vscode.ConfigurationTarget.Workspace)
      .then(() => {
        console.log("Removed old devCommand configuration");
      });
    await vscode.workspace
      .getConfiguration(OPTIDEV)
      .update("cypressCommand", undefined, vscode.ConfigurationTarget.Workspace)
      .then(() => {
        console.log("Removed old cypressCommand configuration");
      });
    await vscode.workspace
      .getConfiguration(OPTIDEV)
      .update(
        "startTerminalsAutomatically",
        undefined,
        vscode.ConfigurationTarget.Workspace
      )
      .then(() => {
        console.log("Removed old startTerminalsAutomatically configuration");
      });
    vscode.window.showInformationMessage(
      "Migrated existing configuration to new format."
    );
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "OptiDev: Terminals" is now active!');

  // Initialiser le TreeView
  const terminalTreeProvider = new TerminalTreeProvider();
  const treeView = vscode.window.createTreeView("optidevTerminalsView", {
    treeDataProvider: terminalTreeProvider,
    showCollapseAll: true,
  });

  // Register commands with workspace configuration
  // Register the command to create a new terminal
  let createNewTerminalCommand = vscode.commands.registerCommand(
    "optidev.createNewTerminal",
    () => {
      createNewTerminal(context);
    }
  );

  let editTerminalCommand = vscode.commands.registerCommand(
    "optidev.editTerminal",
    (item) => {
      editTerminal(context, item);
    }
  );

  let deleteTerminalCommand = vscode.commands.registerCommand(
    "optidev.deleteTerminal",
    (item) => {
      deleteTerminal(context, item);
    }
  );

  let showTerminal = vscode.commands.registerCommand(
    "optidev.showTerminal",
    (terminalName: string) => {
      let terminal = vscode.window.terminals.find(
        (t) => t.name === terminalName
      );
      if (!terminal) {
        terminal = vscode.window.createTerminal(terminalName);
      }
      terminal.show();
    }
  );

  let executeCommand = vscode.commands.registerCommand(
    "optidev.executeCommand",
    (item: any) => {
      if (item?.terminalData) {
        const terminal = vscode.window.terminals.find(
          (t) => t.name === item.terminalData.name
        );
        if (terminal) {
          terminal.show();
          terminal.sendText(item.terminalData.command);
        }
      }
    }
  );

  let executeTerminal = vscode.commands.registerCommand(
    "optidev.executeTerminal",
    (terminalName: string, command: string) => {
      let terminal = vscode.window.terminals.find(
        (t) => t.name === terminalName
      );
      if (!terminal) {
        terminal = vscode.window.createTerminal(terminalName);
      }
      terminal.show();
    }
  );

  let refreshTerminals = vscode.commands.registerCommand(
    "optidev.refreshTerminals",
    () => {
      terminalTreeProvider.refresh();
    }
  );

  let startTerminal = vscode.commands.registerCommand(
    "optidev.startTerminal",
    (item: any) => {
      if (item?.terminalData) {
        vscode.commands.executeCommand(
          "optidev.executeTerminal",
          item.terminalData.name,
          item.terminalData.command
        );
      }
    }
  );

  let stopTerminal = vscode.commands.registerCommand(
    "optidev.stopTerminal",
    (item: any) => {
      const terminal = vscode.window.terminals.find(
        (t) => t.name === item.label
      );
      if (terminal) {
        terminal.dispose();
      }
    }
  );

  // Check configuration on startup
  checkConfiguration(context);

  context.subscriptions.push(
    createNewTerminalCommand,
    editTerminalCommand,
    deleteTerminalCommand,
    showTerminal,
    executeCommand,
    executeTerminal,
    refreshTerminals,
    startTerminal,
    stopTerminal,
    treeView
  );
}

function startTerminalsAutomatically(context: vscode.ExtensionContext) {
  const currentWorkspace = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  if (!currentWorkspace) {
    vscode.window.showErrorMessage("No workspace folder is open");
    return;
  }

  console.log(`Current workspace: ${currentWorkspace}`);

  function findTerminal(name: string): vscode.Terminal | undefined {
    return vscode.window.terminals.find((terminal) => terminal.name === name);
  }

  function isTerminalRunning(name: string): boolean {
    const lastRunKey = `optiDev.${name}LastRun`;
    const lastRun = context.workspaceState.get<number>(lastRunKey, 0);
    const now = Date.now();
    const isRunning = now - lastRun < 60000; // 1 minute
    if (!isRunning) {
      context.workspaceState.update(lastRunKey, now);
    }
    return isRunning;
  }

  // Restore terminals on startup
  const terminalsConfig = vscode.workspace
    .getConfiguration(OPTIDEV)
    .get<{ name: string; command: string; start: boolean }[]>("terminals", []);
  terminalsConfig.forEach((termConfig) => {
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
      t = vscode.window.createTerminal({
        name: termConfig.name,
        cwd: currentWorkspace,
      });
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
    console.log("Configuration check completed");
    const configuration = vscode.workspace.getConfiguration(OPTIDEV);
    let terminals =
      configuration.get<{ name: string; command: string; start: boolean }[]>(
        "terminals"
      );
    console.log(`Terminals configuration: ${JSON.stringify(terminals)}`);

    if (terminals === undefined || terminals.length === 0) {
      vscode.window
        .showWarningMessage(
          "OptiDev commands are not configured. Would you like to set them now?",
          YES,
          NO
        )
        .then(async (selection) => {
          if (selection === YES) {
            await vscode.commands
              .executeCommand("optidev.createNewTerminal")
              .then(() => {
                vscode.window.showInformationMessage(
                  "All configurations are set and terminals started"
                );
              });
          }
        });
    } else {
      startTerminalsAutomatically(context);
    }
  });
}

export function deactivate() {}

import * as vscode from "vscode";

export interface TerminalData {
  name: string;
  command: string;
  start: boolean;
}

export class TerminalTreeItem extends vscode.TreeItem {
  public readonly terminalData: TerminalData;

  constructor(
    public readonly label: string,
    public readonly terminalCommand: string,
    public readonly autoStart: boolean,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);

    this.terminalData = {
      name: this.label,
      command: this.terminalCommand,
      start: this.autoStart,
    };

    this.tooltip = `${this.label}\nCommande: ${
      this.terminalCommand
    }\nDémarrage auto: ${this.autoStart ? "Oui" : "Non"}`;
    this.description = this.autoStart ? "Auto-start" : "";

    // Icône de terminal standard
    this.iconPath = new vscode.ThemeIcon("terminal");

    // Au clic, on montre simplement le terminal
    this.command = {
      command: "optidev.showTerminal",
      title: "Afficher le terminal",
      arguments: [this.label],
    } as vscode.Command;

    // Contexte simple pour le menu
    this.contextValue = "terminal";
  }
}

export class TerminalTreeProvider
  implements vscode.TreeDataProvider<TerminalTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    TerminalTreeItem | undefined | null | void
  > = new vscode.EventEmitter<TerminalTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    TerminalTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private readonly OPTIDEV = "optiDev";

  constructor() {
    // Observer les changements de configuration
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(this.OPTIDEV)) {
        this.refresh();
      }
    });

    // Observer les changements de terminaux
    vscode.window.onDidOpenTerminal(() => this.refresh());
    vscode.window.onDidCloseTerminal(() => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TerminalTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TerminalTreeItem): Promise<TerminalTreeItem[]> {
    if (element) {
      return []; // Pas de sous-éléments pour le moment
    }

    const terminalsConfig = vscode.workspace
      .getConfiguration(this.OPTIDEV)
      .get<{ name: string; command: string; start: boolean }[]>(
        "terminals",
        []
      );

    return terminalsConfig
      .map(
        (terminal) =>
          new TerminalTreeItem(
            terminal.name,
            terminal.command,
            terminal.start,
            vscode.TreeItemCollapsibleState.None
          )
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }
}

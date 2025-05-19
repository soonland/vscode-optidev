import * as vscode from "vscode";

export class TerminalWebview {
  private static readonly panels = new Map<string, TerminalWebview>();
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.webview.html = this._getWebviewContent();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "updateTitle":
            this._panel.title = message.title;
            break;
          case "saveTerminal":
            const terminalConfig = message.terminal;
            const terminals = vscode.workspace
              .getConfiguration("optiDev")
              .get<any[]>("terminals", []);

            if (message.isEdit && terminalConfig.originalName) {
              const index = terminals.findIndex(
                (t) => t.name === terminalConfig.originalName
              );
              if (index >= 0) {
                terminals[index] = {
                  name: terminalConfig.name,
                  command: terminalConfig.command,
                  start: terminalConfig.autoStart,
                };
              }
            } else {
              terminals.push({
                name: terminalConfig.name,
                command: terminalConfig.command,
                start: terminalConfig.autoStart,
              });
            }

            await vscode.workspace
              .getConfiguration("optiDev")
              .update(
                "terminals",
                terminals,
                vscode.ConfigurationTarget.Workspace
              );

            // Refresh terminals view
            vscode.commands.executeCommand("optidev.refreshTerminals");

            // Show confirmation message
            const action = message.isEdit ? "modified" : "created";
            vscode.window.showInformationMessage(
              `Terminal "${terminalConfig.name}" ${action}.`
            );

            // Close only this specific panel
            this._panel.dispose();
            break;
        }
      },
      null,
      this._disposables
    );
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    terminalToEdit?: { name: string; command: string; start: boolean }
  ) {
    const terminalId = terminalToEdit
      ? terminalToEdit.name
      : `new-${Date.now()}`;

    // If a panel already exists for this terminal, show it
    if (TerminalWebview.panels.has(terminalId)) {
      TerminalWebview.panels.get(terminalId)?._panel.reveal();
      return;
    }

    // Create a new panel
    const panel = vscode.window.createWebviewPanel(
      "terminalEditor",
      terminalToEdit ? `Edit ${terminalToEdit.name}` : "New Terminal",
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    const webview = new TerminalWebview(panel, extensionUri);
    TerminalWebview.panels.set(terminalId, webview);

    // Remove the panel from the map when it is closed
    panel.onDidDispose(() => {
      TerminalWebview.panels.delete(terminalId);
    });

    if (terminalToEdit) {
      panel.webview.postMessage({
        command: "setTerminal",
        terminal: terminalToEdit,
      });
    }
  }

  private _getWebviewContent() {
    return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    padding: 20px;
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                }
                .form-group {
                    margin-bottom: 15px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                }
                input[type="text"] {
                    width: 100%;
                    padding: 5px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                }
                .checkbox-group {
                    margin-top: 15px;
                }
                button {
                    margin-top: 20px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    cursor: pointer;
                }
                button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <form id="terminalForm">
                <div class="form-group">
                    <label for="name">Terminal name:</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="command">Command:</label>
                    <input type="text" id="command" name="command" required>
                </div>
                <div class="checkbox-group">
                    <label>
                        <input type="checkbox" id="autoStart" name="autoStart">
                        Start automatically
                    </label>
                </div>
                <button type="submit">Save</button>
            </form>
            <script>
                const vscode = acquireVsCodeApi();
                let originalName = '';
                
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'setTerminal':
                            const terminal = message.terminal;
                            document.getElementById('name').value = terminal.name;
                            document.getElementById('command').value = terminal.command;
                            document.getElementById('autoStart').checked = terminal.start;
                            originalName = terminal.name;
                            break;
                    }
                });

                // Update title when name is entered
                document.getElementById('name').addEventListener('input', function(e) {
                    const inputElement = e.target;
                    const newName = inputElement.value;
                    if (newName) {
                        vscode.postMessage({
                            command: 'updateTitle',
                            title: originalName ? 'Edit ' + newName : 'New Terminal - ' + newName
                        });
                    }
                });

                document.getElementById('terminalForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    const name = document.getElementById('name').value;
                    const command = document.getElementById('command').value;
                    const autoStart = document.getElementById('autoStart').checked;
                    
                    vscode.postMessage({
                        command: 'saveTerminal',
                        terminal: {
                            name,
                            command,
                            autoStart,
                            originalName
                        },
                        isEdit: !!originalName
                    });
                });
            </script>
        </body>
        </html>`;
  }

  private dispose() {
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
    this._panel.dispose();
  }
}

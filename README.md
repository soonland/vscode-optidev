# VS Code Extension: Start Dev & Cypress Terminals

This VS Code extension allows you to configure and manage development and Cypress testing commands across multiple workspaces. You can easily set up commands, configure terminal behavior, and control whether terminals start automatically on workspace startup.


## Features

- **Start Terminals Automatically:** Configure whether terminals start automatically when the workspace opens.
- **Show Current Configuration:** View the current configuration settings for each workspace.
- **Create New Terminal:** Dynamically create new terminals with custom commands.
- **Edit Terminal Configuration:** Edit the command of an existing terminal.
- **Delete Terminal Configuration:** Delete an existing terminal configuration.
- **Persist Terminals Configuration:** Save and restore terminal configurations across sessions.


## Default Configuration

- **terminals**: `[]`

## Usage

### Available Commands

- `OptiDev: Show Current Configuration` - Display the current configuration settings for the active workspace.
- `OptiDev: Create New Terminal` - Create a new terminal with a custom command.
- `OptiDev: Edit Terminal` - Edit the command of an existing terminal.
- `OptiDev: Delete Terminal` - Delete an existing terminal configuration.
- `OptiDev: Show Main Menu` - Show the main menu with all available options.

### Creating New Terminals

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac).
2. Type `OptiDev: Create New Terminal` and press Enter.
3. Enter the command you want to run in the new terminal. The terminal configuration will be saved and restored on next startup.

### Editing a Terminal

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac).
2. Type `OptiDev: Edit Terminal` and press Enter.
3. Select the terminal you want to edit.
4. Enter the new command for the terminal. The updated configuration will be saved and restored on next startup.

### Deleting a Terminal

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac).
2. Type `OptiDev: Delete Terminal` and press Enter.
3. Select the terminal you want to delete. The configuration will be removed and not restored on next startup.

### Migrating Existing Configuration

If you have previously configured the extension, your settings will be automatically migrated to the new format the next time you activate the extension.

## Initial Configuration

If the commands are not configured, the extension will prompt you to configure them at startup. You can also configure them manually via the main menu.

### Configuration

You can configure the extension settings for each workspace individually. The settings can be adjusted via the `settings.json` file or through the provided commands.

Access the main menu by using the command palette `(Cmd/Ctrl + Shift + P)`. The main menu provides the following options:

- **Configure Dev Command:**
    - Allows you to set the command that will be used to start your development server.
    - By default, this is set to `npm run dev`.

- **Configure Cypress Command:**
    - Allows you to set the command that will be used to start Cypress for testing.
    - By default, this is set to `npm run cypress:open`.

- **Configure Start Terminals Automatically:**
    - Allows you to enable or disable the automatic start of terminals when VS Code starts.
    - This can be set to `Yes` or `No`.

- **Show Current Configuration:**
    - Displays the current configuration settings including the development command, Cypress command, and whether automatic terminal start is enabled.

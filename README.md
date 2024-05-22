# VS Code Extension: Start Dev & Cypress Terminals

This VS Code extension allows you to configure and automatically start terminals for development and Cypress testing commands.

## Features

- Configure and automatically start terminals for development and Cypress commands.
- Display and modify the current configuration from an intuitive menu.

## Default Configuration

- **Dev Command**: `npm run dev`
- **Cypress Command**: `npm run cypress:open`

## Usage

### Available Commands

- `OptiDev: Start Dev and Cypress`: Starts the configured terminals.
- `OptiDev: Configure Dev Server Command`: Configures the development command.
- `OptiDev: Configure Cypress Command`: Configures the Cypress command.
- `OptiDev: Configure Start On Startup`: Configures the automatic start of terminals on VS Code startup.
- `OptiDev: Show Current Configuration`: Displays the current configuration.

## Initial Configuration

If the commands are not configured, the extension will prompt you to configure them at startup. You can also configure them manually via the main menu.

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

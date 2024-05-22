# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-05-21

### Added
- Initial release of the "OptiDev: Start Terminals" VS Code extension.
- Feature to configure and automatically start terminals for development and Cypress commands.
- Main menu to access the following options:
  - Configure Dev Command: Allows setting the command for starting the development server.
  - Configure Cypress Command: Allows setting the command for starting Cypress testing.
  - Configure Start Terminals Automatically: Option to enable or disable automatic terminal startup.
  - Show Current Configuration: Displays the current configuration settings.
- Commands:
  - `optidev.startTerminals`: Starts the configured terminals.
  - `optidev.configureDevCommand`: Configures the development command.
  - `optidev.configureCypressCommand`: Configures the Cypress command.
  - `optidev.configureStartTerminalsOnStartup`: Configures the automatic start of terminals on VS Code startup.
  - `optidev.showCurrentConfig`: Displays the current configuration.
  - `optidev.showMainMenu`: Displays the main menu to access other commands.
- Automatic terminal management:
  - Automatically start terminals on VS Code startup if configured.
  - Reuse existing terminals if they are already running.
- User prompts for initial configuration if commands are not set.

## [Unreleased]

### Planned Features
- Additional customization options for terminal commands.
- Improved error handling and user feedback.
- Support for multiple workspace folders.


# PlantUML renders only via a user-configured server

PlantUML diagram rendering requires a PlantUML Server Base URL configured in VS Code Settings (Settings UI). If none is configured, the extension shows a preview placeholder and prompts the user; it does not send diagram source to any default or third-party host (including plantuml.com). Server authentication is permanently out of scope: only servers reachable without auth headers or credentials are supported.

# MCP Registry

## Overview

The MetaMCP Registry acts as a central hub for discovering and installing MCP servers. It provides access to a curated list of tools and integrations, making it easy to extend your environment.

## Features

*   **Centralized Discovery**: Browse a comprehensive catalog of MCP servers from verified sources.
*   **One-Click Install**: Quickly install popular servers using pre-configured templates.
*   **Metadata Integration**: View detailed information, including descriptions, authors, and required dependencies.
*   **User Interface**: Accessible via the `/registry` page.

## Usage

### Browsing the Registry

1.  Navigate to the **Registry** page from the sidebar.
2.  **Search**: Use the search bar to find specific servers by name or keyword.
3.  **Filter**: Browse categories (e.g., Development, Utilities, AI).

### Installing a Server

1.  **Select**: Click on a server card to view details.
2.  **Verified Badge**: Look for the "Verified" badge to ensure the server is officially supported.
3.  **One-Click Install**: For supported servers, click the **Install** button.
    *   **Configuration**: Follow the prompts to configure any required environment variables or settings.
    *   **Templates**: Installation uses predefined JSON templates for consistency.
4.  **Manual Installation**: If a template is not available, follow the instructions provided in the server's repository or documentation.

## Server Templates

The Registry leverages a template system (`server-templates.json`) to streamline installation. These templates define the necessary configuration parameters, reducing manual setup steps.

*   **Verified**: Servers with templates are marked as "Verified".
*   **Community**: Other servers may require manual configuration.

## Contributing to the Registry

To add a new server to the registry or update an existing one, please refer to the `CONTRIBUTING.md` guide in the repository root.

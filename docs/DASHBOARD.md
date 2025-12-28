# Project Dashboard

## Overview
This dashboard provides an overview of the project structure, including all applications and packages (submodules).

**Current Version:** 3.1.0
**Last Updated:** 2025-12-27

## Project Structure

The project is a monorepo managed with **Turbo** and **PNPM**.

*   **`apps/`**: Contains the main applications.
*   **`packages/`**: Contains shared libraries and configurations used by the apps.
*   **`docs/`**: Project documentation.

## Submodules (Packages & Apps)

| Name | Type | Version | Location | Description |
| :--- | :--- | :--- | :--- | :--- |
| **backend** | App | 3.0.3 | `apps/backend` | Bare minimum Express 5.1 backend with TypeScript |
| **frontend** | App | 3.0.3 | `apps/frontend` | Next.js frontend application |
| **@repo/eslint-config** | Package | 0.0.0 | `packages/eslint-config` | Shared ESLint configurations |
| **@repo/trpc** | Package | 0.0.0 | `packages/trpc` | Shared tRPC router and definitions |
| **@repo/typescript-config** | Package | 0.0.0 | `packages/typescript-config` | Shared TypeScript configurations |
| **@repo/zod-types** | Package | 1.0.0 | `packages/zod-types` | Shared Zod schemas and types |

## Build Information

*   **Build System**: Turbo
*   **Package Manager**: PNPM
*   **Node Version**: >=18

## Recent Updates

*   **Agent Functionality**: Implemented autonomous agent capabilities.
*   **Upstream Sync**: Merged latest changes from upstream repository.

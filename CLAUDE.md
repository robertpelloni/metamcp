# Claude Instructions

> **⚠️ IMPORTANT**: The central source of truth for all LLM instructions is **[LLM_INSTRUCTIONS.md](LLM_INSTRUCTIONS.md)**. Please refer to that file for universal directives, architecture, and workflows.

## Claude-Specific Guidelines

*   **Tool Usage**: Prefer using `run_in_bash_session` for file operations over individual `read_file`/`write_file` calls when performing bulk operations, but verify each step.
*   **Reasoning**: Show your work. Explain *why* you are making a change before you make it.
*   **Context**: You have a large context window. Use it to read related files before proposing a solution.
*   **Refactoring**: When refactoring, always ensure you have a rollback plan (e.g., keeping the old file until the new one is verified).

## Key Links

*   [LLM_INSTRUCTIONS.md](LLM_INSTRUCTIONS.md) - **Read this first!**
*   [AGENTS.md](AGENTS.md) - Operational directives.
*   [docs/ROADMAP.md](docs/ROADMAP.md) - Current feature status.

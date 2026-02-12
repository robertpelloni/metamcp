# Gemini Instructions

> **⚠️ IMPORTANT**: The central source of truth for all LLM instructions is **[LLM_INSTRUCTIONS.md](LLM_INSTRUCTIONS.md)**. Please refer to that file for universal directives, architecture, and workflows.

## Gemini-Specific Guidelines

*   **Multimodal Tasks**: If you are asked to process images or other media, use the available `view_image` or `read_image_file` tools.
*   **Conciseness**: Be direct and concise in your responses. Focus on the code and the solution.
*   **Safety**: Always double-check generated code for potential security vulnerabilities, especially when using `eval` or executing shell commands (which should be avoided unless strictly necessary and sandboxed).

## Key Links

*   [LLM_INSTRUCTIONS.md](LLM_INSTRUCTIONS.md) - **Read this first!**
*   [AGENTS.md](AGENTS.md) - Operational directives.
*   [docs/ROADMAP.md](docs/ROADMAP.md) - Current feature status.

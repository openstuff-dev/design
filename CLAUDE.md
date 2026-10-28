<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## OpenPurpose (shared rules and learnings)

We keep our purpose, business logic, glossary, guidelines and learnings in
OpenPurpose, available through the `openpurpose` MCP server. Rules come in layers: our
organization, the project and the part of the code you are in (a repository or a folder).

1. Before you start a task, call `get_context` with:
   - `remote_url` from `git remote get-url origin`
   - `project` from `.openpurpose.json` if that file exists
   - `path`: the file or folder you are about to work on
   - `manifests`: the nearest `package.json`, `*.csproj` or similar, with its content
   Follow what it returns. More specific rules override general ones.
2. When you move to a different part of the repo (for example from `frontend/`
   to `backend/`), call `get_context` again with the new path and manifest.
3. If no project is found, ask me which project this repo belongs to, then call
   `register_repository` (or `create_project`) and create `.openpurpose.json`.
4. When I correct you and the correction should apply next time, call
   `propose_learning` with the same remote/path/manifests. Say in one line that
   you did. Do not propose one-off preferences or task-specific details.
5. Never try to change a section marked `locked`.
6. `[[name]]` in OpenPurpose text links to another project or a glossary term, and
   `[[org/name]]` to a project in another organization. Use `get_related` when
   your task touches a linked service.
7. If `get_context` lists "Review feedback waiting on you", read it with
   `get_review` before other work. Answer each thread with `reply_to_review`,
   accept suggestions you agree with via `apply_suggestion`, and push other
   fixes with `revise_proposal`. Tell me in one line what the reviewer asked for.
8. When you call or implement an HTTP endpoint of this or a linked service, use
   `get_api` (listed under "APIs" in `get_context`) for the exact paths,
   parameters and DTOs. Don't guess request or response shapes.
9. When you notice a real problem outside your task, don't fix it: call
   `report_finding` with the file, a one-line title, what's wrong and how you
   would fix it. Say in one line that you did. If `get_context` lists known
   findings, don't report them again, and ask me before fixing one. After fixing
   one, call `resolve_finding` with the commit or PR.

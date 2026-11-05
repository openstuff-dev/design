## 0.3.1 (2026-11-05)

### 🩹 Fixes

- The generated server answers a missing file with a 404 instead of `index.html`, so a tab on an old build recovers instead of showing a blank page. ([5b38ea3](https://github.com/openstuff-dev/design/commit/5b38ea3))

### 🧱 Updated Dependencies

- Updated ui to 0.1.5

### ❤️ Thank You

- Turmz @Turmz

## 0.3.0 (2026-11-04)

### 🚀 Features

- Added a `check` glyph to the `site` generator, for OpenUsecase's mark. ([3a36b4c](https://github.com/openstuff-dev/design/commit/3a36b4c))

### 🩹 Fixes

- Cleared host `title` attributes on titled components, defaulted `os-tab` values to their labels, added `^build` dependencies to `test`/`typecheck`/`lint` targets, and updated the web-server `Dockerfile` when workspace libraries are added. ([32e929b](https://github.com/openstuff-dev/design/commit/32e929b))
- Updated the workspace `AGENTS.md` template so agents check `list_scopes`, suggest missing scopes with `create_scope`, propose missing documents, and link domain terms and projects with `[[...]]`. ([2355505](https://github.com/openstuff-dev/design/commit/2355505))
- Fixed the `.os-shell` narrow drawer animating shut on page load, truncated long `.os-select` options with an ellipsis and matched its `base-select` chevron to the fallback, cross-faded loading `.os-button` labels and spinners in a fixed box, normalised `.gitignore` entries and skipped ignored files in `sync`, and documented 2FA approval of staged npm releases. ([44a2ecb](https://github.com/openstuff-dev/design/commit/44a2ecb))

### 🧱 Updated Dependencies

- Updated ui to 0.1.4

### ❤️ Thank You

- Turmz @Turmz

## 0.2.2 (2026-10-30)

### 🩹 Fixes

- Added the ux-details skill to every workspace: new projects get `.claude/skills/ux-details/SKILL.md`, and `sync` adds it to older ones. ([f6553a3](https://github.com/openstuff-dev/design/commit/f6553a3))

### ❤️ Thank You

- Turmz @Turmz

## 0.2.1 (2026-10-30)

### 🧱 Updated Dependencies

- Updated ui to 0.1.3

## 0.2.0 (2026-10-30)

### 🚀 Features

- New: marketing pages. `@openstuff-dev/ui/marketing.css` and `@openstuff-dev/ui/marketing` give every OpenStuff project the same one-page site, with a bento grid whose tiles animate only on hover, focus or tap, and `npx nx g @openstuff-dev/nx:site OpenLedger` creates one in `site/`, ready for GitHub Pages. `sync` keeps the site's copy of the toolkit up to date. ([19f52af](https://github.com/openstuff-dev/design/commit/19f52af))

### 🧱 Updated Dependencies

- Updated ui to 0.1.2

### ❤️ Thank You

- Turmz @Turmz

## 0.1.0 (2026-10-29)

### 🚀 Features

- Started the OpenStuff toolkit: empty tokens, ui, lint, nx and create-app packages that build and publish together. ([6953bf8](https://github.com/openstuff-dev/design/commit/6953bf8))
- Added `npm create @openstuff-dev/app`: it asks for a name, a stack (web app and server, web app, or package) and a primary colour, and sets up an Nx workspace with the OpenStuff toolkit, lint, CI, Docker, a licence and agent instructions; @openstuff-dev/nx has generators for apps, servers, packages and components, and `sync` brings older workspaces up to date. ([5e21843](https://github.com/openstuff-dev/design/commit/5e21843))

### ❤️ Thank You

- Turmz @Turmz
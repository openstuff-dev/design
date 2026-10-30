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
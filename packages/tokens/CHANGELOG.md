## 0.1.0 (2026-10-29)

### 🚀 Features

- Started the OpenStuff toolkit: empty tokens, ui, lint, nx and create-app packages that build and publish together. ([6953bf8](https://github.com/openstuff-dev/design/commit/6953bf8))
- Added the theme generator: `generateTheme(primaryColor)` makes brand, neutral, status and identity colours in OKLCH, with every text and background pair passing WCAG AA in light and dark. `os-tokens` builds `tokens.css` (one `:root` block, every colour a `light-dark()` pair), typed `tokens.js`, and DTCG `tokens.json` from a project's `tokens.config.json`, and `applyTheme` themes part of a page at runtime. ([42710e7](https://github.com/openstuff-dev/design/commit/42710e7))

### ❤️ Thank You

- Turmz @Turmz
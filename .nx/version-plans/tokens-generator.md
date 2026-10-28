---
tokens: minor
---

Added the theme generator: `generateTheme(primaryColor)` makes brand, neutral, status and identity colours in OKLCH, with every text and background pair passing WCAG AA in light and dark. `os-tokens` builds `tokens.css` (one `:root` block, every colour a `light-dark()` pair), typed `tokens.js`, and DTCG `tokens.json` from a project's `tokens.config.json`, and `applyTheme` themes part of a page at runtime.

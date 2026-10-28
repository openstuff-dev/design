---
ui: minor
lint: patch
---

Added the CSS foundation to `@openstuff-dev/ui`: cascade layers (`os.reset`, `os.tokens`, `os.base`, `os.components`, `os.utilities`), a reset, base styles from the tokens (focus ring, `accent-color`, dialog and popover surfaces with enter and exit transitions), and `loadPolyfills()`, which loads only the polyfills a browser needs for popover, invoker commands, `closedby`, `interestfor` and anchor positioning. The shared Stylelint config now wants `@import` with a plain string.

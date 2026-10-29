## 0.1.0 (2026-10-29)

### 🚀 Features

- Started the OpenStuff toolkit: empty tokens, ui, lint, nx and create-app packages that build and publish together. ([6953bf8](https://github.com/openstuff-dev/design/commit/6953bf8))
- Added the shared lint setup: `@openstuff-dev/lint/eslint` (strict, type-checked TypeScript, ESLint Stylistic, Nx module boundaries), `@openstuff-dev/lint/eslint/angular` (OnPush, signals, control flow, accessible templates, inline templates formatted with Prettier), `@openstuff-dev/lint/stylelint` (no raw colours outside token files, no `prefers-color-scheme`, viewport width queries only in layout files) and `@openstuff-dev/lint/prettier`. ([5a8fc6a](https://github.com/openstuff-dev/design/commit/5a8fc6a))
- Added what OpenPurpose needed while moving onto the toolkit: ([](https://github.com/openstuff-dev/design/commit/))
  - **Link tabs:** `.os-tab` works on `<a>`, with `aria-current="page"` marking the active one.
  - **Danger links:** `tone="danger"` on a link button.
  - **Callouts:** an `.os-callout-body` that starts and ends flush, and a `level` input that makes the title a heading.
  - **Empty states and toasts:** empty states no longer show an empty paragraph, and at most four toasts show at once.
  - **Setting cards** without a title, which keep the label the page gives them.
  - **Page headers:** an `align="start"` option and an `os-page-meta` slot under the description.
  - **Stat tiles** that hold content such as a sparkline.
  - **Popovers, menus and tooltips:** an `align="end"` option.
  - **Fields:** `Control` keeps an `aria-describedby` written in the template.

  The shared ESLint config now allows template literals and lets `||` fall back on a blank string.


### 🩹 Fixes

- Added the CSS foundation to `@openstuff-dev/ui`: cascade layers (`os.reset`, `os.tokens`, `os.base`, `os.components`, `os.utilities`), a reset, base styles from the tokens (focus ring, `accent-color`, dialog and popover surfaces with enter and exit transitions), and `loadPolyfills()`, which loads only the polyfills a browser needs for popover, invoker commands, `closedby`, `interestfor` and anchor positioning. The shared Stylelint config now wants `@import` with a plain string. ([af45069](https://github.com/openstuff-dev/design/commit/af45069))
- Added the components: buttons, icons, badges, fields and form controls, segmented controls, callouts, empty states, dialogs, drawers, popovers, menus, tooltips, a command palette, toasts, page layout, tabs, settings cards and data tables, as CSS in @openstuff-dev/ui and as Angular components in the new @openstuff-dev/ui-angular; the shared Angular lint config now allows directives with empty classes. ([462b344](https://github.com/openstuff-dev/design/commit/462b344))

### ❤️ Thank You

-  on strings
- Turmz @Turmz
## 0.1.3 (2026-10-30)

### 🧱 Updated Dependencies

- Updated ui to 0.1.3

## 0.1.2 (2026-10-30)

### 🧱 Updated Dependencies

- Updated ui to 0.1.2

## 0.1.1 (2026-10-29)

### 🩹 Fixes

- The `os-tokens` command is back in `@openstuff-dev/tokens`: npm 12 dropped it from 0.1.0 when publishing, because its path started with `./`. `@openstuff-dev/ui` and `@openstuff-dev/ui-angular` now accept newer patch and minor releases of the packages they build on (`^0.1.0`) instead of one exact version. ([7575a5f](https://github.com/openstuff-dev/design/commit/7575a5f))

### 🧱 Updated Dependencies

- Updated ui to 0.1.1

### ❤️ Thank You

- Turmz @Turmz

## 0.1.0 (2026-10-29)

### 🚀 Features

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

- Added the components: buttons, icons, badges, fields and form controls, segmented controls, callouts, empty states, dialogs, drawers, popovers, menus, tooltips, a command palette, toasts, page layout, tabs, settings cards and data tables, as CSS in @openstuff-dev/ui and as Angular components in the new @openstuff-dev/ui-angular; the shared Angular lint config now allows directives with empty classes. ([462b344](https://github.com/openstuff-dev/design/commit/462b344))

### 🧱 Updated Dependencies

- Updated lint to 0.1.0
- Updated ui to 0.1.0

### ❤️ Thank You

-  on strings
- Turmz @Turmz
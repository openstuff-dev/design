## 0.1.10 (2026-11-09)

### 🩹 Fixes

- Setting cards get a body: `.os-setting-card-body` in `@openstuff-dev/ui` and `[os-setting-card-body]` in `@openstuff-dev/ui-angular` pad free content (a list, a row of fields, a callout) like a row, so it no longer touches the card's edge. `@openstuff-dev/ui-angular` now exports `slowLoading()` and `onReturn()`, which every app had copied into `core/loading.ts`: a skeleton shows only when a load is slow, and stays until the last of several loads ends. ([0a2415f](https://github.com/openstuff-dev/design/commit/0a2415f))

### 🧱 Updated Dependencies

- Updated ui to 0.1.9

### ❤️ Thank You

- Turmz @Turmz

## 0.1.9 (2026-11-09)

### 🩹 Fixes

- Connection strings can now hold an OpenAnnounce publish key, and `@openstuff-dev/server/connection-string` reads and makes them in the browser too. `SecretDialog` takes an optional `connection` and shows that string under the secret, with its own copy button. ([5835b89](https://github.com/openstuff-dev/design/commit/5835b89))

### ❤️ Thank You

- Turmz @Turmz

## 0.1.8 (2026-11-09)

### 🩹 Fixes

- Added what an app's web build needs to use its server connections. `@openstuff-dev/ui` adds `startServerIntegrations`: it reads `/api/client-config` and starts OpenVersion and OpenAnnounce with loaders the app passes in, so their packages are only loaded when connected. It never throws, and leaves OpenVersion off for a build that doesn't know its version. `@openstuff-dev/server` adds `GET /api/openannounce-token` when an app passes `announceUser`: it signs who is signed in with the saved OpenAnnounce secret, so messages can be aimed at a tenant, a role or both (`announceGroups`). `@openstuff-dev/ui` also exports `announceGroups` and `allAnnounceGroups`, so the web lists the same names. Without a secret it answers 204 and people see what's for everyone. `@openstuff-dev/ui-angular`'s connection card now says when OpenAnnounce has no signing secret that people only see messages aimed at everyone, shows content placed inside it once connected, and adds `os-announce-groups`: the group names to create in OpenAnnounce, with one copy button. ([907e369](https://github.com/openstuff-dev/design/commit/907e369))

### 🧱 Updated Dependencies

- Updated ui to 0.1.8

### ❤️ Thank You

- Turmz @Turmz

## 0.1.7 (2026-11-09)

### 🩹 Fixes

- Added connection strings and a ready-made card for server connections. `@openstuff-dev/server` takes a pasted `connectionString` (`openversion+…` or `openannounce+…`) on save and test, refuses one from the other product by name, and exports `makeConnectionString` and `parseConnectionString`; each card now says which secret it takes (`secret`) and which address to copy when the other system must allow it (`copy`). `@openstuff-dev/ui-angular` adds `os-server-connection-card`: paste or enter the details, see the test result with its fix, test again, change or remove after a confirmation. Each app passes a small client around its own API service. ([f277ad9](https://github.com/openstuff-dev/design/commit/f277ad9))

### 🧱 Updated Dependencies

- Updated ui to 0.1.7

### ❤️ Thank You

- Turmz @Turmz

## 0.1.6 (2026-11-05)

### 🩹 Fixes

- Stopped the Settings menu from making the whole page scroll sideways on a narrow screen. ([0fda019](https://github.com/openstuff-dev/design/commit/0fda019))

### 🧱 Updated Dependencies

- Updated ui to 0.1.6

### ❤️ Thank You

- Turmz @Turmz

## 0.1.5 (2026-11-05)

### 🩹 Fixes

- Added everything a Settings page needs: `os-settings` with its menu and groups, `os-section-header`, `os-setting-item`, `os-integration-card`, `SecretDialog`, `os-copy-button`, `os-code-block`, `Theme` with `provideTheme` and `os-theme-picker`, and `os-file-input`. Added `a[os-nav-link]` for the app sidebar, with the same look as the Settings menu. `os-field` takes `optional` and an `os-field-label`, and `os-data-table` shows a projected `os-empty-state` when it has no rows. ([1ab47ff](https://github.com/openstuff-dev/design/commit/1ab47ff))

### 🧱 Updated Dependencies

- Updated ui to 0.1.5

### ❤️ Thank You

- Turmz @Turmz

## 0.1.4 (2026-11-04)

### 🩹 Fixes

- Cleared host `title` attributes on titled components, defaulted `os-tab` values to their labels, added `^build` dependencies to `test`/`typecheck`/`lint` targets, and updated the web-server `Dockerfile` when workspace libraries are added. ([32e929b](https://github.com/openstuff-dev/design/commit/32e929b))
- Fixed the `.os-shell` narrow drawer animating shut on page load, truncated long `.os-select` options with an ellipsis and matched its `base-select` chevron to the fallback, cross-faded loading `.os-button` labels and spinners in a fixed box, normalised `.gitignore` entries and skipped ignored files in `sync`, and documented 2FA approval of staged npm releases. ([44a2ecb](https://github.com/openstuff-dev/design/commit/44a2ecb))

### 🧱 Updated Dependencies

- Updated ui to 0.1.4

### ❤️ Thank You

- Turmz @Turmz

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
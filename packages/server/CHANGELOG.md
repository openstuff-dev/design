## 0.4.0 (2026-11-09)

### 🚀 Features

- Added connection strings and a ready-made card for server connections. `@openstuff-dev/server` takes a pasted `connectionString` (`openversion+…` or `openannounce+…`) on save and test, refuses one from the other product by name, and exports `makeConnectionString` and `parseConnectionString`; each card now says which secret it takes (`secret`) and which address to copy when the other system must allow it (`copy`). `@openstuff-dev/ui-angular` adds `os-server-connection-card`: paste or enter the details, see the test result with its fix, test again, change or remove after a confirmation. Each app passes a small client around its own API service. ([f277ad9](https://github.com/openstuff-dev/design/commit/f277ad9))

### ❤️ Thank You

- Turmz @Turmz

## 0.3.1 (2026-11-09)

### 🩹 Fixes

- Saved connection secrets are reused only for the address they were saved for, so changing a connection's address never sends them to the new one. A saved secret the current key can't open now answers 400 and asks to be entered again, instead of failing with a server error. ([e8e32d2](https://github.com/openstuff-dev/design/commit/e8e32d2))

### ❤️ Thank You

- Turmz @Turmz

## 0.3.0 (2026-11-09)

### 🚀 Features

- Added a deploy token to the OpenVersion connection, stored encrypted in its own column and checked when it's saved, and `publishVersionOnStart`, so every app publishes its own version to OpenVersion the same way. Apps upgrading from 0.2.0 run `serverIntegrationsDeployTokenSql` first. ([eaa7929](https://github.com/openstuff-dev/design/commit/eaa7929))

### ❤️ Thank You

- Turmz @Turmz

## 0.2.0 (2026-11-08)

### 🚀 Features

- Added the server-wide integration routes to `@openstuff-dev/server`: the OpenVersion and OpenAnnounce checks, the `server_integrations` table, and the routes that save, test, disconnect and publish their public values. ([c4b8ad3](https://github.com/openstuff-dev/design/commit/c4b8ad3))

### 🩹 Fixes

- Added `@openstuff-dev/server`, with the guarded fetch and encrypted storage for integration keys. ([094cb16](https://github.com/openstuff-dev/design/commit/094cb16))

### ❤️ Thank You

- Turmz @Turmz
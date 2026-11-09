---
server: minor
ui-angular: patch
ui: patch
---

Added connection strings and a ready-made card for server connections. `@openstuff-dev/server` takes a pasted `connectionString` (`openversion+…` or `openannounce+…`) on save and test, refuses one from the other product by name, and exports `makeConnectionString` and `parseConnectionString`; each card now says which secret it takes (`secret`) and which address to copy when the other system must allow it (`copy`). `@openstuff-dev/ui-angular` adds `os-server-connection-card`: paste or enter the details, see the test result with its fix, test again, change or remove after a confirmation. Each app passes a small client around its own API service.

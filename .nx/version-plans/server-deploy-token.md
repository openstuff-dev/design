---
server: minor
---

Added a deploy token to the OpenVersion connection, stored encrypted in its own column and checked when it's saved, and `publishVersionOnStart`, so every app publishes its own version to OpenVersion the same way. Apps upgrading from 0.2.0 run `serverIntegrationsDeployTokenSql` first.

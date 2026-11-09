---
server: minor
ui: minor
---

Added what an app's web build needs to use its server connections. `@openstuff-dev/ui` adds `startServerIntegrations`: it reads `/api/client-config` and starts OpenVersion and OpenAnnounce with loaders the app passes in, so their packages are only loaded when connected. It never throws, and leaves OpenVersion off for a build that doesn't know its version. `@openstuff-dev/server` adds `GET /api/openannounce-token` when an app passes `announceUser`: it signs who is signed in with the saved OpenAnnounce secret, so messages can be aimed at a tenant, a role or both (`announceGroups`). Without a secret it answers 204 and people see what's for everyone.

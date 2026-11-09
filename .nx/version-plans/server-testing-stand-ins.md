---
server: minor
---

Added `@openstuff-dev/server/testing`: stand-ins for OpenVersion and OpenAnnounce that answer this package's checks and publish as the real ones do, so an app tests its own connection wiring without copying a fake server.

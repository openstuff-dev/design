---
tokens: patch
ui: patch
ui-angular: patch
---

The `os-tokens` command is back in `@openstuff-dev/tokens`: npm 12 dropped it from 0.1.0 when publishing, because its path started with `./`. `@openstuff-dev/ui` and `@openstuff-dev/ui-angular` now accept newer patch and minor releases of the packages they build on (`^0.1.0`) instead of one exact version.

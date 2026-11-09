---
ui: minor
ui-angular: minor
---

Setting cards get a body: `.os-setting-card-body` in `@openstuff-dev/ui` and `[os-setting-card-body]` in `@openstuff-dev/ui-angular` pad free content (a list, a row of fields, a callout) like a row, so it no longer touches the card's edge. `@openstuff-dev/ui-angular` now exports `slowLoading()` and `onReturn()`, which every app had copied into `core/loading.ts`: a skeleton shows only when a load is slow, and stays until the last of several loads ends.

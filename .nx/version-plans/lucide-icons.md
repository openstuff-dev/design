---
ui: patch
---

Icons from `lucide` type-check as `IconNode` without a cast: attributes may be undefined, and `createIcon` and `renderIcon` skip them.

---
ui: minor
ui-angular: minor
lint: minor
---

Added what OpenPurpose needed while moving onto the toolkit:
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

# @openstuff-dev/ui

The framework-neutral layer every OpenStuff app builds on: cascade layers, a reset, base styles
from the `--os-*` tokens, every component as CSS classes, and native overlays (`<dialog>`,
`popover`) with polyfills for browsers that lack the newer parts. Angular apps use
[`@openstuff-dev/ui-angular`](../ui-angular), which renders this markup and adds the behaviour.

## Use it

```css
/* styles.css */
@import '@openstuff-dev/ui/ui.css';
@import './tokens/tokens.css' layer(os.tokens); /* from os-tokens, or @openstuff-dev/tokens/tokens.css */
```

```ts
// main.ts
import { loadPolyfills } from '@openstuff-dev/ui/polyfills';

await loadPolyfills();
```

In plain HTML, link `ui.css` and import the tokens into their layer:

```html
<link rel="stylesheet" href="/node_modules/@openstuff-dev/ui/css/ui.css" />
<style>
  @import url('/tokens/tokens.css') layer(os.tokens);
</style>
```

## Cascade layers

```css
@layer os.reset, os.tokens, os.base, os.components, os.utilities;
```

A later layer wins over an earlier one. Your app's own styles stay outside the layers, so they
win over all of them without specificity fights or `!important`.

| File | Layer | What's in it |
|---|---|---|
| `layers.css` | | The order above. Import it first if you import the files one by one |
| `reset.css` | `os.reset` | `box-sizing`, no default margins, media that fits, form controls that inherit the font, `[hidden]` that always hides |
| `base.css` | `os.base` | Page colours and font from the tokens, `:focus-visible` ring (`--os-focus-ring`), `accent-color` for checkboxes, radios and ranges, dialog and popover surfaces with enter and exit transitions, reduced motion, `prefers-contrast: more` |
| `components/*.css` | `os.components` | One file per component family (see below) |
| `utilities.css` | `os.utilities` | `.os-visually-hidden` |
| `ui.css` | | All of the above |

## Components

Each CSS file starts with a markup example. Variants are data attributes, so they work the same
from HTML and from a framework: `data-variant`, `data-size`, `data-tone` (neutral, brand, danger,
warning, success, info).

| File | Classes |
|---|---|
| `button.css` | `.os-button` with `data-variant` (primary, default, ghost, danger, link), `data-size="sm"`, `data-icon-only`, and `aria-busy="true"` for a spinner |
| `icon.css` | `.os-icon` (build one with `createIcon(node)` from a Lucide icon) |
| `badge.css` | `.os-badge`, `.os-chip` (with `.os-chip-remove`), `.os-status-dot` |
| `field.css` | `.os-field`, `.os-label`, `.os-hint`, `.os-error`, `.os-input`, `.os-textarea`, `.os-select`, `.os-check`, `.os-checkbox`, `.os-radio`, `.os-switch`, `.os-fieldset` |
| `segmented.css` | `.os-segmented`: native radios in a row |
| `feedback.css` | `.os-callout`, `.os-empty-state`, `.os-kbd`, `.os-skeleton` |
| `dialog.css` | `.os-dialog` and `.os-drawer` on `<dialog>`, with `.os-dialog-header`, `-body`, `-footer` |
| `popover.css` | `.os-popover`, `.os-menu` (`.os-menu-item`, `-label`, `-separator`), `.os-tooltip`, placed with `data-placement` |
| `command-palette.css` | `.os-command-palette`: a dialog with a combobox and a listbox |
| `toast.css` | `.os-toast-region` (a manual popover) and `.os-toast` |
| `page.css` | `.os-page`, `.os-page-header`, `.os-breadcrumbs`, `.os-panel`, `.os-card`, `.os-card-grid`, `.os-tabs` |
| `settings.css` | `.os-setting-card`, `.os-setting-row`, `.os-form-actions` |
| `data.css` | `.os-data-table` (stacked rows below 36rem), `.os-stat-tile`, `.os-stat-grid` |

Plain HTML gets the look and the native behaviour (dialogs, popovers, radios). Keyboard handling
that HTML doesn't have (arrow keys in menus and tabs, the command palette) comes from the Angular
components.

Helpers in the main entry point:

- `createIcon(node, { size })` builds a decorative `<svg class="os-icon">` from a Lucide icon
  node. The few icons the components use themselves are exported as `iconX`, `iconCheck`,
  `iconSearch`, `iconInfo`, `iconCircleAlert`, `iconCircleCheck` and `iconTriangleAlert`.
- `anchor(trigger, popover)` anchors a popover, menu or tooltip to the element that opens it,
  with a unique anchor name (and the polyfill where needed).

## Marketing pages

`marketing.css` and `@openstuff-dev/ui/marketing` are the one-page site every OpenStuff project
gets (like https://purpose.openstuff.dev): top bar, hero, bento grid, steps, comparison, FAQ and
footer, all from the tokens. They aren't part of `ui.css`. Start a site with
`npx nx g @openstuff-dev/nx:site OpenLedger`, which copies them in, rather than by hand.

Bento tiles (`.os-tile`) are still until they're hovered, focused or tapped; then every element
inside with `data-play` (`fade`, `rise`, `slide`, `pop`, `grow`, `shrink`, `dim`, `highlight`,
`type`, `fill`, `pulse`) moves to its final state and settles. The markup is the final state, so
with reduced motion people see it without movement. `marketing.css` starts with the markup and
lists every illustration piece. `startMarketingPage()` adds the glow that follows the pointer,
tap to play, copy buttons and closing the mobile menu; it imports nothing, so a static site can
serve the built `marketing.js` as it is.

## Browser support

- Features that are Baseline **widely available** work fully.
- Baseline **newly available** features, and a few that are newer still, work through
  `loadPolyfills()`. It checks what the browser has and loads only what's missing.
- Older browsers get a usable page without the extras: dialogs and popovers appear without
  animating, density falls back to the default layout.

| Feature | Without it |
|---|---|
| `popover` | `@oddbird/popover-polyfill` (its styles go in `os.reset.popover-polyfill`) |
| Invoker commands (`commandfor`, `command`) | `invokers-polyfill` |
| `closedby` on `<dialog>` | A small handler: `any` closes on a click outside and on Escape, `none` ignores Escape |
| `interestfor` (tooltips) | A small handler: opens on hover and keyboard focus, stays while the pointer is on the trigger or the tooltip, closes on Escape. Set `aria-describedby` on the trigger yourself |
| CSS anchor positioning | `@oddbird/css-anchor-positioning`, run once the page has loaded. Call `positionAnchors()` after rendering anchored content later |
| `popover="hint"` | Behaves like `popover="manual"`, which is what the tooltip fallback needs |

Native `<dialog>` and `popover` move focus in and back out themselves. Don't add a focus trap.

## Layout: container queries

A component adapts to the space it's given, not to the window. The same table, card or form
looks right in a sidebar, a drawer or a full page.

- Layout wrappers (page, panel, setting card, dialog, drawer, table) set
  `container-type: inline-size`; components inside query the nearest one.
- Components query the nearest container and size with `cqi`:

  ```css
  .os-card {
    padding-inline: clamp(0.75rem, 3cqi, 1.5rem);
  }

  @container (width < 32rem) {
    .os-card { grid-template-columns: 1fr; }
  }
  ```

- Breakpoints, written per component: `xs < 20rem`, `sm < 32rem`, `md < 48rem`, `lg < 64rem`.
- Never put `container-type: inline-size` on something that sizes to its content (buttons,
  badges, chips): it can no longer grow with its text. Those respond to their parent's container.
- Density: set `data-density="compact"` on any element; components read it with
  `@container style(--os-density: compact)` and keep the default layout where that's unsupported.
- Viewport media queries are only for page chrome (a sidebar collapsing to a rail) and for
  `prefers-reduced-motion` and `prefers-contrast`. Stylelint allows viewport width queries only in
  layout files (`**/layout/**`, `*.layout.css`).

## Development

```sh
npx nx test ui
npx nx stylelint ui
npx nx serve docs           # the docs site: every component, with its HTML
```

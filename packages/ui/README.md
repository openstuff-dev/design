# @openstuff-dev/ui

The framework-neutral layer every OpenStuff component and app builds on: cascade layers, a reset,
base styles from the `--os-*` tokens, and native overlays (`<dialog>`, `popover`) with polyfills
for browsers that lack the newer parts.

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
| `ui.css` | | All of the above |

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

- Layout wrappers (page, panel, card, drawer body, table wrapper, form) set
  `container-type: inline-size` and a name such as `container-name: os-panel`.
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
npx vite packages/ui/demo   # the overlays in a browser; add ?fallbacks to force the fallbacks on
```

# @openstuff-dev/tokens

A complete light and dark theme from one primary colour. Every colour is a single
`light-dark()` pair, so there's one `:root` block and no `prefers-color-scheme` copies.

## Use it in a project

Add `tokens.config.json` next to your `package.json`:

```json
{
  "primaryColor": "#2d5bff",
  "outDir": "src/styles/tokens"
}
```

Build the files (add it to your `build` or `prebuild` script):

```sh
npx os-tokens            # reads ./tokens.config.json
npx os-tokens --config other.json --out dist/tokens
```

It writes four files:

| File | What it's for |
|---|---|
| `tokens.css` | Every `--os-*` custom property, in one `:root` block |
| `tokens.js`, `tokens.d.ts` | The theme and the properties as typed values |
| `tokens.json` | DTCG tokens for Figma or Penpot. `$value` is the light colour; the dark one is in `$extensions["dev.openstuff.dark"]` |

Import `tokens.css` once. Don't have a config yet? Use the default theme (blue `#2d5bff`):

```css
@import '@openstuff-dev/tokens/tokens.css';
```

### Light, dark or the system

The page follows the system by default. Set `data-theme` on `<html>` to override it:

```html
<html data-theme="dark">
```

## Config options

| Option | Default | What it does |
|---|---|---|
| `primaryColor` | (required) | Any CSS colour. Everything else is generated from it |
| `outDir` | `tokens` | Where the files go, relative to the config file |
| `neutralChroma` | a tenth of the primary's, at most `0.012` | How much of the primary hue the greys carry |
| `radius` | `1` | Multiplies every radius except `full`. `0` gives square corners |
| `fonts` | Geist and Geist Mono | `{ "sans": "…", "mono": "…" }` |

## Tokens

```
--os-bg-default  --os-bg-alternative  --os-bg-surface-100/200/300  --os-bg-overlay
--os-bg-control  --os-bg-hover  --os-bg-selection
--os-fg-default  --os-fg-light  --os-fg-lighter  --os-fg-muted
--os-border-default  --os-border-strong  --os-border-control  --os-border-style
--os-brand-default/-hover/-ink/-soft/-border/-text  --os-focus-ring
--os-danger-*  --os-warning-*  --os-success-*  --os-info-*   (same six as brand)
--os-identity-0 … 7, --os-identity-N-soft
--os-shadow-xs/sm/md/pop  --os-backdrop
--os-radius-*  --os-space-*  --os-font-*  --os-text-*  --os-leading-*  --os-ease-*  --os-duration-*
```

- `-ink` is the text colour on a `-default` or `-hover` fill: white, or near-black for light
  colours such as yellow.
- `-text` is the colour as text on any background; `-soft` is a tinted background.
- `fg-muted` is for disabled text and decorative icons only (3:1).
- `identity-*` are eight evenly spaced hues for things like organizations.

What's guaranteed, for any primary and in both schemes: text tokens reach 4.5:1 (WCAG AA) on
every background; `border-control`, `focus-ring` and `fg-muted` reach 3:1. To get there, the
generator may darken a solid slightly so white text reads on it.

## Theme part of a page at runtime

`generateTheme` runs in the browser too (it only needs `culori`):

```ts
import { applyTheme, generateTheme } from '@openstuff-dev/tokens';

applyTheme(card, generateTheme(organization.color));
```

`cssProperties(theme)` returns the same properties as an object, for frameworks that bind styles.

## Development

```sh
npx nx build tokens   # tsc, then os-tokens with ./tokens.config.json into dist/
npx nx test tokens
```

# @openstuff-dev/ui-angular

Angular components for the OpenStuff design system. They render the markup and classes of
[`@openstuff-dev/ui`](../ui) and add the behaviour: keyboard handling, ARIA wiring and services
for dialogs and toasts. Standalone, OnPush and signal-based; Angular 22.

## Use it

```sh
npm i @openstuff-dev/ui-angular @openstuff-dev/tokens @angular/aria @angular/cdk
```

```css
/* styles.css */
@import '@openstuff-dev/ui/ui.css';
@import './tokens/tokens.css' layer(os.tokens);
```

```ts
// main.ts
import { loadPolyfills } from '@openstuff-dev/ui/polyfills';

await loadPolyfills();
await bootstrapApplication(App, appConfig);
```

Import each component where you use it:

```ts
import { Button, Field, Control } from '@openstuff-dev/ui-angular';

@Component({
  imports: [Button, Field, Control],
  template: `
    <os-field label="Name" [error]="nameError()"><input os-input [(ngModel)]="name" /></os-field>
    <button os-button type="submit" variant="primary" [loading]="saving()">Save</button>
  `,
})
```

Native elements stay native: a button is `<button os-button>`, a dialog is `<dialog os-dialog>`,
so forms, focus and semantics work as the browser intends. Components without a native element
are elements (`<os-callout>`, `<os-tabs>`).

## Components

| | Selector | Notes |
|---|---|---|
| Button | `button[os-button]`, `a[os-button]` | `variant`, `size`, `loading` (spinner, ignores clicks, keeps focus) |
| IconButton | `button[os-icon-button]` | `label` is required: it's the accessible name |
| Icon | `svg[os-icon]` | `[icon]="Search"` with any Lucide icon node |
| Badge, StatusDot | `[os-badge]`, `[os-status-dot]` | `tone` |
| Chip | `[os-chip]` | `removable` adds a "Remove …" button; `(removed)` |
| Field | `os-field` | `label`, `hint`, `error`; wires the control's id, `aria-describedby` and `aria-invalid` |
| Input, Textarea, Select | `input[os-input]`, `textarea[os-textarea]`, `select[os-select]` | |
| Checkbox, Radio, Switch | `input[os-checkbox]`, `input[os-radio]`, `input[os-switch]`, in `label[os-check]` | |
| SegmentedControl | `os-segmented-control` | `label`, `options`, `[(value)]`; native radios |
| Callout | `os-callout` | `tone`, `title`; actions with `os-actions` |
| EmptyState | `os-empty-state` | `title`, `icon`, `level`, `bordered`; actions with `os-actions` |
| Kbd, Skeleton | `kbd[os-kbd]`, `os-skeleton` | `lines`, `shape` |
| Dialog, Drawer | `dialog[os-dialog]`, `dialog[os-drawer]` | `[(open)]`, `closedby`, `size`, `side`; parts `os-dialog-header`, `-body`, `-footer`, `-title`, `-close` |
| ConfirmDialog | `inject(ConfirmDialog).confirm({...})` | Resolves `true` or `false` |
| Popover | `[os-popover]` + `button[os-popover-trigger]` | `placement`; anchored to its trigger |
| Menu | `[os-menu]`, `button[os-menu-item]`, `hr[os-menu-separator]` | Arrow keys, Home, End, typeahead; closes on choice |
| Tooltip | `[os-tooltip]="text"` | Hover and keyboard focus; describes the element unless it repeats its name |
| CommandPalette | `os-command-palette` | `[(open)]`, `commands`, `(run)` |
| Toaster | `inject(Toaster).show(message, {...})` | `tone`, `action`, `duration`; pauses on hover |
| Page, PageHeader, Breadcrumbs | `[os-page]`, `header[os-page-header]`, `nav[os-breadcrumbs]` | |
| Panel, Card, CardGrid | `[os-panel]`, `[os-card]`, `[os-card-grid]` | |
| Tabs | `os-tabs` with `ng-template[os-tab]` | `label`, `[(selected)]`; keyboard from `@angular/aria` |
| SettingCard, SettingRow | `[os-setting-card]`, `os-setting-row` | The row labels the control inside, like a Field |
| FormActions | `[os-form-actions]`, `[os-form-actions-note]` | |
| DataTable | `os-data-table` with `ng-template[os-cell]` | `caption`, `columns`, `rows`, `rowKey`; stacks in a narrow container |
| StatTile | `os-stat-tile`, `[os-stat-grid]` | `label`, `value`, `hint`, `tone` |

## Development

```sh
npx nx test ui-angular        # Vitest in jsdom: accessible names and keyboard for each component
npx nx build ui-angular       # ng-packagr, into dist/packages/ui-angular
npx nx demo ui-angular        # every component in a browser, on http://localhost:5200
```

The package is published from `dist/packages/ui-angular`.

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { Polyfill } from '@openstuff-dev/ui/polyfills';
import { Badge, Cell, DataTable, PageHeader, type Column } from '@openstuff-dev/ui-angular';
import { BROWSER_SUPPORT } from '../polyfills';

interface Feature {
  key: Polyfill;
  feature: string;
  usedBy: string;
  native: boolean;
  polyfilled: boolean;
}

const FEATURES: Record<Polyfill, { feature: string; usedBy: string }> = {
  popover: { feature: 'Popover API', usedBy: 'Popovers, menus, toasts' },
  popoverHint: { feature: 'popover="hint"', usedBy: 'Tooltips (falls back to auto)' },
  anchorPositioning: { feature: 'CSS anchor positioning', usedBy: 'Popovers, menus, tooltips' },
  invokerCommands: { feature: 'Invoker commands', usedBy: 'Buttons that open dialogs' },
  interestInvokers: { feature: 'interestfor', usedBy: 'Tooltips on hover and focus' },
  dialogClosedBy: { feature: 'closedby on <dialog>', usedBy: 'Closing dialogs from outside' },
};

@Component({
  selector: 'docs-browser-support',
  imports: [Badge, Cell, DataTable, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Browser support"
      description="What works where, and what this browser needed."
    ></header>

    <div class="stack">
      <div class="prose">
        <ul>
          <li>
            <strong>Baseline “widely available”</strong> features work fully, with nothing extra
            loaded.
          </li>
          <li>
            <strong>Baseline “newly available”</strong> features, and the newer overlay features
            below, work everywhere through polyfills. <code>loadPolyfills()</code> loads only the
            ones a browser lacks.
          </li>
          <li>
            <strong>Older browsers</strong> get a usable page without the extras, such as positioned
            menus or light dismiss.
          </li>
        </ul>
      </div>

      <os-data-table
        caption="Overlay features in this browser"
        [columns]="columns"
        [rows]="rows"
        rowKey="key"
      >
        <ng-template os-cell="native" let-row>
          @if (row.native) {
            <span os-badge tone="success">Native</span>
          } @else {
            <span os-badge tone="neutral">Missing</span>
          }
        </ng-template>
        <ng-template os-cell="polyfilled" let-row>
          @if (row.polyfilled) {
            <span os-badge tone="info">Loaded</span>
          } @else if (row.native) {
            <span class="none">Not needed</span>
          } @else {
            <span class="none">None, falls back</span>
          }
        </ng-template>
      </os-data-table>
    </div>
  `,
  styles: `
    .none {
      color: var(--os-fg-lighter);
    }
  `,
})
export class BrowserSupport {
  private readonly support = inject(BROWSER_SUPPORT);
  protected readonly columns: Column<Feature>[] = [
    { key: 'feature', label: 'Feature' },
    { key: 'usedBy', label: 'Used by' },
    { key: 'native', label: 'This browser' },
    { key: 'polyfilled', label: 'Polyfill' },
  ];

  protected readonly rows: Feature[] = (Object.keys(FEATURES) as Polyfill[]).map((key) => ({
    key,
    ...FEATURES[key],
    native: this.support.native[key],
    polyfilled: this.support.loaded.includes(key),
  }));
}

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PageHeader, SegmentedControl, type SegmentOption } from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const BASIC = `
  <div class="row">
    <os-segmented-control label="View" [options]="views" [(value)]="view" />
    <os-segmented-control label="Period" size="sm" [options]="periods" [(value)]="period" />
  </div>
  <p>Showing a {{ view() }} of the last {{ period() }}.</p>
`;

@Component({
  selector: 'docs-segmented-basic',
  imports: [SegmentedControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: BASIC,
  styles: `
    :host {
      display: grid;
      gap: var(--os-space-4);
    }
  `,
})
class Basic {
  protected readonly views: SegmentOption[] = [
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
    { value: 'board', label: 'Board', disabled: true },
  ];

  protected readonly view = signal('list');
  protected readonly periods: SegmentOption[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];

  protected readonly period = signal('week');
}

@Component({
  selector: 'docs-segmented-page',
  imports: [Basic, CodeBlock, Example, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Segmented control"
      description="A choice between two to five options, all visible at once."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />
      <div class="prose">
        <p>
          It's a group of native radio buttons, so arrow keys move between options and forms read it
          like any radio group. Use it to switch a view or filter. For more than five options, use a
          select.
        </p>
      </div>
      <docs-example [code]="basic"><docs-segmented-basic /></docs-example>
    </div>
  `,
})
export class SegmentedPage {
  protected readonly basic = BASIC;
  protected readonly usage = `import { SegmentedControl, type SegmentOption } from '@openstuff-dev/ui-angular';`;
}

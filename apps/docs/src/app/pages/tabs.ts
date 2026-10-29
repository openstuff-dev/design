import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PageHeader, Tab, Tabs } from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const TABS = `
  <os-tabs label="Project" [(selected)]="tab">
    <ng-template os-tab="overview" label="Overview">
      <p>Design is the toolkit every OpenStuff project builds on.</p>
    </ng-template>
    <ng-template os-tab="rules" label="Rules">
      <p>12 rules apply here, 3 of them locked.</p>
    </ng-template>
    <ng-template os-tab="history" label="History">
      <p>Kim approved 3 rules yesterday.</p>
    </ng-template>
    <ng-template os-tab="archive" label="Archive" disabled>
      <p>Nothing archived.</p>
    </ng-template>
  </os-tabs>
  <p class="selected">Selected: {{ tab() }}</p>
`;

@Component({
  selector: 'docs-tabs-example',
  imports: [Tab, Tabs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: TABS,
  styles: `
    .selected {
      margin-block-start: var(--os-space-4);
      color: var(--os-fg-lighter);
      font-size: var(--os-text-sm);
    }
  `,
})
class TabsExample {
  protected readonly tab = signal('overview');
}

@Component({
  selector: 'docs-tabs-page',
  imports: [CodeBlock, Example, PageHeader, TabsExample],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Tabs"
      description="Views of the same thing, one at a time."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />
      <div class="prose">
        <p>
          Arrow keys move between tabs and show them; Home and End jump to the ends. Only the chosen
          tab's content is rendered. For links between pages that look like tabs, put
          <code>.os-tab</code> on <code>&lt;a&gt;</code> elements and mark the current one with
          <code>aria-current="page"</code>.
        </p>
      </div>
      <docs-example [code]="tabs"><docs-tabs-example /></docs-example>
    </div>
  `,
})
export class TabsPage {
  protected readonly tabs = TABS;
  protected readonly usage = `import { Tab, Tabs } from '@openstuff-dev/ui-angular';`;
}

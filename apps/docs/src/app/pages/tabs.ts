import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PageHeader, Tab, TabLink, TabNav, Tabs } from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const TABS = `
  <os-tabs label="Project" [(selected)]="tab">
    <ng-template os-tab="overview" label="Overview">
      <p>Design is the toolkit every OpenStuff project builds on.</p>
    </ng-template>
    <ng-template os-tab="rules" label="Rules" [count]="12">
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

const SUB_NAV = `
  <nav os-tab-nav label="Project sections" [sticky]="false">
    <button
      os-tab-link
      type="button"
      [count]="4"
      [attr.aria-current]="section() === 'documents' ? 'page' : null"
      (click)="section.set('documents')"
    >
      Documents
    </button>
    <button
      os-tab-link
      type="button"
      [count]="2"
      [attr.aria-current]="section() === 'scopes' ? 'page' : null"
      (click)="section.set('scopes')"
    >
      Scopes
    </button>
    <button
      os-tab-link
      type="button"
      [attr.aria-current]="section() === 'settings' ? 'page' : null"
      (click)="section.set('settings')"
    >
      Settings
    </button>
  </nav>
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
  selector: 'docs-sub-nav-example',
  imports: [TabLink, TabNav],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: SUB_NAV,
})
class SubNavExample {
  protected readonly section = signal('documents');
}

@Component({
  selector: 'docs-tabs-page',
  imports: [CodeBlock, Example, PageHeader, SubNavExample, TabsExample],
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
          tab's content is rendered. For a sticky page sub-menu of router links with icons and
          counts, use <code>nav[os-tab-nav]</code> and <code>a[os-tab-link]</code> with
          <code>aria-current="page"</code> on the active link.
        </p>
      </div>
      <docs-example [code]="tabs"><docs-tabs-example /></docs-example>
      <docs-example [code]="subNav"><docs-sub-nav-example /></docs-example>
    </div>
  `,
})
export class TabsPage {
  protected readonly tabs = TABS;
  protected readonly subNav = SUB_NAV;
  protected readonly usage = `import { Tab, TabLink, TabNav, Tabs } from '@openstuff-dev/ui-angular';`;
}

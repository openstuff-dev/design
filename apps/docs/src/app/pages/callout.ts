import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Callout, PageHeader } from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const TONES = `
  <div class="stack">
    <os-callout title="Agents read this">It's shown to every agent working in this repository.</os-callout>
    <os-callout tone="success" title="Imported 36 rules">They're live for every project now.</os-callout>
    <os-callout tone="warning" title="Read-only">You can view this project but not change it.</os-callout>
    <os-callout tone="danger" title="The import failed">Line 12 isn't valid JSON. Fix it and try again.</os-callout>
  </div>
`;

@Component({
  selector: 'docs-callout-tones',
  imports: [Callout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: TONES,
})
class Tones {}

const ACTIONS = `
  <os-callout tone="warning" title="Your token expires in 3 days" [level]="3">
    Agents using it lose access then. Make a new one before it does.
    <button os-button os-actions type="button" size="sm">Make a new token</button>
  </os-callout>
`;

@Component({
  selector: 'docs-callout-actions',
  imports: [Button, Callout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ACTIONS,
})
class Actions {}

@Component({
  selector: 'docs-callout-page',
  imports: [Actions, CodeBlock, Example, PageHeader, Tones],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Callout"
      description="A message that stays on the page: what's going on, and what to do about it."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />

      <section class="prose" aria-labelledby="tones">
        <h2 id="tones">Tones</h2>
        <p>
          <code>info</code> is the default. Each tone has its own icon, so the colour isn't the only
          sign. For a short-lived message after an action, use a toast.
        </p>
      </section>
      <docs-example [code]="tones"><docs-callout-tones /></docs-example>

      <section class="prose" aria-labelledby="actions">
        <h2 id="actions">With an action</h2>
        <p>
          Mark buttons with <code>os-actions</code> to put them below the text. <code>level</code>
          makes the title a heading, for a callout that starts a section.
        </p>
      </section>
      <docs-example [code]="actions"><docs-callout-actions /></docs-example>
    </div>
  `,
})
export class CalloutPage {
  protected readonly tones = TONES;
  protected readonly actions = ACTIONS;
  protected readonly usage = `import { Callout } from '@openstuff-dev/ui-angular';`;
}

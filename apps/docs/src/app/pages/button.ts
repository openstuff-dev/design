import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Icon, IconButton, PageHeader } from '@openstuff-dev/ui-angular';
import { Plus, Settings, Trash2 } from 'lucide';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const VARIANTS = `
  <div class="row">
    <button os-button variant="primary">Create project</button>
    <button os-button>Cancel</button>
    <button os-button variant="ghost">Skip</button>
    <button os-button variant="danger">Delete project</button>
    <a os-button variant="link" href="#variants">Read more</a>
  </div>
`;

@Component({
  selector: 'docs-button-variants',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: VARIANTS,
})
class Variants {}

const SIZES = `
  <div class="row">
    <button os-button variant="primary" size="sm">
      <svg os-icon [icon]="plus"></svg> New
    </button>
    <button os-button variant="primary">
      <svg os-icon [icon]="plus"></svg> New project
    </button>
    <button os-icon-button label="Settings"><svg os-icon [icon]="settings"></svg></button>
    <button os-icon-button variant="ghost" size="sm" label="Settings">
      <svg os-icon [icon]="settings"></svg>
    </button>
  </div>
`;

@Component({
  selector: 'docs-button-sizes',
  imports: [Button, Icon, IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: SIZES,
})
class Sizes {
  protected readonly plus = Plus;
  protected readonly settings = Settings;
}

const STATES = `
  <div class="row">
    <button os-button variant="primary" [loading]="saving()" (click)="save()">
      {{ saving() ? 'Saving' : 'Save' }}
    </button>
    <button os-button disabled>Not allowed</button>
    <button os-button variant="link" tone="danger">
      <svg os-icon [icon]="trash"></svg> Remove member
    </button>
  </div>
`;

@Component({
  selector: 'docs-button-states',
  imports: [Button, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: STATES,
})
class States {
  protected readonly trash = Trash2;
  protected readonly saving = signal(false);

  protected save(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
    }, 1500);
  }
}

@Component({
  selector: 'docs-button-page',
  imports: [CodeBlock, Example, PageHeader, Sizes, States, Variants],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Button"
      description="One primary button per view, for the action most people take next."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />

      <section class="prose" aria-labelledby="variants">
        <h2 id="variants">Variants</h2>
        <p>
          Name the action: “Delete project”, not “OK”. Use <code>danger</code> for actions that
          can't be undone, and <code>link</code> for a quiet action inside text.
        </p>
      </section>
      <docs-example [code]="variants"><docs-button-variants /></docs-example>

      <section class="prose" aria-labelledby="sizes">
        <h2 id="sizes">Sizes and icons</h2>
        <p>
          <code>size="sm"</code> fits toolbars and tables. An icon-only button needs a
          <code>label</code>, which becomes its accessible name.
        </p>
      </section>
      <docs-example [code]="sizes"><docs-button-sizes /></docs-example>

      <section class="prose" aria-labelledby="states">
        <h2 id="states">Loading and disabled</h2>
        <p>
          <code>loading</code> shows a spinner and ignores clicks but keeps focus, so a keyboard
          user doesn't lose their place. Prefer it to <code>disabled</code> while saving. A link
          button with <code>tone="danger"</code> is a quiet delete.
        </p>
      </section>
      <docs-example [code]="states"><docs-button-states /></docs-example>
    </div>
  `,
})
export class ButtonPage {
  protected readonly variants = VARIANTS;
  protected readonly sizes = SIZES;
  protected readonly states = STATES;
  protected readonly usage = `import { Button, IconButton } from '@openstuff-dev/ui-angular';`;
}

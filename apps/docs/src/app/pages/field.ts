import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  Check,
  Checkbox,
  Control,
  Field,
  Fieldset,
  PageHeader,
  Radio,
  Switch,
} from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const FIELDS = `
  <form class="form">
    <os-field label="Project name" hint="Up to 40 characters." [error]="nameError()">
      <input os-input #input [value]="name()" (input)="name.set(input.value)" />
    </os-field>
    <os-field label="Region">
      <select os-select>
        <option>Europe (Frankfurt)</option>
        <option>US East (Virginia)</option>
      </select>
    </os-field>
    <os-field label="Description" hint="Shown on the project's page.">
      <textarea os-textarea rows="3"></textarea>
    </os-field>
  </form>
`;

@Component({
  selector: 'docs-fields',
  imports: [Control, Field],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: FIELDS,
  styles: `
    .form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: var(--os-space-4);
    }
  `,
})
class Fields {
  protected readonly name = signal('Design system for everyone at OpenStuff');
  protected readonly nameError = computed(() =>
    this.name().length > 40 ? 'Use 40 characters or fewer.' : null,
  );
}

const CHOICES = `
  <div class="choices">
    <fieldset os-fieldset>
      <legend>Email me about</legend>
      <label os-check><input type="checkbox" os-checkbox checked /> New proposals</label>
      <label os-check><input type="checkbox" os-checkbox /> Findings in my projects</label>
    </fieldset>
    <fieldset os-fieldset>
      <legend>Who can see it</legend>
      <label os-check><input type="radio" os-radio name="visibility" checked /> My organization</label>
      <label os-check><input type="radio" os-radio name="visibility" /> Only me</label>
    </fieldset>
    <label os-check><input type="checkbox" os-switch checked /> Agent mode</label>
  </div>
`;

@Component({
  selector: 'docs-choices',
  imports: [Check, Checkbox, Fieldset, Radio, Switch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: CHOICES,
  styles: `
    .choices {
      display: grid;
      gap: var(--os-space-5);
      justify-items: start;
    }
  `,
})
class Choices {}

const SIZES = `
  <div class="row">
    <input os-input size="sm" aria-label="Search" placeholder="Search" />
    <input os-input aria-label="Search" placeholder="Search" />
    <input os-input invalid aria-label="Email" value="kim@" />
    <input os-input disabled aria-label="Token" value="Hidden" />
  </div>
`;

@Component({
  selector: 'docs-control-sizes',
  imports: [Control],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: SIZES,
})
class Sizes {}

@Component({
  selector: 'docs-field-page',
  imports: [Choices, CodeBlock, Example, Fields, PageHeader, Sizes],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Field and controls"
      description="Inputs, selects, text areas, checkboxes, radios and switches."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />

      <section class="prose" aria-labelledby="field">
        <h2 id="field">Field</h2>
        <p>
          <code>os-field</code> gives its control the label's id, an
          <code>aria-describedby</code> for the hint and error, and <code>aria-invalid</code> when
          there's an error. Type more than 40 characters to see one. Forms keep using
          <code>[(ngModel)]</code>, reactive forms or signal forms on the native element.
        </p>
      </section>
      <docs-example [code]="fields"><docs-fields /></docs-example>

      <section class="prose" aria-labelledby="choices">
        <h2 id="choices">Checkboxes, radios and switches</h2>
        <p>
          Each sits in a <code>label[os-check]</code>, so the whole line is clickable. Group them in
          a <code>fieldset[os-fieldset]</code> with a legend. A switch takes effect at once; a
          checkbox waits for Save.
        </p>
      </section>
      <docs-example [code]="choices"><docs-choices /></docs-example>

      <section class="prose" aria-labelledby="sizes">
        <h2 id="sizes">Sizes and states</h2>
        <p>
          A control outside a field needs its own <code>aria-label</code>. <code>invalid</code>
          marks it without a field.
        </p>
      </section>
      <docs-example [code]="sizes"><docs-control-sizes /></docs-example>
    </div>
  `,
})
export class FieldPage {
  protected readonly fields = FIELDS;
  protected readonly choices = CHOICES;
  protected readonly sizes = SIZES;
  protected readonly usage = `import {
  Check, Checkbox, Control, Field, Fieldset, Radio, Switch,
} from '@openstuff-dev/ui-angular';`;
}

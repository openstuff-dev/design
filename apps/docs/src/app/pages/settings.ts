import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  Button,
  Control,
  FormActions,
  FormActionsNote,
  PageHeader,
  SettingCard,
  SettingCardFooter,
  SettingRow,
  Switch,
  Toaster,
} from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const SETTINGS = `
  <div class="cards">
    <section os-setting-card title="Profile" description="How others see you.">
      <os-setting-row label="Name" description="Shown to your team.">
        <input os-input value="Kim" />
      </os-setting-row>
      <os-setting-row label="Agent mode" description="Shows what agents read on every page." inline>
        <input type="checkbox" os-switch checked />
      </os-setting-row>
      <footer os-setting-card-footer>
        <div os-form-actions>
          <p os-form-actions-note>Changes apply to all your devices.</p>
          <button os-button type="button">Cancel</button>
          <button os-button type="button" variant="primary" [loading]="saving()" (click)="save()">
            Save
          </button>
        </div>
      </footer>
    </section>

    <section os-setting-card tone="danger" title="Delete organization">
      <os-setting-row label="Delete everything" description="Projects, rules and history. You can't undo this." inline>
        <button os-button type="button" variant="danger">Delete organization…</button>
      </os-setting-row>
    </section>
  </div>
`;

@Component({
  selector: 'docs-settings-example',
  imports: [
    Button, Control, FormActions, FormActionsNote, SettingCard, SettingCardFooter, SettingRow,
    Switch,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: SETTINGS,
  styles: `
    .cards {
      display: grid;
      gap: var(--os-space-6);
    }
  `,
})
class SettingsExample {
  private readonly toaster = inject(Toaster);
  protected readonly saving = signal(false);

  protected save(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.toaster.show('Saved your profile', { tone: 'success' });
    }, 1000);
  }
}

@Component({
  selector: 'docs-settings-page',
  imports: [CodeBlock, Example, PageHeader, SettingsExample],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Settings"
      description="Cards of labelled settings, each row a label, a description and a control."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />
      <div class="prose">
        <p>
          A row wires its label and description to the control inside, like a field does.
          <code>inline</code> keeps a short control (a switch or a button) beside the text; in a
          narrow card the control moves under it. Drag the corner to see it. A
          <code>tone="danger"</code> card holds what can't be undone, at the end of the page.
        </p>
      </div>
      <docs-example [code]="settings"><docs-settings-example /></docs-example>
    </div>
  `,
})
export class SettingsPage {
  protected readonly settings = SETTINGS;
  protected readonly usage = `import {
  FormActions, FormActionsNote, SettingCard, SettingCardFooter, SettingRow,
} from '@openstuff-dev/ui-angular';`;
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  Button,
  ConfirmDialog,
  Control,
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  Field,
  Icon,
  IconButton,
  PageHeader,
  Toaster,
} from '@openstuff-dev/ui-angular';
import { X } from 'lucide';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';
import { dedent } from '../example/markup';

const DIALOG = `
  <button os-button type="button" variant="primary" (click)="open.set(true)">New project</button>

  <dialog os-dialog size="sm" [(open)]="open">
    <header os-dialog-header><h2 os-dialog-title>New project</h2></header>
    <div os-dialog-body>
      <os-field label="Name" hint="You can change it later."><input os-input /></os-field>
    </div>
    <footer os-dialog-footer>
      <button os-button os-dialog-close type="button">Cancel</button>
      <button os-button type="button" variant="primary" (click)="open.set(false)">Create</button>
    </footer>
  </dialog>
`;

@Component({
  selector: 'docs-dialog-basic',
  imports: [
    Button, Control, Dialog, DialogBody, DialogClose, DialogFooter, DialogHeader, DialogTitle,
    Field,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: DIALOG,
})
class Basic {
  protected readonly open = signal(false);
}

const DRAWER = `
  <div class="row">
    <button os-button type="button" (click)="end.set(true)">Open from the end</button>
    <button os-button type="button" (click)="start.set(true)">Open from the start</button>
  </div>

  <dialog os-drawer [(open)]="end">
    <header os-dialog-header>
      <h2 os-dialog-title>Finding</h2>
      <button os-icon-button os-dialog-close type="button" variant="ghost" label="Close">
        <svg os-icon [icon]="close"></svg>
      </button>
    </header>
    <div os-dialog-body>
      <p>Buttons are 118 hand-written class combinations. Use os-button instead.</p>
    </div>
  </dialog>

  <dialog os-drawer side="start" closedby="closerequest" [(open)]="start">
    <header os-dialog-header>
      <h2 os-dialog-title>Filters</h2>
      <button os-icon-button os-dialog-close type="button" variant="ghost" label="Close">
        <svg os-icon [icon]="close"></svg>
      </button>
    </header>
    <div os-dialog-body><p>Clicking outside doesn't close this one; Escape does.</p></div>
  </dialog>
`;

@Component({
  selector: 'docs-drawer-basic',
  imports: [Button, DialogBody, DialogClose, DialogHeader, DialogTitle, Drawer, Icon, IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: DRAWER,
})
class Drawers {
  protected readonly close = X;
  protected readonly end = signal(false);
  protected readonly start = signal(false);
}

const CONFIRM = `
  <button os-button type="button" variant="danger" (click)="remove()">Delete project…</button>
`;

const CONFIRM_CODE = `${dedent(CONFIRM)}

// In the component
private readonly confirmer = inject(ConfirmDialog);

async remove() {
  const confirmed = await this.confirmer.confirm({
    title: 'Delete project?',
    message: 'Its rules and history are deleted. You can\\'t undo this.',
    confirmLabel: 'Delete project',
    danger: true,
  });
  if (confirmed) this.toaster.show('Project deleted');
}`;

@Component({
  selector: 'docs-confirm',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: CONFIRM,
})
class Confirm {
  private readonly confirmer = inject(ConfirmDialog);
  private readonly toaster = inject(Toaster);

  protected async remove(): Promise<void> {
    const confirmed = await this.confirmer.confirm({
      title: 'Delete project?',
      message: 'Its rules and history are deleted. You can\'t undo this.',
      confirmLabel: 'Delete project',
      danger: true,
    });
    if (confirmed) this.toaster.show('Project deleted');
  }
}

@Component({
  selector: 'docs-dialog-page',
  imports: [Basic, CodeBlock, Confirm, Drawers, Example, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Dialog and drawer"
      description="Native <dialog> elements: focus moves in, the page behind is inert, and Escape closes them."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />

      <section class="prose" aria-labelledby="dialog">
        <h2 id="dialog">Dialog</h2>
        <p>
          Bind <code>[(open)]</code> to a signal. A button with <code>os-dialog-close</code> closes
          it, and focus goes back to the button that opened it. Sizes are <code>sm</code>,
          <code>md</code> and <code>lg</code>.
        </p>
      </section>
      <docs-example [code]="dialog"><docs-dialog-basic /></docs-example>

      <section class="prose" aria-labelledby="drawer">
        <h2 id="drawer">Drawer</h2>
        <p>
          A dialog that slides in from the side, for details next to a list. By default a click
          outside closes it (<code>closedby="any"</code>); <code>closerequest</code> keeps it open
          until Escape or a close button, for forms someone could lose.
        </p>
      </section>
      <docs-example [code]="drawer"><docs-drawer-basic /></docs-example>

      <section class="prose" aria-labelledby="confirm">
        <h2 id="confirm">Confirm</h2>
        <p>
          <code>ConfirmDialog</code> asks before something can't be undone and resolves to
          <code>true</code> or <code>false</code>. Name the action on the button.
        </p>
      </section>
      <docs-example [code]="confirm"><docs-confirm /></docs-example>
    </div>
  `,
})
export class DialogPage {
  protected readonly dialog = DIALOG;
  protected readonly drawer = DRAWER;
  protected readonly confirm = CONFIRM_CODE;
  protected readonly usage = `import {
  ConfirmDialog, Dialog, DialogBody, DialogClose, DialogFooter, DialogHeader, DialogTitle, Drawer,
} from '@openstuff-dev/ui-angular';`;
}

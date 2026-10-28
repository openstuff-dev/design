import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from '../button/button';
import { accessibleDescription, accessibleName, press, query, render } from '../testing';
import { ConfirmDialog } from './confirm';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
} from './dialog';

@Component({
  imports: [
    Button,
    Dialog,
    DialogBody,
    DialogClose,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Drawer,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog os-dialog [(open)]="open">
      <header os-dialog-header><h2 os-dialog-title>Rename project</h2></header>
      <div os-dialog-body><p>Body</p></div>
      <footer os-dialog-footer>
        <button os-button os-dialog-close="cancel" type="button">Cancel</button>
      </footer>
    </dialog>
    <dialog os-drawer side="start" [(open)]="drawer">
      <header os-dialog-header><h2 os-dialog-title>Finding</h2></header>
    </dialog>
  `,
})
class Host {
  readonly open = signal(false);
  readonly drawer = signal(false);
}

describe('Dialog and Drawer', () => {
  it('are named by their title', async () => {
    const { fixture, host, root } = await render(Host);
    host.open.set(true);
    host.drawer.set(true);
    await fixture.whenStable();
    expect(accessibleName(query(root, 'dialog.os-dialog', HTMLDialogElement))).toBe('Rename project');
    const drawer = query(root, 'dialog.os-drawer', HTMLDialogElement);
    expect(accessibleName(drawer)).toBe('Finding');
    expect(drawer.dataset['side']).toBe('start');
    expect(drawer.getAttribute('closedby')).toBe('any');
  });

  it('open from the model, close from a close button, and report it back', async () => {
    const { fixture, host, root } = await render(Host);
    const dialog = query(root, 'dialog.os-dialog', HTMLDialogElement);
    host.open.set(true);
    await fixture.whenStable();
    expect(dialog.open).toBe(true);

    const cancel = query(dialog, 'button', HTMLButtonElement);
    cancel.focus();
    cancel.click();
    await fixture.whenStable();
    expect(dialog.open).toBe(false);
    expect(dialog.returnValue).toBe('cancel');
    expect(host.open()).toBe(false);
  });

  it('turns open off when the browser closes it on Escape', async () => {
    const { fixture, host, root } = await render(Host);
    host.drawer.set(true);
    await fixture.whenStable();
    const drawer = query(root, 'dialog.os-drawer', HTMLDialogElement);
    press(drawer, 'Escape');
    // The browser closes a modal dialog on Escape; the stub does what it would.
    drawer.close();
    await fixture.whenStable();
    expect(host.drawer()).toBe(false);
  });
});

describe('ConfirmDialog', () => {
  function ask() {
    const answer = TestBed.inject(ConfirmDialog).confirm({
      title: 'Delete draft?',
      message: 'You can\'t undo this.',
      confirmLabel: 'Delete draft',
      danger: true,
    });
    TestBed.tick();
    // The newest one: a closed one stays a moment for its exit transition.
    const dialog = [...document.querySelectorAll('os-confirm-dialog dialog')].at(-1);
    if (!(dialog instanceof HTMLDialogElement)) throw new Error('No confirm dialog');
    return { answer, dialog };
  }

  afterEach(() => {
    document.body.querySelectorAll('os-confirm-dialog').forEach((element) => {
      element.remove();
    });
  });

  it('is named by the title, described by the message, and focuses Cancel first', () => {
    const { dialog } = ask();
    expect(dialog.open).toBe(true);
    expect(accessibleName(dialog)).toBe('Delete draft?');
    expect(accessibleDescription(dialog)).toBe('You can\'t undo this.');
    const [cancel, confirm] = dialog.querySelectorAll('button');
    expect(cancel.hasAttribute('autofocus')).toBe(true);
    expect(confirm.dataset['variant']).toBe('danger');
    expect(accessibleName(confirm)).toBe('Delete draft');
  });

  it('resolves true on confirm and false on cancel', async () => {
    const first = ask();
    first.dialog.querySelectorAll('button')[1].click();
    expect(await first.answer).toBe(true);

    const second = ask();
    second.dialog.querySelectorAll('button')[0].click();
    expect(await second.answer).toBe(false);
  });
});

import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { accessibleDescription, accessibleName, query } from '../testing';
import { SecretDialog } from './secret';

const OPTIONS = {
  title: 'Your new API key',
  secret: 'key_abc123',
  what: 'API key',
  instructions: 'Put it in your shop system.',
};

async function open() {
  const trigger = document.createElement('button');
  document.body.append(trigger);
  trigger.focus();
  const closed = TestBed.inject(SecretDialog).show(OPTIONS);
  await TestBed.inject(ApplicationRef).whenStable();
  const dialog = query(document.body, 'os-secret-dialog dialog', HTMLDialogElement);
  return { trigger, closed, dialog };
}

describe('SecretDialog', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  it('shows the secret, what it is for and a way to copy it', async () => {
    const { dialog } = await open();
    expect(dialog.open).toBe(true);
    expect(accessibleName(dialog)).toBe('Your new API key');
    expect(accessibleDescription(dialog)).toBe('Put it in your shop system.');
    expect(query(dialog, 'pre', HTMLElement).textContent).toBe('key_abc123');
    expect(accessibleName(query(dialog, 'os-copy-button button', HTMLButtonElement))).toBe(
      'Copy the API key',
    );
    expect(dialog.textContent).toContain('This is the only time you’ll see this API key.');
  });

  it('puts focus on the copy button, so one more Enter can\'t close it', async () => {
    const { dialog } = await open();
    expect(document.activeElement).toBe(query(dialog, 'os-copy-button button', HTMLButtonElement));
  });

  it('stays open on Escape and on a click outside', async () => {
    const { dialog } = await open();
    expect(dialog.getAttribute('closedby')).toBe('none');
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(true);
  });

  it('closes when the person says they have copied it, and focus goes back', async () => {
    const { closed, dialog, trigger } = await open();
    const confirm = [...dialog.querySelectorAll('button')].find((button) =>
      button.textContent.includes('I’ve copied it'),
    );
    confirm?.click();
    await closed;
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('leaves nothing of the secret on the page afterwards', async () => {
    const { closed, dialog } = await open();
    dialog.close();
    await closed;
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(document.body.textContent).not.toContain('key_abc123');
    expect(document.querySelector('os-secret-dialog')).toBeNull();
  });
});

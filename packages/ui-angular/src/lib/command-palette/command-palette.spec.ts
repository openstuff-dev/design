import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { accessibleName, press, query, render } from '../testing';
import { CommandPalette, matchesQuery, type Command } from './command-palette';

@Component({
  imports: [CommandPalette],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<os-command-palette [(open)]="open" [commands]="commands" (run)="ran.set($event.id)" />',
})
class Host {
  readonly open = signal(true);
  readonly ran = signal('');
  readonly commands: Command[] = [
    { id: 'inbox', label: 'Inbox', group: 'Pages' },
    { id: 'findings', label: 'Findings', group: 'Pages', keywords: ['bugs'] },
    { id: 'new', label: 'New project', group: 'Actions' },
  ];
}

describe('CommandPalette', () => {
  async function open() {
    const rendered = await render(Host);
    const dialog = query(rendered.root, 'dialog', HTMLDialogElement);
    const search = query(dialog, 'input', HTMLInputElement);
    const type = async (text: string) => {
      search.value = text;
      search.dispatchEvent(new Event('input'));
      await rendered.fixture.whenStable();
    };
    const active = () => document.getElementById(search.getAttribute('aria-activedescendant') ?? '');
    return { ...rendered, dialog, search, type, active };
  }

  it('names the dialog, the combobox and its listbox, and groups the options', async () => {
    const { dialog, search, root } = await open();
    expect(dialog.open).toBe(true);
    expect(accessibleName(dialog)).toBe('Commands');
    expect(search.getAttribute('role')).toBe('combobox');
    expect(accessibleName(search)).toBe('Commands');
    const listbox = query(root, '[role="listbox"]', HTMLElement);
    expect(search.getAttribute('aria-controls')).toBe(listbox.id);
    const groups = [...root.querySelectorAll('[role="group"]')].map((group) => accessibleName(group));
    expect(groups).toEqual(['Pages', 'Actions']);
    const options = [...root.querySelectorAll('[role="option"]')].map((option) => accessibleName(option));
    expect(options).toEqual(['Inbox', 'Findings', 'New project']);
  });

  it('filters as you type, moves with arrow keys and runs the active command on Enter', async () => {
    const { fixture, host, search, type, active, root } = await open();
    expect(active()?.textContent.trim()).toBe('Inbox');
    expect(active()?.getAttribute('aria-selected')).toBe('true');
    press(search, 'ArrowDown');
    await fixture.whenStable();
    expect(active()?.textContent.trim()).toBe('Findings');
    press(search, 'ArrowUp');
    press(search, 'ArrowUp');
    await fixture.whenStable();
    expect(active()?.textContent.trim()).toBe('Inbox');

    await type('bug');
    expect(root.querySelectorAll('[role="option"]')).toHaveLength(1);
    press(search, 'Enter');
    await fixture.whenStable();
    expect(host.ran()).toBe('findings');
    expect(host.open()).toBe(false);
  });

  it('says when nothing matches', async () => {
    const { type, root } = await open();
    await type('zzz');
    expect(query(root, '[role="status"]', HTMLElement).textContent.trim()).toBe('No results for "zzz"');
  });
});

describe('matchesQuery', () => {
  it('matches every word against the label, group and keywords', () => {
    const command: Command = { id: 'f', label: 'Findings', group: 'Pages', keywords: ['bugs'] };
    expect(matchesQuery(command, 'find')).toBe(true);
    expect(matchesQuery(command, 'pages bug')).toBe(true);
    expect(matchesQuery(command, 'inbox')).toBe(false);
    expect(matchesQuery(command, '  ')).toBe(true);
  });
});

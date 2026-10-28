import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, IconButton } from '../button/button';
import { accessibleDescription, accessibleName, press, query, render } from '../testing';
import { Menu, MenuItem, MenuSeparator } from './menu';
import { Popover, PopoverTrigger } from './popover';
import { Tooltip } from './tooltip';

@Component({
  imports: [Button, IconButton, Menu, MenuItem, MenuSeparator, Popover, PopoverTrigger, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button os-button type="button" [os-popover-trigger]="actions">Actions</button>
    <div os-menu #actions="osPopover" aria-label="Project actions">
      <button os-menu-item type="button" (click)="chosen.set('rename')">Rename</button>
      <button os-menu-item type="button" disabled>Archive</button>
      <button os-menu-item type="button" (click)="chosen.set('duplicate')">Duplicate</button>
      <hr os-menu-separator />
      <button os-menu-item type="button" tone="danger" (click)="chosen.set('delete')">
        Delete
      </button>
    </div>
    <button os-button type="button" [os-popover-trigger]="share">Share</button>
    <div os-popover #share="osPopover" aria-label="Share" placement="top">Link</div>
    <button os-button type="button" os-tooltip="Saves a draft">Save</button>
    <button os-icon-button type="button" label="Copy link" os-tooltip="Copy link">C</button>
  `,
})
class Host {
  readonly chosen = signal('');
}

describe('Popover and PopoverTrigger', () => {
  it('link the trigger to the popover natively and anchor them', async () => {
    const { root } = await render(Host);
    const [, share] = root.querySelectorAll<HTMLButtonElement>('[popovertarget]');
    const popover = query(root, '.os-popover', HTMLElement);
    expect(share.getAttribute('popovertarget')).toBe(popover.id);
    expect(share.hasAttribute('aria-haspopup')).toBe(false);
    expect(popover.getAttribute('popover')).toBe('auto');
    expect(popover.dataset['placement']).toBe('top');
    expect(accessibleName(popover)).toBe('Share');
    expect(popover.style.getPropertyValue('position-anchor')).toBe(
      share.style.getPropertyValue('anchor-name'),
    );
  });
});

describe('Menu', () => {
  async function openMenu() {
    const rendered = await render(Host);
    const menu = query(rendered.root, '.os-menu', HTMLElement);
    menu.showPopover();
    return { ...rendered, menu, items: [...menu.querySelectorAll<HTMLElement>('.os-menu-item')] };
  }

  it('is a named menu of named menu items, opened by a button that says so', async () => {
    const { root, menu, items } = await openMenu();
    expect(menu.getAttribute('role')).toBe('menu');
    expect(accessibleName(menu)).toBe('Project actions');
    expect(query(root, 'button', HTMLButtonElement).getAttribute('aria-haspopup')).toBe('menu');
    expect(items.map((item) => [item.getAttribute('role'), accessibleName(item)])).toEqual([
      ['menuitem', 'Rename'],
      ['menuitem', 'Archive'],
      ['menuitem', 'Duplicate'],
      ['menuitem', 'Delete'],
    ]);
  });

  it('moves with arrow keys, Home, End and letters, skipping disabled items', async () => {
    const { menu, items } = await openMenu();
    const [rename, , duplicate, remove] = items;
    expect(document.activeElement).toBe(rename);
    press(menu, 'ArrowDown');
    expect(document.activeElement).toBe(duplicate);
    press(menu, 'ArrowDown');
    expect(document.activeElement).toBe(remove);
    press(menu, 'ArrowDown');
    expect(document.activeElement).toBe(rename);
    press(menu, 'ArrowUp');
    expect(document.activeElement).toBe(remove);
    press(menu, 'Home');
    expect(document.activeElement).toBe(rename);
    press(menu, 'End');
    expect(document.activeElement).toBe(remove);
    press(menu, 'd');
    expect(document.activeElement).toBe(duplicate);
  });

  it('closes when an item is chosen or focus leaves with Tab', async () => {
    const { host, menu, items } = await openMenu();
    items[2].click();
    expect(host.chosen()).toBe('duplicate');
    expect(menu.matches(':popover-open')).toBe(false);

    menu.showPopover();
    press(menu, 'Tab');
    expect(menu.matches(':popover-open')).toBe(false);
  });
});

describe('Tooltip', () => {
  it('describes its element, unless it repeats the element\'s name', async () => {
    const { root } = await render(Host);
    const [save, copy] = root.querySelectorAll<HTMLButtonElement>('[os-tooltip]');
    expect(accessibleName(save)).toBe('Save');
    expect(accessibleDescription(save)).toBe('Saves a draft');
    expect(accessibleName(copy)).toBe('Copy link');
    expect(copy.hasAttribute('aria-describedby')).toBe(false);
  });

  it('opens on hover and keyboard focus through interestfor and a hint popover', async () => {
    const { root } = await render(Host);
    const save = query(root, '[os-tooltip]', HTMLButtonElement);
    const tip = document.getElementById(save.getAttribute('interestfor') ?? '');
    expect(tip?.getAttribute('popover')).toBe('hint');
    expect(tip?.className).toBe('os-tooltip');
    expect(tip?.textContent).toBe('Saves a draft');
  });
});

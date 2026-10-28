import { Directive, ElementRef, inject, input } from '@angular/core';
import { PopoverBase } from './popover';

const ITEMS = '.os-menu-item:not(:disabled, [aria-disabled="true"])';

/**
 * A list of actions that opens from a button. Arrow keys, Home and End move between items,
 * typing a letter jumps to an item, and choosing one closes the menu.
 *
 * ```html
 * <button os-button [os-popover-trigger]="actions" aria-haspopup="menu">Actions</button>
 * <div os-menu #actions="osPopover" aria-label="Actions">
 *   <button os-menu-item (click)="rename()">Rename</button>
 *   <hr os-menu-separator />
 *   <button os-menu-item tone="danger" (click)="remove()">Delete</button>
 * </div>
 * ```
 */
@Directive({
  selector: '[os-menu]',
  exportAs: 'osPopover',
  providers: [{ provide: PopoverBase, useExisting: Menu }],
  host: {
    class: 'os-menu',
    role: 'menu',
    '(keydown)': 'onKeydown($event)',
    '(click)': 'onClick($event)',
  },
})
export class Menu extends PopoverBase {
  protected override onToggle(event: Event): void {
    super.onToggle(event);
    if (this.isOpen()) this.items()[0]?.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const items = this.items();
    const index = items.indexOf(document.activeElement as HTMLElement);
    const move: Record<string, number | undefined> = {
      ArrowDown: (index + 1) % items.length,
      ArrowUp: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    };
    let next = move[event.key];
    if (next === undefined && event.key.length === 1 && /\S/.test(event.key)) {
      // Typeahead: the next item, after the current one, that starts with the letter.
      const letter = event.key.toLowerCase();
      const order = [...items.slice(index + 1), ...items.slice(0, index + 1)];
      const match = order.find((item) => item.textContent.trim().toLowerCase().startsWith(letter));
      next = match ? items.indexOf(match) : undefined;
    }
    if (next === undefined) {
      if (event.key === 'Tab') this.hide();
      return;
    }
    event.preventDefault();
    items[next]?.focus();
  }

  protected onClick(event: MouseEvent): void {
    if ((event.target as Element).closest(ITEMS)) this.hide();
  }

  private items(): HTMLElement[] {
    return [...this.element.querySelectorAll<HTMLElement>(ITEMS)];
  }
}

/** An action in a Menu. `tone="danger"` for one that deletes. */
@Directive({
  selector: 'button[os-menu-item], a[os-menu-item]',
  host: {
    class: 'os-menu-item',
    role: 'menuitem',
    tabindex: '-1',
    '[attr.type]': 'isButton ? "button" : null',
    '[attr.data-tone]': 'tone() === "danger" ? "danger" : null',
  },
})
export class MenuItem {
  readonly tone = input<'default' | 'danger'>('default');
  protected readonly isButton =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON';
}

@Directive({
  selector: 'hr[os-menu-separator]',
  host: { class: 'os-menu-separator', role: 'separator' },
})
export class MenuSeparator {}

@Directive({
  selector: '[os-menu-label]',
  host: { class: 'os-menu-label', role: 'presentation' },
})
export class MenuLabel {}

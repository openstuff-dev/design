import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { iconSearch, type IconNode } from '@openstuff-dev/ui';
import { Dialog } from '../dialog/dialog';
import { Icon } from '../icon/icon';
import { uniqueId } from '../id';
import { Kbd } from '../feedback/feedback';

export interface Command {
  id: string;
  label: string;
  /** Commands with the same group are listed together under it. */
  group?: string;
  /** Text at the end of the row, such as a shortcut. */
  hint?: string;
  /** Other words that find it. */
  keywords?: readonly string[];
  icon?: IconNode;
}

interface Group {
  name: string | undefined;
  id: string;
  commands: { command: Command; id: string }[];
}

/** True when every word of the query starts a word of the text (or appears in it). */
export function matchesQuery(command: Command, query: string): boolean {
  const text = [command.label, command.group ?? '', ...(command.keywords ?? [])]
    .join(' ')
    .toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((word) => text.includes(word));
}

/**
 * Search and run commands from the keyboard. Open it from a shortcut such as Ctrl+K; type to
 * filter, arrow keys to move, Enter to run, Escape to close.
 *
 * ```html
 * <os-command-palette [(open)]="paletteOpen" [commands]="commands" (run)="go($event)" />
 * ```
 */
@Component({
  selector: 'os-command-palette',
  imports: [Dialog, Icon, Kbd],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      os-dialog
      class="os-command-palette"
      [attr.aria-label]="label()"
      [(open)]="open"
      (close)="query.set('')"
    >
      <div class="os-command-search">
        <svg os-icon [icon]="iconSearch"></svg>
        <input
          #search
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          autocomplete="off"
          spellcheck="false"
          [attr.aria-controls]="listId"
          [attr.aria-activedescendant]="activeId()"
          [attr.aria-label]="label()"
          [placeholder]="placeholder()"
          [value]="query()"
          (input)="onInput(search.value)"
          (keydown)="onKeydown($event)"
        />
        <kbd os-kbd aria-hidden="true">Esc</kbd>
      </div>
      <div class="os-command-list" role="listbox" [id]="listId" [attr.aria-label]="label()">
        @for (group of groups(); track group.id) {
          <div
            class="os-command-group"
            role="group"
            [attr.aria-labelledby]="group.name ? group.id : null"
          >
            @if (group.name) {
              <div class="os-command-group-label" [id]="group.id">{{ group.name }}</div>
            }
            @for (item of group.commands; track item.id) {
              <!-- The search box handles the keyboard (aria-activedescendant); this is for pointers. -->
              <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
              <div
                class="os-command-item"
                role="option"
                [id]="item.id"
                [attr.aria-selected]="item.id === activeId()"
                (click)="choose(item.command)"
                (pointermove)="active.set(item.command)"
              >
                @if (item.command.icon; as icon) {
                  <svg os-icon [icon]="icon"></svg>
                }
                {{ item.command.label }}
                @if (item.command.hint) {
                  <span class="os-command-hint">{{ item.command.hint }}</span>
                }
              </div>
            }
          </div>
        } @empty {
          <p class="os-command-empty" role="status">No results for "{{ query() }}"</p>
        }
      </div>
    </dialog>
  `,
})
export class CommandPalette {
  readonly open = model(false);
  readonly commands = input.required<readonly Command[]>();
  /** Names the dialog and the search box. */
  readonly label = input('Commands');
  readonly placeholder = input('Search pages and actions');
  /** The command the person chose. The palette closes first. */
  readonly run = output<Command>();

  protected readonly iconSearch = iconSearch;
  protected readonly listId = uniqueId('commands');
  protected readonly query = signal('');
  protected readonly active = signal<Command | undefined>(undefined);
  private readonly prefix = uniqueId('command');

  protected readonly results = computed(() =>
    this.commands().filter((command) => matchesQuery(command, this.query())),
  );

  protected readonly groups = computed(() => {
    const groups = new Map<string | undefined, Group>();
    for (const command of this.results()) {
      let group = groups.get(command.group);
      if (!group) {
        group = { name: command.group, id: `${this.prefix}-group-${String(groups.size)}`, commands: [] };
        groups.set(command.group, group);
      }
      group.commands.push({ command, id: `${this.prefix}-${command.id}` });
    }
    return [...groups.values()];
  });

  /** In display order, which is what the arrow keys follow. */
  private readonly ordered = computed(() =>
    this.groups().flatMap((group) => group.commands.map((item) => item.command)),
  );

  protected readonly activeId = computed(() => {
    const active = this.active();
    const current = active && this.ordered().includes(active) ? active : this.ordered().at(0);
    return current ? `${this.prefix}-${current.id}` : null;
  });

  protected onInput(value: string): void {
    this.query.set(value);
    this.active.set(undefined);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const list = this.ordered();
    if (!list.length) return;
    const index = Math.max(0, list.findIndex((command) => `${this.prefix}-${command.id}` === this.activeId()));
    const next: Record<string, number | undefined> = {
      ArrowDown: Math.min(index + 1, list.length - 1),
      ArrowUp: Math.max(index - 1, 0),
      PageDown: Math.min(index + 5, list.length - 1),
      PageUp: Math.max(index - 5, 0),
    };
    if (event.key === 'Enter') {
      event.preventDefault();
      this.choose(list[index]);
      return;
    }
    const target = next[event.key];
    if (target === undefined) return;
    event.preventDefault();
    this.active.set(list[target]);
    const id = `${this.prefix}-${list[target].id}`;
    queueMicrotask(() => document.getElementById(id)?.scrollIntoView({ block: 'nearest' }));
  }

  protected choose(command: Command | undefined): void {
    if (!command) return;
    this.open.set(false);
    this.run.emit(command);
  }
}

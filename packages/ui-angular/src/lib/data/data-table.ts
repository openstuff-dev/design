import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  Directive,
  inject,
  input,
  output,
  TemplateRef,
} from '@angular/core';
import { iconArrowDown, iconArrowUp, iconArrowUpDown } from '@openstuff-dev/ui';
import type { Tone } from '../badge/badge';
import { Icon } from '../icon/icon';

export interface Column<T> {
  /** The property shown by default, and the name an `os-cell` template uses. */
  key: keyof T & string;
  label: string;
  align?: 'start' | 'end';
  /** Allow sorting by this column (emits `sortChange` when clicked). */
  sortable?: boolean;
}

export interface SortState<K extends string = string> {
  key: K;
  direction: 'asc' | 'desc';
}

/**
 * How a column's cells render: `<ng-template os-cell="status" let-row>…</ng-template>`. The row
 * is untyped in the template, since a template can't see the table's row type.
 */
@Directive({ selector: 'ng-template[os-cell]' })
export class Cell {
  readonly key = input.required<string>({ alias: 'os-cell' });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * A table that turns into stacked rows when its container is narrow. The first column is each
 * row's title. Roles are set explicitly, so screen readers still read a table when stacked.
 *
 * ```html
 * <os-data-table caption="Projects" [columns]="columns" [rows]="projects" rowKey="id" bordered>
 *   <ng-template os-cell="name" let-project>
 *     <a [routerLink]="project.id">{{ project.name }}</a>
 *   </ng-template>
 *   <os-empty-state title="No projects yet">Make one to get started.</os-empty-state>
 * </os-data-table>
 * ```
 */
@Component({
  selector: 'os-data-table',
  imports: [Icon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'os-data-table',
    '[attr.data-bordered]': 'bordered() ? "" : null',
  },
  template: `
    <table role="table">
      <caption class="os-visually-hidden">
        {{
          caption()
        }}
      </caption>
      <thead role="rowgroup">
        <tr role="row">
          @for (column of columns(); track column.key) {
            <th
              role="columnheader"
              scope="col"
              [attr.data-align]="column.align ?? null"
              [attr.aria-sort]="ariaSort(column)"
            >
              @if (column.sortable) {
                <button class="os-th-sort" type="button" (click)="toggleSort(column.key)">
                  {{ column.label }}
                  <svg os-icon size="sm" [icon]="sortIcon(column.key)"></svg>
                </button>
              } @else {
                {{ column.label }}
              }
            </th>
          }
        </tr>
      </thead>
      <tbody role="rowgroup">
        @for (row of rows(); track rowId(row, $index)) {
          <tr
            role="row"
            [attr.tabindex]="interactive() ? 0 : null"
            [attr.aria-current]="isSelected(row, $index) ? 'true' : null"
            (click)="onRowClick(row)"
            (keydown.enter)="onRowClick(row)"
            (keydown.space)="onRowSpace($event, row)"
          >
            @for (column of columns(); track column.key) {
              <td
                role="cell"
                [attr.data-label]="column.label"
                [attr.data-align]="column.align ?? null"
              >
                @if (cells()[column.key]; as cell) {
                  <ng-container
                    [ngTemplateOutlet]="cell"
                    [ngTemplateOutletContext]="{ $implicit: row }"
                  />
                } @else {
                  {{ row[column.key] }}
                }
              </td>
            }
          </tr>
        } @empty {
          <tr role="row">
            <td role="cell" class="os-data-table-empty" [attr.colspan]="columns().length">
              <ng-content select="os-empty-state">{{ empty() }}</ng-content>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class DataTable<T extends object> {
  /** Names the table for screen readers (it's visually hidden). */
  readonly caption = input.required<string>();
  readonly columns = input.required<readonly Column<T>[]>();
  readonly rows = input.required<readonly T[]>();
  /** A property that identifies each row, so rows aren't re-created when the data changes. */
  readonly rowKey = input<keyof T>();
  /** Shown when there are no rows. Project an `os-empty-state` to explain and offer an action. */
  readonly empty = input('Nothing here yet.');
  /** Frame the table in a bordered surface card (like OpenPurpose's inbox and findings tables). */
  readonly bordered = input(false, { transform: booleanAttribute });
  /** Make rows focusable and clickable (emitting `rowClick`). */
  readonly interactive = input(false, { transform: booleanAttribute });
  /** Key value of the currently selected row (matched against `rowKey`). */
  readonly selectedKey = input<unknown>();
  /** Current sort state when using sortable columns. */
  readonly sort = input<SortState<keyof T & string> | null>(null);
  /** Emitted when a sortable column header is clicked. */
  readonly sortChange = output<SortState<keyof T & string>>();
  /** Emitted when an interactive row is clicked or activated with Enter/Space. */
  readonly rowClick = output<T>();

  private readonly cellTemplates = contentChildren(Cell);
  protected readonly cells = computed(
    () =>
      Object.fromEntries(
        this.cellTemplates().map((cell) => [cell.key(), cell.template]),
      ) as Partial<Record<string, TemplateRef<unknown>>>,
  );

  protected rowId(row: T, index: number): unknown {
    const key = this.rowKey();
    return key === undefined ? index : row[key];
  }

  protected isSelected(row: T, index: number): boolean {
    const selected = this.selectedKey();
    return selected !== undefined && selected !== null && this.rowId(row, index) === selected;
  }

  protected ariaSort(column: Column<T>): 'ascending' | 'descending' | 'none' | null {
    if (!column.sortable) return null;
    const current = this.sort();
    if (current?.key !== column.key) return 'none';
    return current.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIcon(key: keyof T & string) {
    const current = this.sort();
    if (current?.key !== key) return iconArrowUpDown;
    return current.direction === 'asc' ? iconArrowUp : iconArrowDown;
  }

  protected toggleSort(key: keyof T & string): void {
    const current = this.sort();
    const direction = current?.key === key && current.direction === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ key, direction });
  }

  protected onRowClick(row: T): void {
    if (this.interactive()) this.rowClick.emit(row);
  }

  protected onRowSpace(event: Event, row: T): void {
    if (!this.interactive()) return;
    event.preventDefault();
    this.rowClick.emit(row);
  }
}

/**
 * One number with its label and an optional hint, such as a change since yesterday. Content
 * goes under them, such as a sparkline or a short list.
 *
 * ```html
 * <os-stat-tile label="Open findings" value="6" hint="2 need a decision" tone="warning" />
 * ```
 */
@Component({
  selector: 'os-stat-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-stat-tile' },
  template: `
    <span class="os-stat-label">{{ label() }}</span>
    <span class="os-stat-value">{{ value() }}</span>
    @if (hint()) {
      <span class="os-stat-hint" [attr.data-tone]="tone()">{{ hint() }}</span>
    }
    <ng-content />
  `,
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>();
  /** Colours the hint: `success` for a good change, `danger` for a bad one. */
  readonly tone = input<Tone>('neutral');
}

@Directive({ selector: '[os-stat-grid]', host: { class: 'os-stat-grid' } })
export class StatGrid {}

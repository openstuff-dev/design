import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  Directive,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import type { Tone } from '../badge/badge';

export interface Column<T> {
  /** The property shown by default, and the name an `os-cell` template uses. */
  key: keyof T & string;
  label: string;
  align?: 'start' | 'end';
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
 * <os-data-table caption="Projects" [columns]="columns" [rows]="projects" rowKey="id">
 *   <ng-template os-cell="name" let-project>
 *     <a [routerLink]="project.id">{{ project.name }}</a>
 *   </ng-template>
 * </os-data-table>
 * ```
 */
@Component({
  selector: 'os-data-table',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-data-table' },
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
            <th role="columnheader" scope="col" [attr.data-align]="column.align ?? null">
              {{ column.label }}
            </th>
          }
        </tr>
      </thead>
      <tbody role="rowgroup">
        @for (row of rows(); track rowId(row, $index)) {
          <tr role="row">
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
              {{ empty() }}
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
  /** Shown when there are no rows. */
  readonly empty = input('Nothing here yet.');

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
}

/**
 * One number with its label and an optional hint, such as a change since yesterday.
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

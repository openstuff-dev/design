import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { uniqueId } from '../id';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/**
 * A row of options where one is picked, such as a view switch. It's native radios, so arrow
 * keys move between options and it works in a form.
 *
 * ```html
 * <os-segmented-control label="View" [options]="views" [(value)]="view" />
 * ```
 */
@Component({
  selector: 'os-segmented-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'os-segmented',
    role: 'radiogroup',
    '[attr.aria-label]': 'label()',
    '[attr.data-size]': 'size() === "md" ? null : size()',
  },
  template: `
    @for (option of options(); track option.value) {
      <label>
        <input
          type="radio"
          [name]="name()"
          [value]="option.value"
          [checked]="option.value === value()"
          [disabled]="option.disabled ?? false"
          (change)="value.set(option.value)"
        />
        {{ option.label }}
      </label>
    }
  `,
})
export class SegmentedControl<T extends string = string> {
  /** Names the group for screen readers. */
  readonly label = input.required<string>();
  readonly options = input.required<readonly SegmentOption<T>[]>();
  readonly value = model<T>();
  readonly size = input<'sm' | 'md'>('md');
  /** The radios' form name. */
  readonly name = input(uniqueId('segmented'));
}

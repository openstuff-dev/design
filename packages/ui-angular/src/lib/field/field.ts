import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  inject,
  InjectionToken,
  input,
  type Signal,
} from '@angular/core';
import { iconCircleAlert } from '@openstuff-dev/ui';
import { Icon } from '../icon/icon';
import { uniqueId } from '../id';

/** What a control inside a Field or SettingRow reads to wire itself up. */
export interface FieldContext {
  readonly controlId: string;
  /** The ids of the hint and error, for aria-describedby. */
  readonly describedBy: Signal<string | null>;
  readonly invalid: Signal<boolean>;
}

export const FIELD = new InjectionToken<FieldContext>('FIELD');

/**
 * A label, a control and an optional hint and error. The control gets the label's id,
 * aria-describedby and aria-invalid on its own.
 *
 * ```html
 * <os-field label="Name" hint="Shown to your team." [error]="nameError()">
 *   <input os-input [(ngModel)]="name" />
 * </os-field>
 * ```
 */
@Component({
  selector: 'os-field',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FIELD, useExisting: Field }],
  host: { class: 'os-field' },
  template: `
    <label class="os-label" [for]="controlId">{{ label() }}</label>
    <ng-content />
    @if (hint()) {
      <p class="os-hint" [id]="hintId">{{ hint() }}</p>
    }
    @if (error()) {
      <p class="os-error" [id]="errorId">
        <svg os-icon [icon]="iconCircleAlert"></svg>
        {{ error() }}
      </p>
    }
  `,
})
export class Field implements FieldContext {
  readonly label = input.required<string>();
  readonly hint = input<string>();
  /** Shown under the control, and marks it invalid. */
  readonly error = input<string | null>();

  readonly controlId = uniqueId('control');
  protected readonly hintId = uniqueId('hint');
  protected readonly errorId = uniqueId('error');
  protected readonly iconCircleAlert = iconCircleAlert;

  readonly invalid = computed(() => Boolean(this.error()));
  readonly describedBy = computed(
    () =>
      [this.hint() && this.hintId, this.error() && this.errorId].filter(Boolean).join(' ') || null,
  );
}

/** Styles and wires up a text input, textarea or select inside a Field (or on its own). */
@Directive({
  selector: 'input[os-input], textarea[os-textarea], select[os-select]',
  host: {
    '[class.os-input]': 'tag === "INPUT"',
    '[class.os-textarea]': 'tag === "TEXTAREA"',
    '[class.os-select]': 'tag === "SELECT"',
    '[attr.data-size]': 'size() === "md" ? null : size()',
    '[id]': 'id()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'isInvalid() || null',
  },
})
export class Control {
  protected readonly field = inject(FIELD, { optional: true });
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly tag = this.element.tagName;
  /** An aria-describedby written in the template is kept, before the field's hint and error. */
  private readonly ownDescribedBy = this.element.getAttribute('aria-describedby');
  protected readonly describedBy = computed(
    () => [this.ownDescribedBy, this.field?.describedBy()].filter(Boolean).join(' ') || null,
  );

  readonly size = input<'sm' | 'md'>('md');
  /** Marks the control invalid when it isn't in a Field. */
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly id = input(this.field?.controlId ?? uniqueId('control'));

  protected readonly isInvalid = computed(() => this.invalid() || (this.field?.invalid() ?? false));
}

/**
 * A checkbox, radio or switch with its label. The input keeps all its native behaviour.
 *
 * ```html
 * <label os-check><input type="checkbox" os-checkbox [(ngModel)]="reviews" /> Reviews</label>
 * <label os-check><input type="checkbox" os-switch [(ngModel)]="agentMode" /> Agent mode</label>
 * ```
 */
@Directive({ selector: 'label[os-check]', host: { class: 'os-check' } })
export class Check {}

@Directive({ selector: 'input[type=checkbox][os-checkbox]', host: { class: 'os-checkbox' } })
export class Checkbox {}

@Directive({ selector: 'input[type=radio][os-radio]', host: { class: 'os-radio' } })
export class Radio {}

/** A checkbox shown as an on/off switch (role="switch"). A SettingRow labels it. */
@Directive({
  selector: 'input[type=checkbox][os-switch]',
  host: {
    class: 'os-switch',
    role: 'switch',
    '[id]': 'id()',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
  },
})
export class Switch {
  protected readonly field = inject(FIELD, { optional: true });
  readonly id = input(this.field?.controlId ?? uniqueId('switch'));
}

/** A group of checkboxes or radios with a legend: `<fieldset os-fieldset>`. */
@Directive({ selector: 'fieldset[os-fieldset]', host: { class: 'os-fieldset' } })
export class Fieldset {}

import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import type { Tone } from '../badge/badge';
import { FIELD, type FieldContext } from '../field/field';
import { uniqueId } from '../id';

/**
 * A group of settings with a title, rows and an optional footer
 * (`<footer os-setting-card-footer>`). Leave out the title when the page puts a heading above
 * the card; then label it with `aria-labelledby` yourself.
 *
 * ```html
 * <section os-setting-card title="Profile" description="How others see you.">
 *   <os-setting-row label="Name"><input os-input [(ngModel)]="name" /></os-setting-row>
 *   <footer os-setting-card-footer><div os-form-actions>…</div></footer>
 * </section>
 * ```
 */
@Component({
  selector: '[os-setting-card]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'os-setting-card',
    '[attr.data-tone]': 'tone() === "danger" ? "danger" : null',
    '[attr.aria-labelledby]': 'title() ? titleId : ownLabelledBy',
  },
  template: `
    @if (title()) {
      <header class="os-setting-card-header">
        <h2 [attr.aria-level]="level()" [id]="titleId">{{ title() }}</h2>
        @if (description()) {
          <p>{{ description() }}</p>
        }
      </header>
    }
    <ng-content />
  `,
})
export class SettingCard {
  readonly title = input<string>();
  readonly description = input<string>();
  readonly level = input(2, { transform: numberAttribute });
  /** `danger` for a card of actions that delete or can't be undone. */
  readonly tone = input<Extract<Tone, 'neutral' | 'danger'>>('neutral');
  protected readonly titleId = uniqueId('setting-card');
  /** Without a title, the card keeps the aria-labelledby the page gives it. */
  protected readonly ownLabelledBy = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
    .getAttribute('aria-labelledby');
}

@Directive({
  selector: '[os-setting-card-footer]',
  host: { class: 'os-setting-card-footer' },
})
export class SettingCardFooter {}

/**
 * One setting: its label and description on the left, the control on the right (stacked in a
 * narrow card). The control inside gets the label and description wired up, like in a Field.
 *
 * ```html
 * <os-setting-row label="Agent mode" description="Shows what agents read." inline>
 *   <input type="checkbox" os-switch [(ngModel)]="agentMode" />
 * </os-setting-row>
 * ```
 */
@Component({
  selector: 'os-setting-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FIELD, useExisting: SettingRow }],
  host: { class: 'os-setting-row', '[attr.data-inline]': 'inline() ? "" : null' },
  template: `
    <div class="os-setting-text">
      <label [for]="controlId">{{ label() }}</label>
      @if (description()) {
        <p [id]="descriptionId">{{ description() }}</p>
      }
    </div>
    <div class="os-setting-control"><ng-content /></div>
  `,
})
export class SettingRow implements FieldContext {
  readonly label = input.required<string>();
  readonly description = input<string>();
  /** Keeps a small control (a switch, a button) at the end of the row instead of below. */
  readonly inline = input(false, { transform: booleanAttribute });

  readonly controlId = uniqueId('setting');
  protected readonly descriptionId = uniqueId('setting-description');
  readonly describedBy = computed(() => (this.description() ? this.descriptionId : null));
  readonly invalid = computed(() => false);
}

/**
 * A form's buttons, at the end, stacked full width in a narrow container. Put the main action
 * last. A `<span os-form-actions-note>` goes at the start.
 */
@Directive({ selector: '[os-form-actions]', host: { class: 'os-form-actions' } })
export class FormActions {}

@Directive({ selector: '[os-form-actions-note]', host: { class: 'os-form-actions-note' } })
export class FormActionsNote {}

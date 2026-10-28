import { booleanAttribute, ChangeDetectionStrategy, Component, Directive, input, output } from '@angular/core';
import { iconX } from '@openstuff-dev/ui';
import { Icon } from '../icon/icon';
import { uniqueId } from '../id';

export type Tone = 'neutral' | 'brand' | 'danger' | 'warning' | 'success' | 'info';

/** A short label such as a status or a count: `<span os-badge tone="success">Live</span>`. */
@Directive({
  selector: '[os-badge]',
  host: { class: 'os-badge', '[attr.data-tone]': 'tone()' },
})
export class Badge {
  readonly tone = input<Tone>('neutral');
}

/**
 * A value in a list, such as a path or a tag. With `removable`, it gets a remove button named
 * "Remove <its text>".
 *
 * ```html
 * <span os-chip removable (removed)="drop(path)">{{ path }}</span>
 * ```
 */
@Component({
  selector: '[os-chip]',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-chip', '[attr.data-tone]': 'tone()' },
  template: `
    <span [id]="textId">
      <ng-content />
    </span>
    @if (removable()) {
      <button
        class="os-chip-remove"
        type="button"
        [id]="buttonId"
        [attr.aria-labelledby]="buttonId + ' ' + textId"
        (click)="removed.emit()"
      >
        <svg os-icon [icon]="iconX"></svg>
        <span class="os-visually-hidden">Remove</span>
      </button>
    }
  `,
})
export class Chip {
  readonly tone = input<Tone>('neutral');
  readonly removable = input(false, { transform: booleanAttribute });
  readonly removed = output();

  protected readonly iconX = iconX;
  protected readonly textId = uniqueId('chip');
  protected readonly buttonId = uniqueId('chip-remove');
}

/** A coloured dot before a status: `<span os-status-dot tone="danger">Failed</span>`. */
@Directive({
  selector: '[os-status-dot]',
  host: {
    class: 'os-status-dot',
    '[attr.data-tone]': 'tone()',
    '[attr.data-pulse]': 'pulse() ? "" : null',
  },
})
export class StatusDot {
  readonly tone = input<Tone>('neutral');
  /** Pulses gently, for something in progress. */
  readonly pulse = input(false, { transform: booleanAttribute });
}

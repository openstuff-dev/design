import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  input,
  numberAttribute,
} from '@angular/core';
import {
  iconCircleAlert,
  iconCircleCheck,
  iconInfo,
  iconTriangleAlert,
  type IconNode,
} from '@openstuff-dev/ui';
import type { Tone } from '../badge/badge';
import { Icon } from '../icon/icon';

const TONE_ICONS: Record<Tone, IconNode> = {
  neutral: iconInfo,
  brand: iconInfo,
  info: iconInfo,
  success: iconCircleCheck,
  warning: iconTriangleAlert,
  danger: iconCircleAlert,
};

/**
 * A highlighted message in the page. Add `role="alert"` for an error the person must see now,
 * or `role="status"` for one that appears after an action.
 *
 * ```html
 * <os-callout tone="warning" title="Read-only">You can't edit this project.</os-callout>
 * ```
 */
@Component({
  selector: 'os-callout',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-callout', '[attr.data-tone]': 'tone()' },
  template: `
    <svg os-icon [icon]="icon()"></svg>
    <div>
      @if (title()) {
        <p
          class="os-callout-title"
          [attr.role]="level() ? 'heading' : null"
          [attr.aria-level]="level()"
        >
          {{ title() }}
        </p>
      }
      <div class="os-callout-body"><ng-content /></div>
      <div class="os-callout-actions"><ng-content select="[os-actions]" /></div>
    </div>
  `,
})
export class Callout {
  readonly tone = input<Tone>('info');
  readonly title = input<string>();
  /** Makes the title a heading of this level, for a callout that starts a section. */
  readonly level = input(undefined, {
    transform: (v: unknown) => (v === undefined || v === null || v === '' ? undefined : numberAttribute(v)),
  });

  protected readonly icon = computed(() => TONE_ICONS[this.tone()]);
}

/**
 * What a list or page shows when there's nothing in it yet, and what to do about it.
 *
 * ```html
 * <os-empty-state title="No proposals yet" [icon]="Inbox">
 *   When an agent suggests a rule, it shows up here.
 *   <button os-button os-actions variant="primary">Write one</button>
 * </os-empty-state>
 * ```
 */
@Component({
  selector: 'os-empty-state',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-empty-state', '[attr.data-bordered]': 'bordered() ? "" : null' },
  template: `
    @if (icon(); as icon) {
      <svg os-icon [icon]="icon"></svg>
    }
    <p class="os-empty-state-title" role="heading" [attr.aria-level]="level()">{{ title() }}</p>
    <p><ng-content /></p>
    <div class="os-empty-state-actions"><ng-content select="[os-actions]" /></div>
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly icon = input<IconNode>();
  /** The title's heading level, to fit the page's outline. */
  readonly level = input(3, { transform: numberAttribute });
  /** Draws a dashed border, for an empty area inside a page. */
  readonly bordered = input(false, { transform: booleanAttribute });
}

/** A key or shortcut: `<kbd os-kbd>⌘K</kbd>`. */
@Directive({ selector: 'kbd[os-kbd]', host: { class: 'os-kbd' } })
export class Kbd {}

/**
 * A placeholder while content loads. It's hidden from screen readers: set `aria-busy="true"`
 * on the region that's loading.
 */
@Component({
  selector: 'os-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'os-skeleton',
    'aria-hidden': 'true',
    '[attr.data-shape]': 'shape() === "circle" ? "circle" : null',
    '[style.--os-skeleton-lines]': 'lines()',
  },
  template: '',
})
export class Skeleton {
  /** How many lines of text it stands in for. */
  readonly lines = input(1, { transform: numberAttribute });
  readonly shape = input<'text' | 'circle'>('text');
}

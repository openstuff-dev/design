import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { anchor } from '@openstuff-dev/ui';
import { uniqueId } from '../id';

export type Placement = 'bottom' | 'top' | 'start' | 'end';

/** What Popover and Menu share: a native popover with an id, opened next to its trigger. */
@Directive({
  host: {
    popover: 'auto',
    '[id]': 'id',
    '[attr.data-placement]': 'placement() === "bottom" ? null : placement()',
    '(toggle)': 'onToggle($event)',
  },
})
export abstract class PopoverBase {
  readonly placement = input<Placement>('bottom');
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly id = uniqueId('popover');
  readonly isOpen = signal(false);

  show(source?: HTMLElement): void {
    if (!this.element.matches(':popover-open')) this.element.showPopover({ source });
  }

  hide(): void {
    if (this.element.matches(':popover-open')) this.element.hidePopover();
  }

  protected onToggle(event: Event): void {
    this.isOpen.set((event as ToggleEvent).newState === 'open');
  }
}

/**
 * Content that opens next to a button and closes on Escape or a click outside (the Popover
 * API). Open it with a PopoverTrigger.
 *
 * ```html
 * <button os-button [os-popover-trigger]="share">Share</button>
 * <div os-popover #share="osPopover" aria-label="Share">…</div>
 * ```
 */
@Directive({
  selector: '[os-popover]',
  exportAs: 'osPopover',
  providers: [{ provide: PopoverBase, useExisting: Popover }],
  host: { class: 'os-popover' },
})
export class Popover extends PopoverBase {}

/**
 * The button that opens a Popover or Menu. It's a native popovertarget, so the browser keeps
 * aria-expanded and returns focus to it when the popover closes.
 */
@Directive({
  selector: 'button[os-popover-trigger]',
  host: {
    '[attr.popovertarget]': 'target().id',
    '[attr.aria-haspopup]': 'target().element.getAttribute("role") === "menu" ? "menu" : null',
  },
})
export class PopoverTrigger {
  readonly target = input.required<PopoverBase>({ alias: 'os-popover-trigger' });

  constructor() {
    const trigger = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      destroyRef.onDestroy(anchor(trigger, this.target().element));
    });
  }
}

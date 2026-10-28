import { afterNextRender, DestroyRef, Directive, effect, ElementRef, inject, input } from '@angular/core';
import { anchor } from '@openstuff-dev/ui';
import { uniqueId } from '../id';
import type { Placement } from './popover';

/**
 * A short hint that shows on hover or keyboard focus (interestfor and popover="hint", with a
 * fallback where they're missing). It also becomes the element's accessible description, unless
 * it repeats its name, as on an icon button.
 *
 * ```html
 * <button os-icon-button label="Copy link" os-tooltip="Copy link"><svg os-icon …></svg></button>
 * ```
 */
@Directive({
  selector: '[os-tooltip]',
  host: {
    '[attr.interestfor]': 'id',
    '[attr.aria-describedby]': 'describes() ? id : null',
  },
})
export class Tooltip {
  readonly text = input.required<string>({ alias: 'os-tooltip' });
  readonly placement = input<Placement>('top');

  protected readonly id = uniqueId('tooltip');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly tip = document.createElement('div');

  constructor() {
    this.tip.id = this.id;
    this.tip.className = 'os-tooltip';
    this.tip.setAttribute('popover', 'hint');
    effect(() => {
      this.tip.textContent = this.text();
      const placement = this.placement();
      if (placement === 'top') delete this.tip.dataset['placement'];
      else this.tip.dataset['placement'] = placement;
    });
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // In the top layer when open, so where it sits in the DOM doesn't matter.
      document.body.append(this.tip);
      const undo = anchor(this.host, this.tip);
      destroyRef.onDestroy(() => {
        undo();
        this.tip.remove();
      });
    });
  }

  protected describes(): boolean {
    return this.text().trim() !== this.host.getAttribute('aria-label')?.trim();
  }
}

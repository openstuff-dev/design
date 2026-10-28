import { Directive, effect, ElementRef, inject, input } from '@angular/core';
import { renderIcon, type IconNode } from '@openstuff-dev/ui';

/**
 * A Lucide icon. It's decorative: put the text that names it next to it, or `label` on the
 * button that holds it.
 *
 * ```ts
 * import { Search } from 'lucide';
 * ```
 * ```html
 * <svg os-icon [icon]="Search"></svg>
 * ```
 */
@Directive({
  selector: 'svg[os-icon]',
  host: {
    class: 'os-icon',
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
    '[attr.data-size]': 'size() === "md" ? null : size()',
    '[attr.data-flip-rtl]': 'flipInRtl() ? "" : null',
  },
})
export class Icon {
  readonly icon = input.required<IconNode>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Turns the icon around in right-to-left text, for arrows that point forward. */
  readonly flipInRtl = input(false);

  constructor() {
    const svg = inject<ElementRef<SVGSVGElement>>(ElementRef).nativeElement;
    effect(() => {
      renderIcon(svg, this.icon());
    });
  }
}

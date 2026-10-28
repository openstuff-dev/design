import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';

export type ButtonVariant = 'primary' | 'default' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md';

/**
 * A native button or link styled as an OpenStuff button.
 *
 * ```html
 * <button os-button variant="primary" type="submit" [loading]="saving()">Save</button>
 * <a os-button variant="link" href="/docs">Docs</a>
 * ```
 */
@Component({
  selector: 'button[os-button], a[os-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  host: {
    class: 'os-button',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-disabled]': 'loading() || null',
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('md');
  /** Shows a spinner and ignores clicks, but keeps focus (unlike `disabled`). */
  readonly loading = input(false, { transform: booleanAttribute });

  constructor() {
    // Capture runs before the (click) handlers people add in their templates.
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.addEventListener(
      'click',
      (event) => {
        if (this.loading()) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      { capture: true },
    );
  }
}

/**
 * A square button with only an icon. `label` is required and becomes its accessible name.
 *
 * ```html
 * <button os-icon-button label="Close" (click)="close()"><os-icon [icon]="X" /></button>
 * ```
 */
@Component({
  selector: 'button[os-icon-button], a[os-icon-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  host: {
    class: 'os-button',
    'data-icon-only': '',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.aria-label]': 'label()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-disabled]': 'loading() || null',
  },
})
export class IconButton extends Button {
  readonly label = input.required<string>();
}

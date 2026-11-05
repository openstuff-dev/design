import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { uniqueId } from '../id';

/**
 * The Settings page: a side menu next to the chosen tab. When the space is narrow, the menu becomes
 * a row that scrolls, above the tab. It goes by its container, not the window.
 *
 * ```html
 * <os-settings>
 *   <nav os-settings-nav>
 *     <os-settings-group label="You">
 *       <a os-settings-link routerLink="account" routerLinkActive ariaCurrentWhenActive="page">
 *         Account
 *       </a>
 *     </os-settings-group>
 *   </nav>
 *   <router-outlet />
 * </os-settings>
 * ```
 */
@Component({
  selector: 'os-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-settings' },
  template: `
    <div class="os-settings-layout">
      <ng-content select="[os-settings-nav]" />
      <div class="os-settings-body"><ng-content /></div>
    </div>
  `,
})
export class Settings {}

/** The menu of `os-settings`. In the scrolling row, the current tab stays in view. */
@Directive({
  selector: 'nav[os-settings-nav]',
  host: { class: 'os-settings-nav', '[attr.aria-label]': 'label()' },
})
export class SettingsNav {
  /** Names the menu for screen readers. */
  readonly label = input('Settings');

  constructor() {
    const nav = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const observer = new MutationObserver(() => {
      revealCurrentLink(nav);
    });
    observer.observe(nav, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
    inject(DestroyRef).onDestroy(() => {
      observer.disconnect();
    });
  }
}

/** Scrolls only the row, so opening a tab doesn't also move the page. */
function revealCurrentLink(nav: HTMLElement): void {
  const link = nav.querySelector('[aria-current="page"]');
  if (!link || nav.scrollWidth <= nav.clientWidth) return;
  const room = 16;
  const navBox = nav.getBoundingClientRect();
  const linkBox = link.getBoundingClientRect();
  const before = linkBox.left - navBox.left;
  const after = linkBox.right - navBox.right;
  if (before < 0) nav.scrollBy({ left: before - room });
  else if (after > 0) nav.scrollBy({ left: after + room });
}

/** A heading and its links in the menu: "You", the tenant's name, "Server". */
@Component({
  selector: 'os-settings-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-settings-group', role: 'group', '[attr.aria-labelledby]': 'labelId' },
  template: `
    <p class="os-settings-group-label" [id]="labelId">{{ label() }}</p>
    <div class="os-settings-group-links"><ng-content /></div>
  `,
})
export class SettingsGroup {
  readonly label = input.required<string>();
  protected readonly labelId = uniqueId('settings-group');
}

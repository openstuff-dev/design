import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { IconNode } from '@openstuff-dev/ui';
import { Icon } from '../icon/icon';

/**
 * A link in the app's sidebar or in the Settings menu, so the two look the same. An icon and a
 * count are optional. Add the router's active state so the current page shows, and screen readers
 * hear it.
 *
 * ```html
 * <a os-nav-link routerLink="/inbox" routerLinkActive ariaCurrentWhenActive="page"
 *    [icon]="Inbox" [count]="waiting()">Inbox</a>
 * ```
 */
@Component({
  selector: 'a[os-nav-link], a[os-settings-link]',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-nav-link' },
  template: `
    @if (icon(); as icon) {
      <svg os-icon size="sm" [icon]="icon"></svg>
    }
    <ng-content />
    @if (count() !== null) {
      <span class="os-nav-link-count">{{ count() }}</span>
    }
  `,
})
export class NavLink {
  readonly icon = input<IconNode>();
  /** A number after the label, such as what's waiting. Leave it out or null to hide it. */
  readonly count = input<number | null>(null);
}

import { booleanAttribute, ChangeDetectionStrategy, Component, computed, Directive, input } from '@angular/core';
import { iconChevronsUpDown, iconSearch } from '@openstuff-dev/ui';
import { Icon } from '../icon/icon';

/** Two-letter initials for an organization, workspace or person name. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * A square rounded-corner initials badge for an organization, workspace or team. Pass a colour
 * (such as `var(--os-identity-0)`) or set `neutral` for a workspace-level badge.
 *
 * ```html
 * <span os-identity-badge [color]="orgColor(org.id)">{{ initials(org.name) }}</span>
 * ```
 */
@Directive({
  selector: '[os-identity-badge]',
  host: {
    class: 'os-identity-badge',
    '[attr.data-size]': 'size() === "md" ? null : size()',
    '[attr.data-neutral]': 'neutral() ? "" : null',
    '[style.background]': 'color() ?? null',
  },
})
export class IdentityBadge {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly neutral = input(false, { transform: booleanAttribute });
  readonly color = input<string | null>();
}

/** Circular initials avatar for a signed-in person. */
@Directive({
  selector: '[os-avatar]',
  host: { class: 'os-avatar' },
})
export class Avatar {}

/** A quiet section heading inside the sidebar, e.g. a workspace group name. */
@Directive({
  selector: '[os-shell-nav-label]',
  host: { class: 'os-shell-nav-label' },
})
export class ShellNavLabel {}

/** Pinned bottom area of the sidebar (Settings link and user row). */
@Directive({
  selector: '[os-shell-footer]',
  host: { class: 'os-shell-footer' },
})
export class ShellFooter {}

/**
 * The signed-in user row at the bottom of the sidebar: avatar, name, optional role line, and
 * trailing action (such as a Sign out icon button).
 *
 * ```html
 * <div os-shell-user [name]="me.name" [role]="roleLine()">
 *   <button os-icon-button variant="ghost" label="Sign out" (click)="signOut()">…</button>
 * </div>
 * ```
 */
@Component({
  selector: '[os-shell-user]',
  imports: [Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-shell-user' },
  template: `
    <span os-avatar aria-hidden="true">{{ badge() }}</span>
    <span class="os-shell-user-text">
      <span>{{ name() }}</span>
      @if (role()) {
        <small>{{ role() }}</small>
      }
    </span>
    <ng-content />
  `,
})
export class ShellUser {
  readonly name = input.required<string>();
  readonly role = input<string>();
  /** Override the initials shown in the avatar; defaults to two letters from `name`. */
  readonly avatarText = input<string>();
  protected readonly badge = computed(() => this.avatarText() ?? initials(this.name()));
}

/** Container for the workspace / organization switcher in the sidebar. */
@Directive({
  selector: '[os-shell-switcher]',
  host: { class: 'os-shell-switcher' },
})
export class ShellSwitcher {}

/**
 * The trigger button of a sidebar workspace/organization switcher, with a trailing up-down
 * chevron icon. Pair with `os-popover-trigger` and a `div[os-menu].os-shell-switcher-menu`.
 *
 * ```html
 * <button os-shell-switcher-button [os-popover-trigger]="wsMenu">
 *   <span os-identity-badge [color]="orgColor">AC</span>
 *   <span class="os-shell-switcher-text"><strong>Acme</strong><small>Workspace</small></span>
 * </button>
 * ```
 */
@Component({
  selector: 'button[os-shell-switcher-button]',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-shell-switcher-button', type: 'button' },
  template: `
    <ng-content />
    <svg os-icon size="sm" [icon]="iconChevronsUpDown"></svg>
  `,
})
export class ShellSwitcherButton {
  protected readonly iconChevronsUpDown = iconChevronsUpDown;
}

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

/**
 * Topbar button that opens the command palette, with a search icon, prompt text and keyboard
 * shortcut hint. Collapses to an icon button when the shell is narrow.
 *
 * ```html
 * <button os-search-trigger type="button" (click)="openPalette()">Search or jump to…</button>
 * ```
 */
@Component({
  selector: 'button[os-search-trigger]',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'os-search-trigger',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    <svg os-icon size="sm" [icon]="iconSearch"></svg>
    <span><ng-content /></span>
    @if (shortcut()) {
      <kbd class="os-kbd">{{ shortcut() }}</kbd>
    }
  `,
})
export class SearchTrigger {
  readonly shortcut = input(IS_MAC ? '⌘ K' : 'Ctrl K');
  readonly label = input<string>();
  protected readonly iconSearch = iconSearch;
  protected readonly ariaLabel = computed(
    () => this.label() ?? (this.shortcut() ? `Search and go to (${this.shortcut()})` : 'Search'),
  );
}

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { IconButton } from '../button/button';
import { accessibleName, query, render } from '../testing';
import {
  IdentityBadge,
  initials,
  SearchTrigger,
  ShellFooter,
  ShellNavLabel,
  ShellSwitcher,
  ShellSwitcherButton,
  ShellUser,
} from './shell';

@Component({
  imports: [
    IconButton,
    IdentityBadge,
    SearchTrigger,
    ShellFooter,
    ShellNavLabel,
    ShellSwitcher,
    ShellSwitcherButton,
    ShellUser,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div os-shell-switcher>
      <button os-shell-switcher-button type="button">
        <span os-identity-badge size="sm" color="var(--os-identity-0)">AC</span>
        <span class="os-shell-switcher-text"><strong>Acme</strong><small>Core</small></span>
      </button>
    </div>
    <span os-identity-badge neutral>WS</span>
    <div os-shell-nav-label>Workspace</div>
    <div os-shell-footer>
      <div os-shell-user name="Ada Lovelace" role="Admin">
        <button os-icon-button variant="ghost" type="button" label="Sign out">×</button>
      </div>
    </div>
    <button os-search-trigger type="button" shortcut="Ctrl K" (click)="opened.set(opened() + 1)">
      Search or jump to…
    </button>
  `,
})
class Host {
  readonly opened = signal(0);
}

describe('Shell chrome components', () => {
  it('computes two-letter initials', () => {
    expect(initials('Ada Lovelace')).toBe('AL');
    expect(initials('OpenPurpose')).toBe('OP');
    expect(initials('  First Middle Last  ')).toBe('FL');
    expect(initials('')).toBe('');
  });

  it('renders switcher, identity badges, nav label, footer user row and search trigger', async () => {
    const { host, root } = await render(Host);
    expect(query(root, '[os-shell-switcher]', HTMLElement).className).toBe('os-shell-switcher');
    const switcherBtn = query(root, 'button[os-shell-switcher-button]', HTMLButtonElement);
    expect(switcherBtn.querySelector('svg.os-icon')).not.toBeNull();

    const badges = [...root.querySelectorAll<HTMLElement>('[os-identity-badge]')];
    expect(badges[0].dataset['size']).toBe('sm');
    expect(badges[0].style.background).toBe('var(--os-identity-0)');
    expect(badges[1].hasAttribute('data-neutral')).toBe(true);

    expect(query(root, '[os-shell-nav-label]', HTMLElement).className).toBe('os-shell-nav-label');
    const user = query(root, '[os-shell-user]', HTMLElement);
    expect(query(user, '.os-avatar', HTMLElement).textContent.trim()).toBe('AL');
    expect(user.textContent).toContain('Ada Lovelace');
    expect(user.textContent).toContain('Admin');

    const trigger = query(root, 'button[os-search-trigger]', HTMLButtonElement);
    expect(accessibleName(trigger)).toBe('Search and go to (Ctrl K)');
    trigger.click();
    expect(host.opened()).toBe(1);
  });
});

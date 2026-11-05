import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { iconInfo } from '@openstuff-dev/ui';
import { NavLink } from '../shell/nav-link';
import { accessibleName, query, render } from '../testing';
import { Settings, SettingsGroup, SettingsNav } from './settings-layout';

@Component({
  imports: [NavLink, Settings, SettingsGroup, SettingsNav],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <os-settings>
      <nav os-settings-nav>
        <os-settings-group label="You">
          <a os-settings-link href="#a" [icon]="icon" aria-current="page">Account</a>
          <a os-settings-link href="#b" [attr.aria-current]="second() ? 'page' : null" [count]="3">
            Members
          </a>
        </os-settings-group>
      </nav>
      <p id="tab">The tab</p>
    </os-settings>
  `,
})
class Host {
  protected readonly icon = iconInfo;
  readonly second = signal(false);
}

describe('Settings, SettingsNav and SettingsGroup', () => {
  it('puts the menu next to the tab, in that order', async () => {
    const { root } = await render(Host);
    const layout = query(root, '.os-settings-layout', HTMLElement);
    expect([...layout.children].map((child) => child.className)).toEqual([
      'os-settings-nav',
      'os-settings-body',
    ]);
    expect(query(layout, '.os-settings-body', HTMLElement).textContent).toContain('The tab');
  });

  it('names the menu and each group for screen readers', async () => {
    const { root } = await render(Host);
    expect(accessibleName(query(root, 'nav', HTMLElement))).toBe('Settings');
    const group = query(root, 'os-settings-group', HTMLElement);
    expect(group.getAttribute('role')).toBe('group');
    expect(accessibleName(group)).toBe('You');
  });

  it('draws the link with the same class as the sidebar, with its icon and count', async () => {
    const { root } = await render(Host);
    const account = query(root, 'a[href="#a"]', HTMLAnchorElement);
    const members = query(root, 'a[href="#b"]', HTMLAnchorElement);
    expect(account.classList.contains('os-nav-link')).toBe(true);
    expect(account.querySelector('svg')).not.toBeNull();
    expect(account.querySelector('.os-nav-link-count')).toBeNull();
    expect(members.querySelector('.os-nav-link-count')?.textContent).toBe('3');
  });

  it('scrolls only the menu row when the current tab is out of view', async () => {
    const { fixture, host, root } = await render(Host);
    const nav = query(root, 'nav', HTMLElement);
    const account = query(root, 'a[href="#a"]', HTMLAnchorElement);
    const members = query(root, 'a[href="#b"]', HTMLAnchorElement);
    account.removeAttribute('aria-current');
    Object.defineProperty(nav, 'scrollWidth', { value: 500 });
    Object.defineProperty(nav, 'clientWidth', { value: 300 });
    const box = (left: number, right: number) => ({ left, right }) as DOMRect;
    nav.getBoundingClientRect = () => box(0, 300);
    members.getBoundingClientRect = () => box(350, 450);
    const scrollBy = vi.fn();
    nav.scrollBy = scrollBy as typeof nav.scrollBy;

    host.second.set(true);
    await fixture.whenStable();
    await Promise.resolve();

    expect(scrollBy).toHaveBeenCalledWith({ left: 166 });
  });
});

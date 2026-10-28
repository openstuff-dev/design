import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { iconX } from '@openstuff-dev/ui';
import { IconButton } from '../button/button';
import { Icon } from '../icon/icon';
import { accessibleName, query, render } from '../testing';
import { Badge, Chip, StatusDot } from './badge';

@Component({
  imports: [Badge, Chip, StatusDot, Icon, IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span os-badge tone="success">Live</span>
    <span os-status-dot tone="danger" pulse>Failed</span>
    <span os-chip removable (removed)="removed.set(true)">web/**</span>
    <button os-icon-button type="button" label="Close"><svg os-icon [icon]="x"></svg></button>
  `,
})
class Host {
  readonly removed = signal(false);
  protected readonly x = iconX;
}

describe('Badge, StatusDot, Chip and Icon', () => {
  it('reads each as its text, and names the chip remove button "Remove" and the chip', async () => {
    const { root } = await render(Host);
    // A <span> has no name of its own: screen readers read its text in the flow.
    expect(query(root, '.os-badge', HTMLElement).textContent.trim()).toBe('Live');
    expect(query(root, '.os-badge', HTMLElement).dataset['tone']).toBe('success');
    expect(query(root, '.os-status-dot', HTMLElement).hasAttribute('data-pulse')).toBe(true);
    expect(accessibleName(query(root, '.os-chip-remove', HTMLButtonElement))).toBe('Remove web/**');
  });

  it('keeps icons out of the accessible name', async () => {
    const { root } = await render(Host);
    const svg = query(root, 'svg', SVGSVGElement);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelectorAll('path')).toHaveLength(2);
    expect(accessibleName(query(root, 'button[os-icon-button]', HTMLButtonElement))).toBe('Close');
  });

  it('removes a chip from the keyboard: its remove button is a focusable native button', async () => {
    const { host, root } = await render(Host);
    const remove = query(root, '.os-chip-remove', HTMLButtonElement);
    remove.focus();
    expect(document.activeElement).toBe(remove);
    expect(remove.type).toBe('button');
    remove.click();
    expect(host.removed()).toBe(true);
  });
});

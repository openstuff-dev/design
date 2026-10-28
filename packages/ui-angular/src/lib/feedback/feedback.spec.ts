import { ChangeDetectionStrategy, Component } from '@angular/core';
import { iconInfo } from '@openstuff-dev/ui';
import { Button } from '../button/button';
import { accessibleName, query, render } from '../testing';
import { Callout, EmptyState, Kbd, Skeleton } from './feedback';

@Component({
  imports: [Button, Callout, EmptyState, Kbd, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <os-callout tone="danger" title="Couldn't save" role="alert">
      The server didn't answer.
      <button os-button os-actions type="button">Try again</button>
    </os-callout>
    <os-empty-state title="No proposals yet" [icon]="icon" level="2">
      Agents' suggestions show up here.
      <button os-button os-actions type="button">Write one</button>
    </os-empty-state>
    <kbd os-kbd>K</kbd>
    <os-skeleton lines="3" />
  `,
})
class Host {
  protected readonly icon = iconInfo;
}

describe('Callout, EmptyState, Kbd and Skeleton', () => {
  it('reads a callout as its title and text, and names the empty state heading', async () => {
    const { root } = await render(Host);
    const callout = query(root, 'os-callout', HTMLElement);
    expect(callout.dataset['tone']).toBe('danger');
    expect(callout.textContent).toMatch(/Couldn't save\s+The server didn't answer\./);
    const heading = query(root, '[role="heading"]', HTMLElement);
    expect(heading.getAttribute('aria-level')).toBe('2');
    expect(accessibleName(heading)).toBe('No proposals yet');
    expect(query(root, '.os-kbd', HTMLElement).tagName).toBe('KBD');
  });

  it('hides the skeleton from screen readers and keeps actions reachable by Tab', async () => {
    const { root } = await render(Host);
    const skeleton = query(root, 'os-skeleton', HTMLElement);
    expect(skeleton.getAttribute('aria-hidden')).toBe('true');
    expect(skeleton.style.getPropertyValue('--os-skeleton-lines')).toBe('3');
    const actions = [...root.querySelectorAll<HTMLButtonElement>('.os-callout-actions button, .os-empty-state-actions button')];
    expect(actions.map((button) => accessibleName(button))).toEqual(['Try again', 'Write one']);
    expect(actions.every((button) => button.tabIndex === 0)).toBe(true);
  });
});

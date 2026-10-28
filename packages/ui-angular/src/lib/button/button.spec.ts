import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button, IconButton } from './button';
import { accessibleName, query } from '../testing';

@Component({
  imports: [Button, IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      os-button
      type="button"
      variant="primary"
      [loading]="loading()"
      (click)="clicks.update((n) => n + 1)"
    >
      Save
    </button>
    <button os-icon-button type="button" label="Close">x</button>
    <a os-button variant="link" href="/docs">Docs</a>
  `,
})
class Host {
  readonly loading = signal(false);
  readonly clicks = signal(0);
}

describe('Button', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('keeps the native element and names it from its text or label', async () => {
    const { root } = await render();
    const [save, close] = root.querySelectorAll('button');
    expect(accessibleName(save)).toBe('Save');
    expect(accessibleName(close)).toBe('Close');
    expect(save.dataset['variant']).toBe('primary');
    expect(close.hasAttribute('data-icon-only')).toBe(true);
    expect(query(root, 'a', HTMLAnchorElement).className).toBe('os-button');
  });

  it('activates with the keyboard, and ignores it while loading', async () => {
    const { fixture, root } = await render();
    const save = query(root, 'button', HTMLButtonElement);
    save.focus();
    expect(document.activeElement).toBe(save);
    // A native button turns Enter and Space into a click.
    save.click();
    expect(fixture.componentInstance.clicks()).toBe(1);

    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    expect(save.getAttribute('aria-busy')).toBe('true');
    save.click();
    expect(fixture.componentInstance.clicks()).toBe(1);
    expect(document.activeElement).toBe(save);
  });
});

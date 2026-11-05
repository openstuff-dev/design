import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { accessibleName, query, render } from '../testing';
import { Toaster } from '../toast/toast';
import { CodeBlock, type CodeVariant } from './code-block';
import { CopyButton } from './copy-button';

@Component({
  imports: [CopyButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <os-copy-button text="abc" what="public key" />
    <os-copy-button id="icon" iconOnly text="abc" what="public key" />
  `,
})
class ButtonHost {}

@Component({
  imports: [CodeBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<os-code-block
    what="command"
    variantsLabel="Package manager"
    [variants]="variants()"
    [code]="code"
  />`,
})
class BlockHost {
  readonly variants = signal<readonly CodeVariant[]>([]);
  readonly code = 'npx nx build';
}

function stubClipboard(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
}

describe('CopyButton', () => {
  it('copies the text and says so', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    const show = vi.spyOn(TestBed.inject(Toaster), 'show').mockReturnValue(() => undefined);
    const { fixture, root } = await render(ButtonHost);
    const button = query(root, 'button', HTMLButtonElement);
    expect(accessibleName(button)).toBe('Copy the public key');

    button.click();
    await fixture.whenStable();

    expect(writeText).toHaveBeenCalledWith('abc');
    expect(show).toHaveBeenCalledWith('Copied the public key.', { tone: 'success' });
    expect(button.textContent).toContain('Copied');
  });

  it('says to select the text when the browser refuses', async () => {
    stubClipboard(() => Promise.reject(new Error('Denied')));
    const show = vi.spyOn(TestBed.inject(Toaster), 'show').mockReturnValue(() => undefined);
    const { fixture, root } = await render(ButtonHost);

    query(root, 'button', HTMLButtonElement).click();
    await fixture.whenStable();

    expect(show).toHaveBeenCalledWith('Your browser didn’t allow copying. Select the text instead.', {
      tone: 'warning',
    });
  });

  it('keeps its name when it shows only the icon', async () => {
    const { root } = await render(ButtonHost);
    expect(accessibleName(query(root, '#icon button', HTMLButtonElement))).toBe(
      'Copy the public key',
    );
  });
});

describe('CodeBlock', () => {
  it('shows the code with a copy button, and no switch without variants', async () => {
    const { root } = await render(BlockHost);
    expect(query(root, 'pre', HTMLElement).textContent).toBe('npx nx build');
    expect(accessibleName(query(root, 'pre', HTMLElement))).toBe('command');
    expect(query(root, 'pre', HTMLElement).getAttribute('tabindex')).toBe('0');
    expect(root.querySelector('os-segmented-control')).toBeNull();
    expect(accessibleName(query(root, 'button', HTMLButtonElement))).toBe('Copy the command');
  });

  it('switches between variants and copies the one shown', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    vi.spyOn(TestBed.inject(Toaster), 'show').mockReturnValue(() => undefined);
    const { fixture, host, root } = await render(BlockHost);
    host.variants.set([
      { label: 'npm', code: 'npm i x' },
      { label: 'pnpm', code: 'pnpm add x' },
    ]);
    await fixture.whenStable();
    expect(accessibleName(query(root, '[role="radiogroup"]', HTMLElement))).toBe('Package manager');
    expect(query(root, 'input[value="npm"]', HTMLInputElement).checked).toBe(true);
    expect(query(root, 'pre', HTMLElement).textContent).toBe('npm i x');

    query(root, 'input[value="pnpm"]', HTMLInputElement).click();
    await fixture.whenStable();
    expect(query(root, 'pre', HTMLElement).textContent).toBe('pnpm add x');

    query(root, 'os-copy-button button', HTMLButtonElement).click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith('pnpm add x');
  });
});

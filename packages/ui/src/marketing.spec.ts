import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COPIED_MS, startMarketingPage } from './marketing.js';

function pointer(type: string, target: Element, pointerType: string, x = 0, y = 0): void {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  target.dispatchEvent(event);
}

function byId(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`No #${id}`);
  return element;
}

function first(root: ParentNode, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`No ${selector}`);
  return element;
}

describe('startMarketingPage', () => {
  let stop: () => void;

  beforeEach(() => {
    document.body.innerHTML = `
      <article class="os-tile" id="a"><div class="os-viz"><a href="#x">link</a></div></article>
      <article class="os-tile" id="b"></article>
      <pre><code id="cmd">$ docker compose up -d</code></pre>
      <button data-copy="cmd"><span>Copy</span></button>`;
    stop = startMarketingPage();
  });

  afterEach(() => {
    stop();
    vi.useRealTimers();
  });

  it('moves the glow to the pointer', () => {
    const tile = byId('a');
    pointer('pointermove', tile, 'mouse', 40, 12);
    expect(tile.style.getPropertyValue('--os-glow-x')).toBe('40px');
    expect(tile.style.getPropertyValue('--os-glow-y')).toBe('12px');
  });

  it('plays a tile on tap and settles the others', () => {
    const a = byId('a');
    const b = byId('b');
    pointer('pointerup', a, 'touch');
    expect(a.hasAttribute('data-playing')).toBe(true);
    pointer('pointerup', b, 'touch');
    expect(a.hasAttribute('data-playing')).toBe(false);
    expect(b.hasAttribute('data-playing')).toBe(true);
    pointer('pointerup', document.body, 'touch');
    expect(b.hasAttribute('data-playing')).toBe(false);
  });

  it("doesn't toggle a tile when the tap is on a link inside it", () => {
    const a = byId('a');
    pointer('pointerup', first(a, 'a'), 'touch');
    expect(a.hasAttribute('data-playing')).toBe(false);
  });

  it('copies the command without its prompt and says so', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const button = first(document, 'button');

    button.click();
    await vi.waitFor(() => {
      expect(button.hasAttribute('data-copied')).toBe(true);
    });

    expect(writeText).toHaveBeenCalledWith('docker compose up -d');
    expect(button.textContent).toBe('Copied');
    expect(document.getElementById('os-copy-status')?.textContent).toBe('Copied to clipboard');
    vi.advanceTimersByTime(COPIED_MS);
    expect(button.textContent).toBe('Copy');
  });
});

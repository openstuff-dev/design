import { applyInterestInvokers, HIDE_DELAY_MS, SHOW_DELAY_MS } from './interest.js';

let remove: () => void;
let trigger: HTMLButtonElement;
let tip: HTMLElement;
let shown: boolean;

function query<T extends Element>(selector: string, type: new () => T, root?: ParentNode) {
  const found = (root ?? document).querySelector(selector);
  if (!(found instanceof type)) throw new Error(`No ${selector} in the test page.`);
  return found;
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = `
    <button interestfor="tip">Save</button>
    <div id="tip" popover="hint">Saves a draft</div>
    <p>Elsewhere</p>`;
  trigger = query('button', HTMLButtonElement);
  tip = query('#tip', HTMLElement);
  shown = false;
  // jsdom has no popover API.
  tip.showPopover = () => {
    shown = true;
  };
  tip.hidePopover = () => {
    shown = false;
  };
  remove = applyInterestInvokers();
});

afterEach(() => {
  remove();
  vi.useRealTimers();
});

const over = (el: Element) => el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
const out = (el: Element, to: Element) =>
  el.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: to }));

describe('applyInterestInvokers', () => {
  it('opens after the pointer rests on the trigger', () => {
    over(trigger);
    vi.advanceTimersByTime(SHOW_DELAY_MS - 1);
    expect(shown).toBe(false);
    vi.advanceTimersByTime(1);
    expect(shown).toBe(true);
  });

  it('stays open while the pointer moves onto the tooltip, and closes after it leaves', () => {
    over(trigger);
    vi.advanceTimersByTime(SHOW_DELAY_MS);
    out(trigger, tip);
    over(tip);
    vi.advanceTimersByTime(HIDE_DELAY_MS);
    expect(shown).toBe(true);

    out(tip, query('p', HTMLElement));
    vi.advanceTimersByTime(HIDE_DELAY_MS);
    expect(shown).toBe(false);
  });

  it('closes on Escape', () => {
    over(trigger);
    vi.advanceTimersByTime(SHOW_DELAY_MS);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(shown).toBe(false);
  });

  it('opens on keyboard focus and closes on blur', () => {
    vi.spyOn(trigger, 'matches').mockImplementation((selector) => selector === ':focus-visible');
    trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(shown).toBe(true);
    trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(shown).toBe(false);
  });
});

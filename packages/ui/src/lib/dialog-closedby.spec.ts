import { applyDialogClosedBy } from './dialog-closedby.js';

let remove: () => void;
let dialog: HTMLDialogElement;
let inside: HTMLButtonElement;

function query<T extends Element>(selector: string, type: new () => T, root?: ParentNode) {
  const found = (root ?? document).querySelector(selector);
  if (!(found instanceof type)) throw new Error(`No ${selector} in the test page.`);
  return found;
}

beforeEach(() => {
  document.body.innerHTML = '<dialog open closedby="any"><button>Inside</button></dialog>';
  dialog = query('dialog', HTMLDialogElement);
  inside = query('button', HTMLButtonElement, dialog);
  // jsdom has no layout or close(): give the dialog a box and a close that drops [open].
  const box = DOMRect.fromRect({ x: 100, y: 100, width: 200, height: 100 });
  dialog.getBoundingClientRect = () => box;
  dialog.close = () => {
    dialog.removeAttribute('open');
  };
  vi.spyOn(dialog, 'matches').mockImplementation((selector) => selector !== ':modal');
  remove = applyDialogClosedBy();
});

afterEach(() => {
  remove();
});

function press(target: Element, at: { x: number; y: number }, releaseOn = target) {
  const init = { bubbles: true, clientX: at.x, clientY: at.y };
  target.dispatchEvent(new MouseEvent('pointerdown', init));
  releaseOn.dispatchEvent(new MouseEvent('click', init));
}

describe('applyDialogClosedBy', () => {
  it('closes closedby="any" on a click on its backdrop', () => {
    press(dialog, { x: 10, y: 10 });
    expect(dialog.open).toBe(false);
  });

  it('stays open for a click inside, or a press inside that ends outside', () => {
    press(inside, { x: 150, y: 150 });
    expect(dialog.open).toBe(true);
    press(inside, { x: 150, y: 150 }, document.body);
    expect(dialog.open).toBe(true);
  });

  it('leaves other dialogs alone', () => {
    dialog.setAttribute('closedby', 'closerequest');
    press(document.body, { x: 10, y: 10 });
    expect(dialog.open).toBe(true);
  });

  it('closes a non-modal closedby="any" on Escape', () => {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(dialog.open).toBe(false);
  });

  it('stops Escape from closing closedby="none"', () => {
    dialog.setAttribute('closedby', 'none');
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
  });
});

/*
 * jsdom has no <dialog> methods, Popover API or scrollIntoView. These stand-ins keep the state
 * (open, :popover-open, toggle and close events) the components read.
 */
const openPopovers = new WeakSet<Element>();

function showDialog(this: HTMLDialogElement): void {
  this.setAttribute('open', '');
}
HTMLDialogElement.prototype.showModal = showDialog;
HTMLDialogElement.prototype.show = showDialog;
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement, value?: string) {
  if (!this.hasAttribute('open')) return;
  if (value !== undefined) this.returnValue = value;
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
};

function toggle(element: HTMLElement, state: 'open' | 'closed'): void {
  if (state === 'open') openPopovers.add(element);
  else openPopovers.delete(element);
  const event = new Event('toggle');
  Object.assign(event, { newState: state, oldState: state === 'open' ? 'closed' : 'open' });
  element.dispatchEvent(event);
}

HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
  if (!openPopovers.has(this)) toggle(this, 'open');
};
HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
  if (openPopovers.has(this)) toggle(this, 'closed');
};

// Called with .call(this) below, so it keeps its element.
// eslint-disable-next-line @typescript-eslint/unbound-method
const matches = Element.prototype.matches;
function patchedMatches(this: Element, selector: string): boolean {
  if (selector === ':popover-open') return openPopovers.has(this);
  return matches.call(this, selector);
}
Element.prototype.matches = patchedMatches as typeof Element.prototype.matches;

Element.prototype.scrollIntoView = function scrollIntoView() {
  // Nothing to scroll in jsdom.
};

// Say anchor positioning is native, so anchor() doesn't load its polyfill.
Object.defineProperty(globalThis, 'CSS', {
  value: { supports: () => true, escape: (value: string) => value },
  configurable: true,
});

// jsdom's own stylesheet hides every popover, since its selector engine never matches
// :popover-open. Keep them visible, so accessible names can be computed.
const style = document.createElement('style');
style.textContent = '[popover] { display: block !important; }';
document.head.append(style);

export {};

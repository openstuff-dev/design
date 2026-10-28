import { positionAnchors } from './polyfills.js';

let next = 0;

/**
 * Anchors a popover, menu or tooltip to the element that opens it, so it opens next to it
 * (CSS anchor positioning, polyfilled where missing). Returns a function that undoes it.
 *
 * @example anchor(button, menu)
 */
export function anchor(trigger: HTMLElement, popover: HTMLElement): () => void {
  const name = `--os-anchor-${String(next++)}`;
  trigger.style.setProperty('anchor-name', name);
  popover.style.setProperty('position-anchor', name);
  // Does nothing where anchor positioning is native; the polyfill reads these inline styles.
  void positionAnchors([trigger, popover]);
  return () => {
    trigger.style.removeProperty('anchor-name');
    popover.style.removeProperty('position-anchor');
  };
}

/** How long the pointer rests on a trigger before its tooltip opens, and lingers after leaving. */
export const SHOW_DELAY_MS = 400;
export const HIDE_DELAY_MS = 200;

/**
 * `interestfor` for browsers without it: a trigger with `interestfor="tip"` shows the popover
 * `#tip` on hover and on keyboard focus. It stays open while the pointer is over the trigger
 * or the tooltip, and closes on Escape (WCAG 1.4.13).
 *
 * Name the tooltip with `aria-describedby` on the trigger yourself; the fallback only shows
 * and hides it.
 */
export function applyInterestInvokers(root: Document = document): () => void {
  const timers = new WeakMap<HTMLElement, number>();
  // Each open tooltip and the trigger that opened it.
  const open = new Map<HTMLElement, Element>();

  const later = (target: HTMLElement, ms: number, run: () => void) => {
    clearTimeout(timers.get(target));
    timers.set(target, window.setTimeout(run, ms));
  };

  const show = (trigger: Element, target: HTMLElement) => {
    if (open.has(target)) return;
    try {
      // `source` anchors the tooltip to its trigger where the browser supports it.
      target.showPopover({ source: trigger as HTMLElement });
    } catch {
      return; // Not a popover, or already open.
    }
    open.set(target, trigger);
  };

  const hide = (target: HTMLElement) => {
    if (!open.delete(target)) return;
    try {
      target.hidePopover();
    } catch {
      // Already closed.
    }
  };

  const onOver = (event: Event) => {
    const found = find(root, event.target);
    if (found) {
      later(found.target, SHOW_DELAY_MS, () => {
        show(found.trigger, found.target);
      });
      return;
    }
    const tip = tooltipOf(event.target, open);
    if (tip) clearTimeout(timers.get(tip));
  };

  const onOut = (event: PointerEvent) => {
    const found = find(root, event.target) ?? tooltipPair(event.target, open);
    if (!found) return;
    const next = event.relatedTarget;
    const stillIn = next instanceof Node &&
      (found.trigger.contains(next) || found.target.contains(next));
    if (stillIn) return;
    later(found.target, HIDE_DELAY_MS, () => {
      hide(found.target);
    });
  };

  const onFocusIn = (event: FocusEvent) => {
    const found = find(root, event.target);
    if (found?.trigger.matches(':focus-visible')) {
      clearTimeout(timers.get(found.target));
      show(found.trigger, found.target);
    }
  };

  const onFocusOut = (event: FocusEvent) => {
    const found = find(root, event.target);
    if (found) hide(found.target);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || open.size === 0) return;
    for (const target of open.keys()) hide(target);
  };

  root.addEventListener('pointerover', onOver);
  root.addEventListener('pointerout', onOut);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  root.addEventListener('keydown', onKeyDown);
  return () => {
    root.removeEventListener('pointerover', onOver);
    root.removeEventListener('pointerout', onOut);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    root.removeEventListener('keydown', onKeyDown);
    for (const target of open.keys()) hide(target);
  };
}

interface Pair {
  trigger: Element;
  target: HTMLElement;
}

function find(root: Document, node: EventTarget | null): Pair | undefined {
  if (!(node instanceof Element)) return undefined;
  const trigger = node.closest('[interestfor]');
  const id = trigger?.getAttribute('interestfor');
  const target = id ? root.getElementById(id) : null;
  return trigger && target ? { trigger, target } : undefined;
}

function tooltipOf(node: EventTarget | null, open: Map<HTMLElement, Element>) {
  if (!(node instanceof Node)) return undefined;
  return [...open.keys()].find((tip) => tip.contains(node));
}

function tooltipPair(node: EventTarget | null, open: Map<HTMLElement, Element>): Pair | undefined {
  const target = tooltipOf(node, open);
  const trigger = target && open.get(target);
  return target && trigger ? { trigger, target } : undefined;
}

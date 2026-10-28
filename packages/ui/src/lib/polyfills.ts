import { detectSupport, type Support } from './support.js';

/** The cascade layer the popover polyfill puts its own styles in, under the reset. */
export const POPOVER_POLYFILL_LAYER = 'os.reset.popover-polyfill';

export type Polyfill = keyof Support;

/**
 * Loads only the polyfills this browser needs and returns which ones it loaded. Call it once,
 * early. Baseline "newly available" features and a few newer ones come through here, so menus,
 * tooltips and dialogs behave the same in every current browser.
 *
 * Anchor positioning is polyfilled once the page has loaded and reads the styles on the page
 * then. Content that renders later and uses anchors needs `positionAnchors()` after it's in.
 *
 * @example
 * import { loadPolyfills } from '@openstuff-dev/ui/polyfills';
 * await loadPolyfills();
 */
export async function loadPolyfills(support: Support = detectSupport()): Promise<Polyfill[]> {
  const loaded: Polyfill[] = [];

  // Invokers and the tooltip fallback call showPopover(), so popover comes first.
  if (!support.popover) {
    const { apply } = await import('@oddbird/popover-polyfill/fn');
    apply({ layerName: POPOVER_POLYFILL_LAYER });
    loaded.push('popover');
  }
  if (!support.invokerCommands) {
    const { apply } = await import('invokers-polyfill/fn');
    apply();
    loaded.push('invokerCommands');
  }
  if (!support.dialogClosedBy) {
    const { applyDialogClosedBy } = await import('./dialog-closedby.js');
    applyDialogClosedBy();
    loaded.push('dialogClosedBy');
  }
  if (!support.interestInvokers) {
    const { applyInterestInvokers } = await import('./interest.js');
    applyInterestInvokers();
    loaded.push('interestInvokers');
  }
  if (!support.anchorPositioning) {
    await whenLoaded();
    await positionAnchors();
    loaded.push('anchorPositioning');
  }
  return loaded;
}

/**
 * Runs the anchor positioning polyfill over `elements`, or the whole page. Does nothing in a
 * browser with native anchor positioning.
 */
export async function positionAnchors(elements?: HTMLElement[]): Promise<void> {
  if (detectSupport().anchorPositioning) return;
  const { default: polyfill } = await import('@oddbird/css-anchor-positioning/fn');
  await polyfill(elements ? { elements } : undefined);
}

function whenLoaded(): Promise<void> {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener('load', () => {
      resolve();
    }, { once: true });
  });
}

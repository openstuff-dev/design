/** Which of the newer overlay features this browser has natively. */
export interface Support {
  /** `popover`, `showPopover()`. Baseline 2025. */
  popover: boolean;
  /** `popover="hint"`, for tooltips. */
  popoverHint: boolean;
  /** CSS anchor positioning: `anchor-name`, `position-anchor`, `position-area`. */
  anchorPositioning: boolean;
  /** Invoker commands: `commandfor` and `command` on buttons. Baseline 2025. */
  invokerCommands: boolean;
  /** `interestfor`: open a popover on hover and focus. */
  interestInvokers: boolean;
  /** `closedby` on `<dialog>`, for light dismiss. */
  dialogClosedBy: boolean;
}

export function detectSupport(): Support {
  const hint = document.createElement('div');
  hint.setAttribute('popover', 'hint');
  return {
    popover: 'popover' in HTMLElement.prototype && 'showPopover' in HTMLElement.prototype,
    popoverHint: hint.popover === 'hint',
    anchorPositioning: typeof CSS !== 'undefined' && CSS.supports('anchor-name: --a'),
    invokerCommands: 'commandForElement' in HTMLButtonElement.prototype,
    interestInvokers: 'interestForElement' in HTMLButtonElement.prototype,
    dialogClosedBy: 'closedBy' in HTMLDialogElement.prototype,
  };
}

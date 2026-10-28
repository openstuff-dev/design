/**
 * `closedby` for browsers without it: `any` closes on a click outside the dialog (its
 * backdrop, for a modal) and on Escape, `none` stops Escape from closing it. `closerequest`
 * is what browsers already do for modal dialogs.
 */
export function applyDialogClosedBy(root: Document = document): () => void {
  let pressedOutside: HTMLDialogElement[] = [];

  const openDialogs = (value: string) =>
    [...root.querySelectorAll<HTMLDialogElement>(`dialog[open][closedby='${value}']`)];

  const onPointerDown = (event: PointerEvent) => {
    pressedOutside = openDialogs('any').filter((dialog) => isOutside(dialog, event));
  };

  // A press inside that ends outside (selecting text, say) doesn't close.
  const onClick = (event: MouseEvent) => {
    for (const dialog of pressedOutside) {
      if (dialog.open && isOutside(dialog, event)) dialog.close();
    }
    pressedOutside = [];
  };

  const onCancel = (event: Event) => {
    if (event.target instanceof HTMLDialogElement && event.target.getAttribute('closedby') === 'none') {
      event.preventDefault();
    }
  };

  // Modal dialogs get Escape from the browser; non-modal ones don't.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    const dialog = openDialogs('any').filter((d) => !d.matches(':modal')).at(-1);
    if (dialog) {
      event.preventDefault();
      dialog.close();
    }
  };

  root.addEventListener('pointerdown', onPointerDown, true);
  root.addEventListener('click', onClick, true);
  // cancel doesn't bubble, so listen while it travels down.
  root.addEventListener('cancel', onCancel, true);
  root.addEventListener('keydown', onKeyDown);
  return () => {
    root.removeEventListener('pointerdown', onPointerDown, true);
    root.removeEventListener('click', onClick, true);
    root.removeEventListener('cancel', onCancel, true);
    root.removeEventListener('keydown', onKeyDown);
  };
}

/** A click on a modal's backdrop targets the dialog itself, so compare with its box. */
function isOutside(dialog: HTMLDialogElement, event: MouseEvent): boolean {
  if (event.target instanceof Node && event.target !== dialog && dialog.contains(event.target)) {
    return false;
  }
  const box = dialog.getBoundingClientRect();
  return event.clientX < box.left || event.clientX > box.right ||
    event.clientY < box.top || event.clientY > box.bottom;
}

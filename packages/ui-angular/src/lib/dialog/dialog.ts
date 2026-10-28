import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { uniqueId } from '../id';

export type ClosedBy = 'any' | 'closerequest' | 'none';

/** What Dialog and Drawer share: opening and closing a native <dialog> from `open`. */
@Directive({
  host: {
    '[attr.closedby]': 'closedby()',
    '[attr.aria-labelledby]': 'titleId()',
    '(close)': 'open.set(false)',
  },
})
export abstract class DialogBase {
  /** Two-way: set it to open the dialog; it turns false when the dialog closes. */
  readonly open = model(false);
  /**
   * What closes it besides its own buttons: `any` (Escape or a click outside, the default),
   * `closerequest` (Escape only) or `none`.
   */
  readonly closedby = input<ClosedBy>('any');
  /** Opens without a backdrop and leaves the page usable. */
  readonly nonModal = input(false, { transform: booleanAttribute });

  readonly element = inject<ElementRef<HTMLDialogElement>>(ElementRef).nativeElement;
  /** Set by DialogTitle, which names the dialog. */
  readonly titleId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const dialog = this.element;
      if (this.open() && !dialog.open) {
        if (this.nonModal()) dialog.show();
        else dialog.showModal();
      } else if (!this.open() && dialog.open) {
        dialog.close();
      }
    });
  }

  close(returnValue?: string): void {
    this.element.close(returnValue);
  }
}

/**
 * A modal dialog on a native <dialog>: focus moves in and back, Escape closes it, and the page
 * behind it is inert. Name it with a DialogTitle.
 *
 * ```html
 * <dialog os-dialog [(open)]="editing">
 *   <header os-dialog-header><h2 os-dialog-title>Rename project</h2></header>
 *   <div os-dialog-body>…</div>
 *   <footer os-dialog-footer>
 *     <button os-button os-dialog-close>Cancel</button>
 *     <button os-button variant="primary" (click)="save()">Save</button>
 *   </footer>
 * </dialog>
 * ```
 */
@Component({
  selector: 'dialog[os-dialog]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: DialogBase, useExisting: Dialog }],
  host: { class: 'os-dialog', '[attr.data-size]': 'size() === "md" ? null : size()' },
  template: '<ng-content />',
})
export class Dialog extends DialogBase {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}

/**
 * A panel that slides in from the side, for details or a form next to a list. Same parts and
 * behaviour as Dialog.
 *
 * ```html
 * <dialog os-drawer [(open)]="showFinding">…</dialog>
 * ```
 */
@Component({
  selector: 'dialog[os-drawer]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: DialogBase, useExisting: Drawer }],
  host: {
    class: 'os-drawer',
    '[attr.data-side]': 'side() === "end" ? null : side()',
    '[attr.data-size]': 'size() === "md" ? null : size()',
  },
  template: '<ng-content />',
})
export class Drawer extends DialogBase {
  readonly side = input<'start' | 'end'>('end');
  readonly size = input<'md' | 'lg'>('md');
}

@Directive({ selector: '[os-dialog-header]', host: { class: 'os-dialog-header' } })
export class DialogHeader {}

@Directive({ selector: '[os-dialog-body]', host: { class: 'os-dialog-body' } })
export class DialogBody {}

@Directive({ selector: '[os-dialog-footer]', host: { class: 'os-dialog-footer' } })
export class DialogFooter {}

/** The dialog's heading. It becomes the dialog's accessible name. */
@Directive({ selector: '[os-dialog-title]', host: { '[id]': 'id' } })
export class DialogTitle {
  readonly id = uniqueId('dialog-title');

  constructor() {
    inject(DialogBase).titleId.set(this.id);
  }
}

/** Closes the dialog or drawer it's in: `<button os-button os-dialog-close>Cancel</button>`. */
@Directive({
  selector: 'button[os-dialog-close]',
  host: { type: 'button', '(click)': 'dialog.close(returnValue() || undefined)' },
})
export class DialogClose {
  protected readonly dialog = inject(DialogBase);
  /** The dialog's returnValue after closing. */
  readonly returnValue = input('', { alias: 'os-dialog-close' });
}

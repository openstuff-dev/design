import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
  input,
  output,
} from '@angular/core';
import { Button } from '../button/button';
import { uniqueId } from '../id';
import { Dialog, DialogBody, DialogClose, DialogFooter, DialogHeader, DialogTitle } from './dialog';

export interface ConfirmOptions {
  title: string;
  message: string;
  /** The confirm button's text. Name the action: "Delete draft", not "OK". */
  confirmLabel: string;
  cancelLabel?: string;
  /** Makes the confirm button red, for something that can't be undone. */
  danger?: boolean;
}

@Component({
  selector: 'os-confirm-dialog',
  imports: [Button, Dialog, DialogBody, DialogClose, DialogFooter, DialogHeader, DialogTitle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      os-dialog
      size="sm"
      closedby="closerequest"
      [open]="true"
      [attr.aria-describedby]="messageId"
      (close)="onClose($event)"
    >
      <header os-dialog-header>
        <h2 os-dialog-title>{{ options().title }}</h2>
      </header>
      <div os-dialog-body>
        <p [id]="messageId">{{ options().message }}</p>
      </div>
      <footer os-dialog-footer>
        <button os-button os-dialog-close type="button" autofocus>
          {{ options().cancelLabel ?? 'Cancel' }}
        </button>
        <button
          os-button
          os-dialog-close="confirm"
          type="button"
          [variant]="options().danger ? 'danger' : 'primary'"
        >
          {{ options().confirmLabel }}
        </button>
      </footer>
    </dialog>
  `,
})
export class ConfirmDialogView {
  readonly options = input.required<ConfirmOptions>();
  readonly closed = output<boolean>();
  protected readonly messageId = uniqueId('confirm-message');

  protected onClose(event: Event): void {
    this.closed.emit((event.target as HTMLDialogElement).returnValue === 'confirm');
  }
}

/**
 * Asks the person to confirm an action in a small modal dialog.
 *
 * ```ts
 * if (await inject(ConfirmDialog).confirm({
 *   title: 'Delete draft?',
 *   message: "The draft and its comments are deleted. You can't undo this.",
 *   confirmLabel: 'Delete draft',
 *   danger: true,
 * })) remove();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialog {
  private readonly app = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  /** Resolves to true when the person confirms, false when they cancel or press Escape. */
  confirm(options: ConfirmOptions): Promise<boolean> {
    const ref = createComponent(ConfirmDialogView, { environmentInjector: this.injector });
    ref.setInput('options', options);
    this.app.attachView(ref.hostView);
    document.body.append(ref.location.nativeElement as HTMLElement);
    return new Promise((resolve) => {
      ref.instance.closed.subscribe((confirmed) => {
        resolve(confirmed);
        // Let the close transition finish before the element goes.
        setTimeout(() => {
          ref.destroy();
        }, 250);
      });
    });
  }
}

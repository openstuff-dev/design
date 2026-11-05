import {
  afterNextRender,
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  createComponent,
  ElementRef,
  EnvironmentInjector,
  inject,
  Injectable,
  input,
  output,
} from '@angular/core';
import { Button } from '../button/button';
import { CodeBlock } from '../copy/code-block';
import { uniqueId } from '../id';
import { Dialog, DialogBody, DialogClose, DialogFooter, DialogHeader, DialogTitle } from './dialog';

export interface SecretOptions {
  title: string;
  /** The key, token or password. It's shown once, here. */
  secret: string;
  /** What it is, for the copy button and the warning: "API key". */
  what: string;
  /** What it's for and where to put it. */
  instructions: string;
}

@Component({
  selector: 'os-secret-dialog',
  imports: [
    Button, CodeBlock, Dialog, DialogBody, DialogClose, DialogFooter, DialogHeader, DialogTitle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      os-dialog
      closedby="none"
      [open]="true"
      [attr.aria-describedby]="instructionsId"
      (cancel)="$event.preventDefault()"
      (close)="closed.emit()"
    >
      <header os-dialog-header>
        <h2 os-dialog-title>{{ options().title }}</h2>
      </header>
      <div os-dialog-body>
        <p [id]="instructionsId">{{ options().instructions }}</p>
        <os-code-block wrap [code]="options().secret" [what]="options().what" />
        <p class="os-hint">This is the only time you’ll see this {{ options().what }}.</p>
      </div>
      <footer os-dialog-footer>
        <button os-button os-dialog-close variant="primary" type="button">I’ve copied it</button>
      </footer>
    </dialog>
  `,
})
export class SecretDialogView {
  readonly options = input.required<SecretOptions>();
  readonly closed = output();
  protected readonly instructionsId = uniqueId('secret-instructions');

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    // The dialog opens before its code block renders, and focus would land on "I've copied it":
    // one more press of Enter would then close it, and the secret would be lost.
    afterNextRender(() => {
      host.querySelector<HTMLElement>('os-copy-button button')?.focus();
    });
  }
}

/**
 * Shows a secret that can't be shown again, such as a new API key or a first password. Only the
 * "I've copied it" button closes it: Escape and clicking outside don't. Afterwards the secret is
 * gone from the page and focus is back where it was. Keep the secret out of signals and the page.
 *
 * ```ts
 * await inject(SecretDialog).show({
 *   title: 'Your new API key',
 *   secret: key,
 *   what: 'API key',
 *   instructions: 'Put it in your shop system, in the X-Api-Key header.',
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class SecretDialog {
  private readonly app = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  /** Resolves once the person has closed the dialog. */
  show(options: SecretOptions): Promise<void> {
    const before = document.activeElement;
    const ref = createComponent(SecretDialogView, { environmentInjector: this.injector });
    ref.setInput('options', options);
    this.app.attachView(ref.hostView);
    document.body.append(ref.location.nativeElement as HTMLElement);
    return new Promise((resolve) => {
      ref.instance.closed.subscribe(() => {
        // The element that had focus may have been re-rendered while the dialog was open.
        if (before instanceof HTMLElement && before.isConnected) before.focus();
        resolve();
        // Let the close transition finish before the element goes.
        setTimeout(() => {
          ref.destroy();
        }, 250);
      });
    });
  }
}

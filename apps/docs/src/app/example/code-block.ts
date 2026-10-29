import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Icon, IconButton, Toaster } from '@openstuff-dev/ui-angular';
import { Check, Copy } from 'lucide';

/** A block of code with a copy button. */
@Component({
  selector: 'docs-code',
  imports: [Icon, IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './code-block.css',
  template: `
    <div class="code">
      <pre tabindex="0" [attr.aria-label]="language() + ' code'"><code>{{ code() }}</code></pre>
      <button
        os-icon-button
        class="copy"
        type="button"
        variant="ghost"
        size="sm"
        [label]="'Copy ' + language()"
        (click)="copy()"
      >
        <svg os-icon size="sm" [icon]="copied() ? checkIcon : copyIcon"></svg>
      </button>
    </div>
  `,
})
export class CodeBlock {
  readonly code = input.required<string>();
  /** Named in the copy button's label, e.g. "Copy HTML". */
  readonly language = input('code');

  private readonly toaster = inject(Toaster);
  protected readonly copyIcon = Copy;
  protected readonly checkIcon = Check;
  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      setTimeout(() => {
        this.copied.set(false);
      }, 1500);
    } catch {
      this.toaster.show('Your browser didn\'t allow copying. Select the code instead.', {
        tone: 'warning',
      });
    }
  }
}

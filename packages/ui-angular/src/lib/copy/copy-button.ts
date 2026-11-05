import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  type OnDestroy,
  signal,
} from '@angular/core';
import { iconCheck, iconCopy } from '@openstuff-dev/ui';
import { Button, IconButton } from '../button/button';
import { Icon } from '../icon/icon';
import { Toaster } from '../toast/toast';

/**
 * Copies `text` and says so in a toast. If the browser refuses, the toast says to select the text
 * instead.
 *
 * ```html
 * <os-copy-button [text]="key.publicKey" what="public key" />
 * ```
 */
@Component({
  selector: 'os-copy-button',
  imports: [Button, Icon, IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (iconOnly()) {
      <button
        os-icon-button
        type="button"
        variant="ghost"
        size="sm"
        [label]="name()"
        (click)="copy()"
      >
        <svg os-icon size="sm" [icon]="copied() ? iconCheck : iconCopy"></svg>
      </button>
    } @else {
      <button os-button type="button" size="sm" [attr.aria-label]="name()" (click)="copy()">
        <svg os-icon size="sm" [icon]="copied() ? iconCheck : iconCopy"></svg>
        {{ copied() ? 'Copied' : 'Copy' }}
      </button>
    }
    <!-- A modal dialog makes the toast unreachable for screen readers, so say it here as well. -->
    <span class="os-visually-hidden" role="status">{{ dialogStatus() }}</span>
  `,
})
export class CopyButton implements OnDestroy {
  readonly text = input.required<string>();
  /** What's copied, for the button's name and the toast: "public key". */
  readonly what = input('text');
  /** Shows only the icon, for tight spots such as a table row. */
  readonly iconOnly = input(false, { transform: booleanAttribute });

  protected readonly iconCheck = iconCheck;
  protected readonly iconCopy = iconCopy;
  protected readonly copied = signal(false);
  protected readonly dialogStatus = signal('');
  protected readonly name = computed(() => `Copy the ${this.what()}`);

  private readonly toaster = inject(Toaster);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private timer?: ReturnType<typeof setTimeout>;

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.text());
      this.copied.set(true);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.copied.set(false);
      }, 1500);
      this.say(`Copied the ${this.what()}.`, 'success');
    } catch {
      this.say('Your browser didn’t allow copying. Select the text instead.', 'warning');
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }

  private say(message: string, tone: 'success' | 'warning'): void {
    this.toaster.show(message, { tone });
    if (this.element.closest('dialog[open]')) this.dialogStatus.set(message);
  }
}

import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  createComponent,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { iconX } from '@openstuff-dev/ui';
import type { Tone } from '../badge/badge';
import { Button, IconButton } from '../button/button';
import { Icon } from '../icon/icon';

export interface ToastOptions {
  tone?: Tone;
  /** One button, such as Undo. Choosing it closes the toast. */
  action?: { label: string; run: () => void };
  /**
   * How long it stays, in milliseconds. Defaults to 5 seconds, or 10 with an action; 0 keeps it
   * until it's closed. It pauses while the pointer is on it.
   */
  duration?: number;
}

interface Toast extends ToastOptions {
  id: number;
  message: string;
}

@Component({
  selector: 'os-toast-region',
  imports: [Button, IconButton, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-toast-region', popover: 'manual' },
  template: `
    @for (toast of toasts(); track toast.id) {
      <div
        class="os-toast"
        [attr.data-tone]="toast.tone ?? 'neutral'"
        [attr.role]="toast.tone === 'danger' ? 'alert' : 'status'"
        (pointerenter)="pause(toast)"
        (pointerleave)="resume(toast)"
      >
        <p class="os-toast-message">{{ toast.message }}</p>
        @if (toast.action; as action) {
          <button os-button type="button" size="sm" (click)="action.run(); dismiss(toast.id)">
            {{ action.label }}
          </button>
        }
        <button
          os-icon-button
          type="button"
          variant="ghost"
          size="sm"
          label="Close"
          (click)="dismiss(toast.id)"
        >
          <svg os-icon [icon]="iconX"></svg>
        </button>
      </div>
    }
  `,
})
export class ToastRegion {
  readonly toasts = signal<Toast[]>([]);
  protected readonly iconX = iconX;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  private readonly region = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    const region = this.region;
    effect(() => {
      const open = region.matches(':popover-open');
      if (this.toasts().length && !open) region.showPopover();
      if (!this.toasts().length && open) region.hidePopover();
    });
  }

  add(toast: Toast): void {
    // Showing it again puts it above a dialog that opened after it.
    if (this.region.matches(':popover-open')) {
      this.region.hidePopover();
      this.region.showPopover();
    }
    this.toasts.update((list) => [...list, toast]);
    this.resume(toast);
  }

  dismiss(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }

  protected pause(toast: Toast): void {
    clearTimeout(this.timers.get(toast.id));
  }

  protected resume(toast: Toast): void {
    const duration = toast.duration ?? (toast.action ? 10_000 : 5_000);
    if (duration > 0) {
      this.timers.set(toast.id, setTimeout(() => {
        this.dismiss(toast.id);
      }, duration));
    }
  }
}

/**
 * Short messages after an action, such as "Saved", in the corner of the screen. They're read
 * out by screen readers (role="status", or "alert" for the danger tone).
 *
 * ```ts
 * inject(Toaster).show('Draft deleted', { action: { label: 'Undo', run: restore } });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class Toaster {
  private readonly app = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private region?: ToastRegion;
  private next = 0;

  /** Shows a toast and returns a function that closes it. */
  show(message: string, options: ToastOptions = {}): () => void {
    const id = this.next++;
    this.getRegion().add({ ...options, id, message });
    return () => {
      this.region?.dismiss(id);
    };
  }

  private getRegion(): ToastRegion {
    if (!this.region) {
      const ref = createComponent(ToastRegion, { environmentInjector: this.injector });
      this.app.attachView(ref.hostView);
      document.body.append(ref.location.nativeElement as HTMLElement);
      this.region = ref.instance;
    }
    return this.region;
  }
}

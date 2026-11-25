import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injectable,
  input,
  output,
  signal,
} from '@angular/core';
import { anchor, iconBot } from '@openstuff-dev/ui';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { uniqueId } from '../id';

/**
 * Switches the whole document into agent mode (`data-agent-mode` on `<html>`), turning the normal
 * UI into the phosphor terminal costume. Apps whose agent mode lives on the server can call
 * `set(active)` from an effect; standalone apps can bind directly to `active()` and `toggle()`.
 */
@Injectable({ providedIn: 'root' })
export class AgentMode {
  readonly active = signal(document.documentElement.hasAttribute('data-agent-mode'));

  set(on: boolean): void {
    this.active.set(on);
    document.documentElement.toggleAttribute('data-agent-mode', on);
  }

  toggle(): void {
    this.set(!this.active());
  }
}

/**
 * The topbar switch for agent mode, with a bot icon, label, pill switch and an optional hint
 * tooltip anchored underneath.
 *
 * ```html
 * <button
 *   os-agent-switch
 *   type="button"
 *   [active]="agentMode.active()"
 *   tooltip="See exactly what an agent gets back."
 *   (click)="agentMode.toggle()"
 * >
 *   Agent mode
 * </button>
 * ```
 */
@Component({
  selector: 'button[os-agent-switch]',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'os-agent-switch',
    role: 'switch',
    '[attr.aria-checked]': 'active()',
    '[attr.interestfor]': 'tooltip() ? tipId : null',
    '[attr.aria-describedby]': 'tooltip() ? tipId : null',
  },
  template: `
    <svg os-icon size="sm" [icon]="iconBot"></svg>
    <span class="os-agent-switch-label"><ng-content /></span>
    <span class="os-agent-switch-track" aria-hidden="true">
      <span class="os-agent-switch-thumb"></span>
    </span>
  `,
})
export class AgentSwitch {
  readonly active = input(false, { transform: booleanAttribute });
  /** Optional hint shown on hover or focus under the switch. */
  readonly tooltip = input<string>();

  protected readonly iconBot = iconBot;
  protected readonly tipId = uniqueId('agent-tip');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly tip = document.createElement('div');
  private attached = false;
  private rendered = false;
  private undoAnchor: (() => void) | null = null;

  constructor() {
    this.tip.id = this.tipId;
    this.tip.className = 'os-tooltip';
    this.tip.setAttribute('popover', 'hint');
    this.tip.dataset['align'] = 'end';

    effect(() => {
      const text = this.tooltip()?.trim();
      this.tip.textContent = text ?? '';
      if (this.rendered) this.syncAttachment(!!text);
    });

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.rendered = true;
      this.syncAttachment(!!this.tooltip()?.trim());
    });

    destroyRef.onDestroy(() => {
      this.detach();
    });
  }

  private syncAttachment(show: boolean): void {
    if (show && !this.attached) {
      document.body.append(this.tip);
      this.undoAnchor = anchor(this.host, this.tip);
      this.attached = true;
    } else if (!show && this.attached) {
      this.detach();
    }
  }

  private detach(): void {
    this.undoAnchor?.();
    this.undoAnchor = null;
    this.tip.remove();
    this.attached = false;
  }
}

/**
 * The minimal shell frame shown while agent mode is active: an `os-agent-bar` over the page.
 */
@Directive({
  selector: '[os-agent-shell]',
  host: { class: 'os-agent-shell' },
})
export class AgentShell {}

/**
 * Sticky topbar for agent mode: product brand at the start (`os-agent-brand`), optional context
 * (such as an organization picker) in the middle, and an Exit button at the end.
 *
 * ```html
 * <header os-agent-bar [exiting]="switching()" (exit)="exitAgentMode()">
 *   <span os-agent-brand>OpenPurpose</span>
 *   <span>Agent in <strong>Acme</strong></span>
 * </header>
 * ```
 */
@Component({
  selector: 'header[os-agent-bar]',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-agent-bar' },
  template: `
    <div class="os-agent-bar-brand"><ng-content select="[os-agent-brand]" /></div>
    <div class="os-agent-bar-context"><ng-content /></div>
    <button os-button size="sm" type="button" [disabled]="exiting()" (click)="exit.emit()">
      {{ exitLabel() }}
    </button>
  `,
})
export class AgentBar {
  readonly exitLabel = input('Exit agent mode');
  readonly exiting = input(false, { transform: booleanAttribute });
  readonly exit = output();
}

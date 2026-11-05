import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import type { Tone } from '../badge/badge';
import { StatusDot } from '../badge/badge';
import { uniqueId } from '../id';

export type IntegrationStatus = 'not-connected' | 'connected' | 'problem' | 'server';

const STATUS: Record<IntegrationStatus, { label: string; tone: Tone }> = {
  'not-connected': { label: 'Not connected', tone: 'neutral' },
  connected: { label: 'Connected', tone: 'success' },
  problem: { label: 'Problem', tone: 'danger' },
  server: { label: 'Set by the server', tone: 'info' },
};

/**
 * One service the app can connect to: its mark, name and status, what it does, actions and a form.
 * The status is read out when it changes.
 *
 * ```html
 * <os-integration-card name="OpenVersion" status="connected" description="Tells open tabs…">
 *   <svg os-integration-mark>…</svg>
 *   <button os-button os-actions>Remove</button>
 *   <form>…</form>
 * </os-integration-card>
 * ```
 */
@Component({
  selector: 'os-integration-card',
  imports: [StatusDot],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-integration-card', role: 'group', '[attr.aria-labelledby]': 'nameId' },
  template: `
    <div class="os-integration-card-head">
      <div class="os-integration-card-mark"><ng-content select="[os-integration-mark]" /></div>
      <div class="os-integration-card-title">
        <h3 [id]="nameId" [attr.aria-level]="level()">{{ name() }}</h3>
        <span os-status-dot role="status" [tone]="shown().tone">{{ shown().label }}</span>
      </div>
      <div class="os-integration-card-actions"><ng-content select="[os-actions]" /></div>
    </div>
    @if (description()) {
      <p class="os-integration-card-description">{{ description() }}</p>
    }
    <div class="os-integration-card-body"><ng-content /></div>
  `,
})
export class IntegrationCard {
  readonly name = input.required<string>();
  readonly status = input<IntegrationStatus>('not-connected');
  /** Replaces the status's usual words. */
  readonly statusLabel = input<string>();
  /** What connecting it gives you. */
  readonly description = input<string>();
  /** The name's heading level, to fit the page's outline. */
  readonly level = input(3, { transform: numberAttribute });

  protected readonly nameId = uniqueId('integration');
  protected readonly shown = computed(() => {
    const status = STATUS[this.status()];
    return { tone: status.tone, label: this.statusLabel() ?? status.label };
  });
}

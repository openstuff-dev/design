import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { Button } from '../button/button';
import { CopyButton } from '../copy/copy-button';
import { ConfirmDialog } from '../dialog/confirm';
import { Callout } from '../feedback/feedback';
import { Control, Field } from '../field/field';
import { FormActions } from './settings';
import { IntegrationCard, type IntegrationStatus } from './integration-card';

/**
 * One server-wide connection, as `GET /api/admin/integrations` from `@openstuff-dev/server`
 * answers it. Secrets are never included: only whether one is stored.
 */
export interface ServerConnection {
  kind: string;
  name: string;
  url: string | null;
  publicKey: string | null;
  hasSigningSecret: boolean;
  hasDeployToken: boolean;
  status: 'not-connected' | 'connected' | 'problem' | 'set-by-server';
  source: 'database' | 'environment' | null;
  message: string | null;
  testedAt: string | null;
  /** Which secret this connection takes. Older servers leave it out; the kind decides then. */
  secret?: 'deploy-token' | 'signing-secret' | null;
  /** A value the message asks the person to copy, such as this server's address. */
  copy?: string | null;
}

/** What the card sends to save: a pasted connection string, or the separate details. */
export interface ServerConnectionInput {
  connectionString?: string;
  url?: string;
  publicKey?: string;
  signingSecret?: string;
  deployToken?: string;
}

export interface ServerConnectionTest {
  ok: boolean;
  message: string;
  copy?: string | null;
}

/**
 * How the card talks to the server. Each app wraps its own API service, so its sign-in,
 * request sharing and errors apply. A rejected promise's `message` is shown as is.
 *
 * ```ts
 * const client: ServerConnectionsClient = {
 *   save: (kind, body) => api.put(`/api/admin/integrations/${kind}`, body),
 *   test: (kind) => api.post(`/api/admin/integrations/${kind}/test`, {}),
 *   remove: (kind) => api.delete(`/api/admin/integrations/${kind}`).then(() => undefined),
 * };
 * ```
 */
export interface ServerConnectionsClient {
  save(kind: string, body: ServerConnectionInput): Promise<ServerConnection>;
  test(kind: string): Promise<ServerConnectionTest>;
  remove(kind: string): Promise<void>;
}

interface KindCopy {
  description: string;
  secretLabel: string;
  secretHint: string;
  pasteHint: string;
}

const SECRET_COPY = {
  'deploy-token': {
    secretLabel: 'Deploy token',
    secretHint: 'Lets this server publish its own version when it starts.',
  },
  'signing-secret': {
    secretLabel: 'Signing secret',
    secretHint: 'Lets messages be aimed at one tenant or role. Without it, people see only messages for everyone.',
  },
} as const;

const KINDS: Partial<Record<string, Omit<KindCopy, 'secretLabel' | 'secretHint'>>> = {
  openversion: {
    description: 'Open tabs learn about a new version and offer to reload.',
    pasteHint: 'Make it on the environment’s page in OpenVersion.',
  },
  openannounce: {
    description: 'News, announcements and maintenance messages show in the app.',
    pasteHint: 'Make it on the system’s page in OpenAnnounce.',
  },
};

const STATUS: Record<ServerConnection['status'], IntegrationStatus> = {
  'not-connected': 'not-connected',
  connected: 'connected',
  problem: 'problem',
  'set-by-server': 'server',
};

/**
 * A card that connects this server to OpenVersion or OpenAnnounce, on the routes of
 * `@openstuff-dev/server`. Paste a connection string, or enter the details; the server tests it
 * straight away and the card says what's wrong and how to fix it. Removing asks first.
 *
 * ```html
 * @for (connection of connections(); track connection.kind) {
 *   <os-server-connection-card [connection]="connection" [client]="client" (changed)="reload()" />
 * }
 * ```
 */
@Component({
  selector: 'os-server-connection-card',
  imports: [Button, Callout, Control, CopyButton, Field, FormActions, IntegrationCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <os-integration-card
      [name]="shown().name"
      [status]="status()"
      [statusLabel]="statusLabel()"
      [description]="copyText().description"
      [level]="level()"
    >
      <ng-container ngProjectAs="[os-integration-mark]">
        <ng-content select="[os-integration-mark]" />
      </ng-container>
      <ng-container ngProjectAs="[os-actions]">
        @if (shown().status !== 'not-connected' && !editing()) {
          <button os-button os-actions type="button" size="sm" [disabled]="busy()" (click)="test()">
            Test
          </button>
          @if (shown().source === 'database') {
            <button
              os-button
              os-actions
              type="button"
              size="sm"
              [disabled]="busy()"
              (click)="edit()"
            >
              Change
            </button>
            <button
              os-button
              os-actions
              type="button"
              size="sm"
              [disabled]="busy()"
              (click)="remove()"
            >
              Remove
            </button>
          }
        }
      </ng-container>

      @if (problem(); as problem) {
        <os-callout tone="danger" role="alert">
          {{ problem.message }}
          @if (problem.copy) {
            <os-copy-button os-actions [text]="problem.copy" what="address" />
          }
        </os-callout>
      } @else if (passed()) {
        <os-callout tone="success" role="status">{{ passed() }}</os-callout>
      }

      @if (shown().status === 'set-by-server') {
        <p class="os-server-connection-note">
          To change it, change the server’s environment variables and restart it.
        </p>
      }

      @if (shown().url && !editing()) {
        <dl class="os-server-connection-details">
          <dt>Address</dt>
          <dd>{{ shown().url }}</dd>
          <dt>Public key</dt>
          <dd>{{ shown().publicKey }}</dd>
          @if (secret(); as secret) {
            <dt>{{ secret.secretLabel }}</dt>
            <dd>{{ secretStored() ? 'Saved' : 'Not saved' }}</dd>
          }
        </dl>
      }

      @if (editing()) {
        <form class="os-server-connection-form" (submit)="save($event)">
          @if (!separate()) {
            <os-field label="Connection string" [hint]="copyText().pasteHint">
              <input
                os-input
                name="connectionString"
                type="password"
                autocomplete="off"
                spellcheck="false"
                [value]="pasted()"
                (input)="pasted.set(value($event))"
              />
            </os-field>
          } @else {
            <os-field label="Address" hint="Where it runs, such as https://version.example.com.">
              <input
                os-input
                name="url"
                type="url"
                autocomplete="off"
                [value]="url()"
                (input)="url.set(value($event))"
              />
            </os-field>
            <os-field label="Public key">
              <input
                os-input
                name="publicKey"
                autocomplete="off"
                spellcheck="false"
                [value]="publicKey()"
                (input)="publicKey.set(value($event))"
              />
            </os-field>
            @if (secret(); as secret) {
              <os-field
                optional
                [label]="secret.secretLabel"
                [hint]="
                  secretStored() ? 'Leave it empty to keep the saved one.' : secret.secretHint
                "
              >
                <input
                  os-input
                  name="secret"
                  type="password"
                  autocomplete="off"
                  spellcheck="false"
                  [value]="secretValue()"
                  (input)="secretValue.set(value($event))"
                />
              </os-field>
            }
          }
          <div os-form-actions>
            <button os-button type="button" variant="ghost" (click)="separate.set(!separate())">
              {{ separate() ? 'Paste a connection string instead' : 'Enter details instead' }}
            </button>
            @if (shown().status !== 'not-connected') {
              <button os-button type="button" [disabled]="busy()" (click)="editing.set(false)">
                Cancel
              </button>
            }
            <button os-button type="submit" variant="primary" [disabled]="busy() || !ready()">
              {{ busy() ? 'Testing…' : 'Connect' }}
            </button>
          </div>
        </form>
      }
    </os-integration-card>
  `,
})
export class ServerConnectionCard {
  private readonly confirmer = inject(ConfirmDialog);

  readonly connection = input.required<ServerConnection>();
  readonly client = input.required<ServerConnectionsClient>();
  /** The name's heading level, to fit the page's outline. */
  readonly level = input(3, { transform: numberAttribute });
  /** Says the connection changed: saved, tested or removed. Carries the card's new state. */
  readonly changed = output<ServerConnection>();

  /** The latest state: the input, or what the server answered since. */
  protected readonly shown = linkedSignal(() => this.connection());
  protected readonly editing = linkedSignal(() => this.connection().status === 'not-connected');
  protected readonly separate = signal(false);
  protected readonly busy = signal(false);
  protected readonly pasted = signal('');
  protected readonly url = linkedSignal(() => this.connection().url ?? '');
  protected readonly publicKey = linkedSignal(() => this.connection().publicKey ?? '');
  protected readonly secretValue = signal('');
  /** An answer to the last action, shown above the details. */
  private readonly answer = signal<{ ok: boolean; message: string; copy?: string | null } | null>(
    null,
  );

  protected readonly copyText = computed(() => {
    const known = KINDS[this.shown().kind];
    return {
      description: known?.description ?? '',
      pasteHint: known?.pasteHint ?? `Copy it from ${this.shown().name}.`,
    };
  });

  protected readonly secret = computed(() => {
    const connection = this.shown();
    const kind =
      connection.secret !== undefined
        ? connection.secret
        : connection.kind === 'openversion'
          ? 'deploy-token'
          : connection.kind === 'openannounce'
            ? 'signing-secret'
            : null;
    return kind ? { kind, ...SECRET_COPY[kind] } : null;
  });

  protected readonly secretStored = computed(() => {
    const connection = this.shown();
    return connection.hasDeployToken || connection.hasSigningSecret;
  });

  protected readonly status = computed(() => STATUS[this.shown().status]);
  protected readonly statusLabel = computed(() =>
    this.shown().status === 'set-by-server' ? 'Set by the server’s configuration' : undefined,
  );

  /** What went wrong: the last answer, or the stored result of the last test. */
  protected readonly problem = computed(() => {
    const answer = this.answer();
    if (answer) return answer.ok ? null : answer;
    const connection = this.shown();
    return connection.status === 'problem' && connection.message
      ? { message: connection.message, copy: connection.copy ?? null }
      : null;
  });

  protected readonly passed = computed(() => {
    const answer = this.answer();
    return answer?.ok ? answer.message : null;
  });

  protected readonly ready = computed(() =>
    this.separate()
      ? this.url().trim() !== '' && this.publicKey().trim() !== ''
      : this.pasted().trim() !== '',
  );

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected edit(): void {
    this.answer.set(null);
    this.editing.set(true);
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.ready() || this.busy()) return;
    const body: ServerConnectionInput = this.separate()
      ? { url: this.url().trim(), publicKey: this.publicKey().trim(), ...this.secretBody() }
      : { connectionString: this.pasted().trim() };
    await this.run(async () => {
      const saved = await this.client().save(this.shown().kind, body);
      this.shown.set(saved);
      this.pasted.set('');
      this.secretValue.set('');
      // The server saves even when the test fails, so the details stay open to fix.
      this.editing.set(saved.status !== 'connected');
      this.answer.set(
        saved.status === 'connected'
          ? { ok: true, message: saved.message ?? `Connected to ${saved.name}.` }
          : { ok: false, message: saved.message ?? 'The test failed.', copy: saved.copy ?? null },
      );
      this.changed.emit(saved);
    });
  }

  protected async test(): Promise<void> {
    await this.run(async () => {
      const result = await this.client().test(this.shown().kind);
      this.answer.set(result);
      const next: ServerConnection = {
        ...this.shown(),
        status:
          this.shown().status === 'set-by-server' ? 'set-by-server' : result.ok ? 'connected' : 'problem',
        message: result.message,
        copy: result.copy ?? null,
        testedAt: new Date().toISOString(),
      };
      this.shown.set(next);
      this.changed.emit(next);
    });
  }

  protected async remove(): Promise<void> {
    const name = this.shown().name;
    const sure = await this.confirmer.confirm({
      title: `Remove ${name}?`,
      message: `This server stops using ${name} and forgets its saved secret. Connect it again with a new connection string.`,
      confirmLabel: `Remove ${name}`,
      danger: true,
    });
    if (!sure) return;
    await this.run(async () => {
      await this.client().remove(this.shown().kind);
      const next: ServerConnection = {
        ...this.shown(),
        url: null,
        publicKey: null,
        hasDeployToken: false,
        hasSigningSecret: false,
        status: 'not-connected',
        source: null,
        message: null,
        copy: null,
        testedAt: null,
      };
      this.shown.set(next);
      this.url.set('');
      this.publicKey.set('');
      this.editing.set(true);
      this.answer.set(null);
      this.changed.emit(next);
    });
  }

  private secretBody(): Pick<ServerConnectionInput, 'deployToken' | 'signingSecret'> {
    const value = this.secretValue().trim();
    if (!value) return {};
    return this.secret()?.kind === 'deploy-token'
      ? { deployToken: value }
      : { signingSecret: value };
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    try {
      await action();
    } catch (err) {
      this.answer.set({
        ok: false,
        message: err instanceof Error && err.message ? err.message : 'That didn’t work. Try again.',
      });
    } finally {
      this.busy.set(false);
    }
  }
}

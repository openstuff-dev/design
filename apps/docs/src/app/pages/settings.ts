import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  Button,
  CodeBlock as OsCodeBlock,
  type Column,
  ConfirmDialog,
  Control,
  CopyButton,
  DataTable,
  EmptyState,
  FileInput,
  FormActions,
  FormActionsNote,
  NavLink,
  PageHeader,
  SecretDialog,
  SectionHeader,
  ServerConnectionCard,
  type ServerConnection,
  type ServerConnectionsClient,
  SettingCard,
  SettingCardBody,
  SettingCardFooter,
  SettingItem,
  SettingRow,
  Settings,
  SettingsGroup,
  SettingsNav,
  Switch,
  ThemePicker,
  Toaster,
} from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const SETTINGS = `
  <div class="cards">
    <section os-setting-card title="Profile" description="How others see you.">
      <os-setting-row label="Name" description="Shown to your team.">
        <input os-input value="Kim" />
      </os-setting-row>
      <os-setting-row label="Agent mode" description="Shows what agents read on every page." inline>
        <input type="checkbox" os-switch checked />
      </os-setting-row>
      <div os-setting-card-body>
        <p class="body-note">Anything that isn't a row goes in a body: a list, a few fields side by side, a callout.</p>
      </div>
      <footer os-setting-card-footer>
        <div os-form-actions>
          <p os-form-actions-note>Changes apply to all your devices.</p>
          <button os-button type="button">Cancel</button>
          <button os-button type="button" variant="primary" [loading]="saving()" (click)="save()">
            Save
          </button>
        </div>
      </footer>
    </section>

    <section os-setting-card tone="danger" title="Delete organization">
      <os-setting-row label="Delete everything" description="Projects, rules and history. You can't undo this." inline>
        <button os-button type="button" variant="danger">Delete organization…</button>
      </os-setting-row>
    </section>
  </div>
`;

@Component({
  selector: 'docs-settings-example',
  imports: [
    Button, Control, FormActions, FormActionsNote, SettingCard, SettingCardBody,
    SettingCardFooter, SettingRow, Switch,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: SETTINGS,
  styles: `
    .cards {
      display: grid;
      gap: var(--os-space-6);
    }

    .body-note {
      margin: 0;
      color: var(--os-fg-light);
      font-size: var(--os-text-sm);
    }
  `,
})
class SettingsExample {
  private readonly toaster = inject(Toaster);
  protected readonly saving = signal(false);

  protected save(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.toaster.show('Saved your profile', { tone: 'success' });
    }, 1000);
  }
}

const FULL_PAGE = `
  <os-settings>
    <nav os-settings-nav>
      <os-settings-group label="You">
        @for (link of you; track link.id) {
          <a os-settings-link href="#settings" [attr.aria-current]="tab() === link.id ? 'page' : null"
             (click)="go($event, link.id)">{{ link.label }}</a>
        }
      </os-settings-group>
      <os-settings-group label="Acme">
        @for (link of tenant; track link.id) {
          <a os-settings-link href="#settings" [attr.aria-current]="tab() === link.id ? 'page' : null"
             (click)="go($event, link.id)">{{ link.label }}</a>
        }
      </os-settings-group>
    </nav>

    @switch (tab()) {
      @case ('account') {
        <header os-section-header title="Account" description="Who you are in this app."></header>
        <section os-setting-card aria-label="Your details">
          <os-setting-row label="Name" description="Shown next to what you do.">
            <input os-input value="Kim" />
          </os-setting-row>
          <footer os-setting-card-footer>
            <div os-form-actions><button os-button type="button" variant="primary">Save</button></div>
          </footer>
        </section>
      }
      @case ('appearance') {
        <header os-section-header title="Appearance" description="Stored in this browser only."></header>
        <section os-setting-card aria-label="Theme">
          <div class="pad"><os-theme-picker /></div>
        </section>
      }
      @case ('members') {
        <header os-section-header title="Members" description="Who can sign in to Acme.">
          <button os-button type="button" variant="primary" (click)="addMember()">Add a member</button>
        </header>
        <os-data-table caption="Members" [columns]="columns" [rows]="[]">
          <os-empty-state title="No members yet">Add someone to get them started.</os-empty-state>
        </os-data-table>
      }
      @case ('keys') {
        <header os-section-header title="API keys" description="Let your systems reach Acme.">
          <button os-button type="button" variant="primary" (click)="newKey()">New key</button>
        </header>
        <section os-setting-card aria-label="Your keys">
          <os-setting-item title="Webshop" meta="Used 2 hours ago">
            <button os-button type="button" (click)="revoke()">Revoke…</button>
          </os-setting-item>
          <os-setting-item title="Old webshop" meta="Revoked in March" archived>
            <span os-setting-item-tag>Revoked</span>
          </os-setting-item>
        </section>
      }
      @case ('integrations') {
        <header os-section-header title="Integrations" description="Connect the other OpenStuff apps."></header>
        @for (connection of connections; track connection.kind) {
          <os-server-connection-card [connection]="connection" [client]="client" />
        }
      }
      @case ('transfer') {
        <header os-section-header title="Export and import" description="One file out, one file in."></header>
        <section os-setting-card aria-label="Import">
          <os-setting-row label="File to import" description="A file you exported from this app.">
            <input type="file" os-file-input accept=".json" />
          </os-setting-row>
        </section>
      }
    }
  </os-settings>
`;

type ExampleTab = 'account' | 'appearance' | 'members' | 'keys' | 'integrations' | 'transfer';

@Component({
  selector: 'docs-settings-full-example',
  imports: [
    Button, Control, DataTable, EmptyState, FileInput, FormActions, NavLink, SectionHeader,
    ServerConnectionCard, SettingCard, SettingCardFooter, SettingItem, SettingRow, Settings,
    SettingsGroup, SettingsNav, ThemePicker,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: FULL_PAGE,
  styles: `
    .pad {
      padding: var(--os-space-4) var(--os-space-5);
    }
  `,
})
class SettingsFullExample {
  private readonly secrets = inject(SecretDialog);
  private readonly confirmer = inject(ConfirmDialog);
  private readonly toaster = inject(Toaster);

  protected readonly tab = signal<ExampleTab>('account');

  protected readonly connections: ServerConnection[] = [
    {
      kind: 'openversion', name: 'OpenVersion', url: null, publicKey: null, hasSigningSecret: false,
      hasDeployToken: false, status: 'not-connected', source: null, message: null, testedAt: null,
      secret: 'deploy-token', copy: null,
    },
    {
      kind: 'openannounce', name: 'OpenAnnounce', url: 'https://announce.example.com',
      publicKey: 'oa_pub_4f1c9a', hasSigningSecret: true, hasDeployToken: false,
      status: 'set-by-server', source: 'environment', message: null, testedAt: null,
      secret: 'signing-secret', copy: null,
    },
  ];

  /** Stands in for the server: "blocked" in the string fails, one from OpenAnnounce is refused. */
  protected readonly client: ServerConnectionsClient = {
    save: (kind, body) => {
      const text = body.connectionString ?? '';
      if (kind === 'openversion' && text.startsWith('openannounce+')) {
        return Promise.reject(new Error('That’s a connection string from OpenAnnounce. Paste one from OpenVersion.'));
      }
      const blocked = text.includes('blocked') || (body.url ?? '').includes('blocked');
      const card = this.connections.find((item) => item.kind === kind) ?? this.connections[0];
      return Promise.resolve({
        ...card,
        url: body.url ?? 'https://version.example.com',
        publicKey: body.publicKey ?? 'ov_pub_8e2d71',
        hasDeployToken: Boolean(body.deployToken) || text !== '',
        status: blocked ? 'problem' : 'connected',
        source: 'database',
        message: blocked
          ? 'Add https://design.openstuff.dev to allowed origins in OpenVersion, on the environment’s page, then test again.'
          : 'Connected to OpenVersion. The deploy token works, so this server can publish its version.',
        copy: blocked ? 'https://design.openstuff.dev' : null,
        testedAt: new Date().toISOString(),
      });
    },
    test: () => Promise.resolve({ ok: true, message: 'Connected.', copy: null }),
    remove: () => Promise.resolve(),
  };

  protected readonly you: readonly { id: ExampleTab; label: string }[] = [
    { id: 'account', label: 'Account' },
    { id: 'appearance', label: 'Appearance' },
  ];

  protected readonly tenant: readonly { id: ExampleTab; label: string }[] = [
    { id: 'members', label: 'Members' },
    { id: 'keys', label: 'API keys' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'transfer', label: 'Export and import' },
  ];

  protected readonly columns: Column<{ name: string; role: string }>[] = [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
  ];

  protected go(event: Event, tab: ExampleTab): void {
    event.preventDefault();
    this.tab.set(tab);
  }

  protected newKey(): void {
    void this.secrets.show({
      title: 'Your new API key',
      secret: 'osk_live_8f3a91c27be64d05a1f7e2c94b6d3e18',
      what: 'API key',
      instructions: 'Put it in your webshop\'s settings, under "API key".',
    });
  }

  protected addMember(): void {
    void this.secrets.show({
      title: 'Kim can sign in now',
      secret: 'plum-river-42-anchor',
      what: 'password',
      instructions: 'Send it to Kim. They sign in with their email and this password.',
    });
  }

  protected async revoke(): Promise<void> {
    const sure = await this.confirmer.confirm({
      title: 'Revoke this key?',
      message: 'Systems that use it stop working right away. You can\'t undo this.',
      confirmLabel: 'Revoke key',
      danger: true,
    });
    if (sure) this.toaster.show('Revoked the key.', { tone: 'success' });
  }
}

const CODE = `
  <os-copy-button text="https://relay.example" what="address" />
  <os-copy-button iconOnly text="https://relay.example" what="address" />
  <os-code-block code="npx nx run-many -t build" what="command" />
  <os-code-block what="install command" variantsLabel="Package manager" [variants]="managers" />
`;

@Component({
  selector: 'docs-code-example',
  imports: [CopyButton, OsCodeBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: CODE,
  styles: `
    :host {
      display: grid;
      gap: var(--os-space-3);
      justify-items: start;
    }

    os-code-block {
      justify-self: stretch;
    }
  `,
})
class CodeExample {
  protected readonly managers = [
    { label: 'npm', code: 'npm install @openstuff-dev/version' },
    { label: 'pnpm', code: 'pnpm add @openstuff-dev/version' },
    { label: 'yarn', code: 'yarn add @openstuff-dev/version' },
  ];
}

@Component({
  selector: 'docs-settings-page',
  imports: [CodeBlock, CodeExample, Example, PageHeader, SettingsExample, SettingsFullExample],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Settings"
      description="Cards of labelled settings, each row a label, a description and a control."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />
      <div class="prose">
        <p>
          A row wires its label and description to the control inside, like a field does.
          <code>inline</code> keeps a short control (a switch or a button) beside the text; in a
          narrow card the control moves under it. Drag the corner to see it. A
          <code>tone="danger"</code> card holds what can't be undone, at the end of the page.
        </p>
        <p>
          Rows, items, the header and the footer pad themselves. Put any other content (a list, a
          row of fields, a callout, an empty state) in <code>[os-setting-card-body]</code>, so it
          lines up with the rows instead of touching the card's edge.
        </p>
        <p>
          While a tab loads, <code>slowLoading()</code> from
          <code>@openstuff-dev/ui-angular</code> shows <code>os-skeleton</code> only when the
          request takes longer than 300 ms, so a fast load doesn't flash.
          <code>onReturn(fn)</code> reloads when the window gets focus or the network comes back.
        </p>
      </div>
      <docs-example [code]="settings"><docs-settings-example /></docs-example>

      <div class="prose">
        <h2>A whole Settings page</h2>
        <p>
          <code>os-settings</code> puts a menu next to the chosen tab. Every OpenStuff app uses the
          same groups in the same order: You, the tenant's name, Server. A tab shows only if the
          person's role can use it, and a group with no tabs disappears. Drag the corner: below
          44rem the menu becomes a row that scrolls, above the tab, and the current tab stays in
          view.
        </p>
        <p>
          Links are <code>a[os-settings-link]</code>, which look like the app sidebar's
          <code>a[os-nav-link]</code>. Use the router's
          <code>routerLinkActive ariaCurrentWhenActive="page"</code> so the current tab shows.
        </p>
        <p>
          Each tab opens with <code>os-section-header</code>. A list of things uses
          <code>os-setting-item</code> in a card, or an <code>os-data-table</code> that projects an
          <code>os-empty-state</code>. <code>os-integration-card</code> shows a service and its
          status: Not connected, Connected, Problem or Set by the server.
          <code>os-server-connection-card</code> builds on it for the server's own connections:
          paste a connection string (try one with "blocked" in it), or enter the details instead.
          Each app gives it a small <code>ServerConnectionsClient</code> around its own API service.
        </p>
        <p>
          <code>SecretDialog</code> shows a key or password that can't be shown again. Only "I've
          copied it" closes it, so try Escape: choose API keys, then New key. Then focus goes back
          and the secret is gone. <code>provideTheme(&#123; storageKey &#125;)</code> gives each app
          its own stored choice and applies it on start; <code>os-theme-picker</code> changes it.
        </p>
      </div>
      <docs-example [code]="fullPage"><docs-settings-full-example /></docs-example>

      <div class="prose">
        <h2>Copy buttons and code blocks</h2>
        <p>
          <code>os-copy-button</code> copies and says so in a toast. <code>os-code-block</code> adds
          a block of code around one, with optional variants. Give <code>what</code> so people and
          screen readers know what's copied. Add <code>wrap</code> for a key you want to see whole.
        </p>
      </div>
      <docs-example [code]="codeExample"><docs-code-example /></docs-example>
    </div>
  `,
})
export class SettingsPage {
  protected readonly settings = SETTINGS;
  protected readonly fullPage = FULL_PAGE;
  protected readonly codeExample = CODE;
  protected readonly usage = `import {
  CodeBlock, CopyButton, FormActions, FormActionsNote, IntegrationCard, NavLink, provideTheme,
  SecretDialog, SectionHeader, SettingCard, SettingCardFooter, SettingItem, SettingRow, Settings,
  SettingsGroup, SettingsNav, ThemePicker,
} from '@openstuff-dev/ui-angular';`;
}

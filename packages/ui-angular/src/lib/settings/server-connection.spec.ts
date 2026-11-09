import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../dialog/confirm';
import { query, render } from '../testing';
import {
  type ServerConnection,
  ServerConnectionCard,
  type ServerConnectionInput,
  type ServerConnectionsClient,
} from './server-connection';

const empty: ServerConnection = {
  kind: 'openversion',
  name: 'OpenVersion',
  url: null,
  publicKey: null,
  hasSigningSecret: false,
  hasDeployToken: false,
  status: 'not-connected',
  source: null,
  message: null,
  testedAt: null,
};

const connected: ServerConnection = {
  ...empty,
  url: 'https://version.example.com',
  publicKey: 'ov_pub_1',
  hasDeployToken: true,
  status: 'connected',
  source: 'database',
  message: 'Connected.',
  testedAt: '2026-11-09T08:00:00Z',
};

class FakeClient implements ServerConnectionsClient {
  saved: { kind: string; body: ServerConnectionInput }[] = [];
  removed: string[] = [];
  answer: ServerConnection = connected;
  failSave: Error | null = null;

  save(kind: string, body: ServerConnectionInput): Promise<ServerConnection> {
    this.saved.push({ kind, body });
    return this.failSave ? Promise.reject(this.failSave) : Promise.resolve(this.answer);
  }

  test(): Promise<{ ok: boolean; message: string }> {
    return Promise.resolve({ ok: true, message: 'OpenVersion answered.' });
  }

  remove(kind: string): Promise<void> {
    this.removed.push(kind);
    return Promise.resolve();
  }
}

@Component({
  imports: [ServerConnectionCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<os-server-connection-card [connection]="connection()" [client]="client" />`,
})
class Host {
  readonly connection = signal<ServerConnection>(empty);
  readonly client = new FakeClient();
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function button(root: HTMLElement, text: string): HTMLButtonElement {
  const found = [...root.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
  if (!found) throw new Error(`No button "${text}"`);
  return found;
}

async function setup(connection: ServerConnection = empty) {
  const rendered = await render(Host);
  rendered.host.connection.set(connection);
  await rendered.fixture.whenStable();
  return rendered;
}

describe('ServerConnectionCard', () => {
  it('UC-5/S1 sends a pasted connection string and says it is connected', async () => {
    const { fixture, host, root } = await setup();
    const paste = query(root, 'input[name=connectionString]', HTMLInputElement);
    expect(paste.type).toBe('password');
    type(paste, 'openversion+abc');
    await fixture.whenStable();
    button(root, 'Connect').click();
    await fixture.whenStable();

    expect(host.client.saved).toEqual([
      { kind: 'openversion', body: { connectionString: 'openversion+abc' } },
    ]);
    expect(root.querySelector('[role=status]')?.textContent).toContain('Connected');
    expect(root.querySelector('form')).toBeNull();
    expect(root.textContent).toContain('https://version.example.com');
    expect(root.textContent).not.toContain('openversion+abc');
  });

  it('UC-5/S1 sends the details entered instead, with the secret only when typed', async () => {
    const { fixture, host, root } = await setup();
    button(root, 'Enter details instead').click();
    await fixture.whenStable();
    type(query(root, 'input[name=url]', HTMLInputElement), ' https://version.example.com ');
    type(query(root, 'input[name=publicKey]', HTMLInputElement), 'ov_pub_1');
    type(query(root, 'input[name=secret]', HTMLInputElement), 'ov_deploy_1');
    await fixture.whenStable();
    button(root, 'Connect').click();
    await fixture.whenStable();

    expect(host.client.saved[0].body).toEqual({
      url: 'https://version.example.com',
      publicKey: 'ov_pub_1',
      deployToken: 'ov_deploy_1',
    });
  });

  it('UC-5/S2 shows what failed with a copy button, and keeps the form open to fix it', async () => {
    const { fixture, host, root } = await setup();
    host.client.answer = {
      ...connected,
      status: 'problem',
      message: 'Add https://relay.example.com to allowed origins in OpenVersion.',
      copy: 'https://relay.example.com',
    };
    type(query(root, 'input[name=connectionString]', HTMLInputElement), 'openversion+abc');
    await fixture.whenStable();
    button(root, 'Connect').click();
    await fixture.whenStable();

    const alert = query(root, 'os-callout[role=alert]', HTMLElement);
    expect(alert.textContent).toContain('allowed origins');
    expect(alert.querySelector('os-copy-button')).not.toBeNull();
    expect(root.querySelector('form')).not.toBeNull();
  });

  it('UC-5/S2 shows a refused connection string in the server’s words', async () => {
    const { fixture, host, root } = await setup();
    host.client.failSave = new Error('That’s an OpenAnnounce connection string. Paste one from OpenVersion.');
    type(query(root, 'input[name=connectionString]', HTMLInputElement), 'openannounce+abc');
    await fixture.whenStable();
    button(root, 'Connect').click();
    await fixture.whenStable();

    expect(query(root, '[role=alert]', HTMLElement).textContent).toContain('OpenAnnounce connection string');
  });

  it('UC-5/S5 shows a connection set by the server as read only', async () => {
    const { root } = await setup({ ...connected, status: 'set-by-server', source: 'environment' });
    expect(root.textContent).toContain('Set by the server’s configuration');
    expect(root.querySelector('form')).toBeNull();
    const labels = [...root.querySelectorAll('button')].map((b) => b.textContent.trim());
    expect(labels).toEqual(['Test']);
  });

  it('UC-5/S6 never shows a saved secret, only that one is saved', async () => {
    const { fixture, root } = await setup(connected);
    expect(root.textContent).toContain('Saved');
    button(root, 'Change').click();
    await fixture.whenStable();
    button(root, 'Enter details instead').click();
    await fixture.whenStable();
    expect(query(root, 'input[name=secret]', HTMLInputElement).value).toBe('');
    expect(root.textContent).toContain('Leave it empty to keep the saved one.');
  });

  it('UC-5/S7 removes the connection after asking', async () => {
    const { fixture, host, root } = await setup(connected);
    const confirm = vi.spyOn(TestBed.inject(ConfirmDialog), 'confirm').mockResolvedValue(true);
    button(root, 'Remove').click();
    await fixture.whenStable();

    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ danger: true }));
    expect(host.client.removed).toEqual(['openversion']);
    expect(root.textContent).toContain('Not connected');
    expect(root.querySelector('input[name=connectionString]')).not.toBeNull();
  });

  it('keeps the connection when removing is cancelled', async () => {
    const { fixture, host, root } = await setup(connected);
    vi.spyOn(TestBed.inject(ConfirmDialog), 'confirm').mockResolvedValue(false);
    button(root, 'Remove').click();
    await fixture.whenStable();
    expect(host.client.removed).toEqual([]);
  });

  it('labels the OpenAnnounce secret as a signing secret', async () => {
    const { fixture, host, root } = await setup({ ...empty, kind: 'openannounce', name: 'OpenAnnounce' });
    button(root, 'Enter details instead').click();
    await fixture.whenStable();
    type(query(root, 'input[name=url]', HTMLInputElement), 'https://announce.example.com');
    type(query(root, 'input[name=publicKey]', HTMLInputElement), 'oa_pub');
    type(query(root, 'input[name=secret]', HTMLInputElement), 'oa_sign');
    await fixture.whenStable();
    expect(root.textContent).toContain('Signing secret');
    button(root, 'Connect').click();
    await fixture.whenStable();
    expect(host.client.saved[0].body).toEqual({
      url: 'https://announce.example.com',
      publicKey: 'oa_pub',
      signingSecret: 'oa_sign',
    });
  });
});

import Fastify, { type FastifyInstance } from 'fastify';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ConnectionError,
  type ConnectionDetails,
  type IntegrationOffer,
  openAnnounce,
  openVersion,
  type Queryable,
  registerIntegrationRoutes,
  resolveConnection,
} from './integrations.js';
import { makeConnectionString, parseConnectionString } from './connection-string.js';
import { vaultFor } from './vault.js';

// Private mode lets the checks reach a local test server. Real apps keep the default, public.
const privateFetch = { mode: 'private' as const, allow: [], envPrefix: 'OPENTEST' };
const context = { policy: privateFetch, origin: 'https://announce.example.com', userAgent: 'OpenTest' };

/** Resolves to the error a check rejects with, and fails the test if it does not reject. */
const failureOf = async (attempt: Promise<unknown>): Promise<ConnectionError> => {
  try {
    await attempt;
  } catch (error) {
    return error as ConnectionError;
  }
  throw new Error('Expected the check to fail.');
};

let server: Server;
let base: string;

beforeAll(async () => {
  server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://x');
    const key = url.searchParams.get('key');
    const headerKey = request.headers['x-openannounce-key'];
    const origin = request.headers.origin;
    response.setHeader('content-type', 'application/json');
    if (url.pathname === '/api/v1/version') {
      if (origin === 'https://blocked.example.com') {
        response.statusCode = 403;
        response.end('{"error":"origin not allowed"}');
        return;
      }
      if (key !== 'pk_good_key_1234') {
        response.statusCode = 401;
        response.end('{"error":"unknown key"}');
        return;
      }
      response.end('{"version":"1.0.0"}');
      return;
    }
    if (url.pathname === '/api/v1/releases/live') {
      response.statusCode = request.headers.authorization === 'Bearer ov_deploy_good_1234' ? 200 : 401;
      response.end(response.statusCode === 200 ? 'null' : '{"error":"unknown token"}');
      return;
    }
    if (url.pathname === '/api/v1/feed') {
      if (headerKey !== 'pk_feed_key_1234') {
        response.statusCode = 401;
        response.end('{"error":"unknown key"}');
        return;
      }
      response.end('[]');
      return;
    }
    response.statusCode = 404;
    response.end('{"error":"not found"}');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => {
      resolve();
    });
  });
});

describe('openVersion check', () => {
  it('says connected for a known public key', async () => {
    await expect(openVersion.check({ url: base, publicKey: 'pk_good_key_1234' }, context)).resolves.toBe(
      'Connected to OpenVersion.',
    );
  });

  it('says what to change when the origin is not allowed', async () => {
    const blocked = { ...context, origin: 'https://blocked.example.com' };
    await expect(openVersion.check({ url: base, publicKey: 'pk_good_key_1234' }, blocked)).rejects.toThrow(
      'Add https://blocked.example.com to allowed origins in OpenVersion',
    );
  });

  it('refuses an unknown key without retrying', async () => {
    const error = await failureOf(openVersion.check({ url: base, publicKey: 'pk_bad_key_12345' }, context));
    expect(error).toBeInstanceOf(ConnectionError);
    expect(error.retry).toBe(false);
  });

  it('says the address did not answer, and that retrying may help', async () => {
    const error = await failureOf(openVersion
      .check({ url: 'http://127.0.0.1:1', publicKey: 'pk_good_key_1234' }, context),
    );
    expect(error.message).toContain('didn’t answer');
    expect(error.retry).toBe(true);
  });

  it('refuses an internal address when fetching is public', async () => {
    const publicContext = { ...context, policy: { ...privateFetch, mode: 'public' as const } };
    const error = await failureOf(openVersion
      .check({ url: base, publicKey: 'pk_good_key_1234' }, publicContext),
    );
    expect(error).toBeInstanceOf(ConnectionError);
    expect(error.message).toContain('OPENTEST_FETCH');
  });
});

describe('openVersion check with a deploy token', () => {
  it('checks the deploy token after the public key', async () => {
    await expect(
      openVersion.check({ url: base, publicKey: 'pk_good_key_1234', deployToken: 'ov_deploy_good_1234' }, context),
    ).resolves.toBe('Connected to OpenVersion. The deploy token works, so this server can publish its version.');
  });

  it('says so when OpenVersion doesn’t recognise the deploy token', async () => {
    const error = await failureOf(
      openVersion.check({ url: base, publicKey: 'pk_good_key_1234', deployToken: 'ov_deploy_bad_1234' }, context),
    );
    expect(error.message).toContain('doesn’t recognise this deploy token');
    expect(error.retry).toBe(false);
  });
});

describe('openAnnounce check', () => {
  it('says connected for a known public key', async () => {
    await expect(openAnnounce.check({ url: base, publicKey: 'pk_feed_key_1234' }, context)).resolves.toBe(
      'Connected to OpenAnnounce.',
    );
  });

  it('refuses an unknown key', async () => {
    await expect(openAnnounce.check({ url: base, publicKey: 'pk_nope_key_12345' }, context)).rejects.toThrow(
      'doesn’t recognise this public key',
    );
  });
});

/** An in-memory stand-in for server_integrations, answering the statements the routes send. */
type Insert = [string, string, string, string | null, boolean, string, string | null];

/** Parses a response body as JSON, typed as unknown so each check narrows it. */
const json = (response: { body: string }): unknown => JSON.parse(response.body);

function fakeTable(): Queryable & { rows: Map<string, Record<string, unknown>> } {
  const rows = new Map<string, Record<string, unknown>>();
  const statement = (text: string, values: unknown[]): { rows: unknown[] } => {
    if (text.startsWith('SELECT')) {
      const row = rows.get(values[0] as string);
      return { rows: row ? [row] : [] };
    }
    if (text.startsWith('INSERT')) {
      const [kind, url, publicKey, sealed, ok, message, sealedToken] = values as Insert;
      const previous = rows.get(kind);
      const secret = sealed ?? previous?.signing_secret_encrypted ?? null;
      const token = sealedToken ?? previous?.deploy_token_encrypted ?? null;
      rows.set(kind, {
        url,
        public_key: publicKey,
        signing_secret_encrypted: secret,
        has_secret: secret !== null,
        deploy_token_encrypted: token,
        has_deploy_token: token !== null,
        last_test_ok: ok,
        last_test_message: message,
        last_tested_at: new Date(),
      });
      return { rows: [] };
    }
    if (text.startsWith('UPDATE')) {
      const [ok, message, kind] = values as [boolean, string, string];
      const row = rows.get(kind);
      if (row) {
        Object.assign(row, {
          last_test_ok: ok,
          last_test_message: message,
          last_tested_at: new Date(),
        });
      }
      return { rows: [] };
    }
    if (text.startsWith('DELETE')) {
      rows.delete(values[0] as string);
      return { rows: [] };
    }
    throw new Error(`unexpected statement: ${text}`);
  };
  return {
    rows,
    query: (text, values) => Promise.resolve(statement(text, values)),
  };
}

describe('integration routes', () => {
  const vault = vaultFor('test-secret-key');
  const adminHeader = 'x-admin';
  let app: FastifyInstance;
  let table: ReturnType<typeof fakeTable>;
  let environment: ConnectionDetails | null;
  let offers: IntegrationOffer[];
  let origin = 'https://announce.example.com';

  const build = async () => {
    table = fakeTable();
    app = Fastify();
    offers = [
      { kind: openVersion, signingSecret: false, deployToken: true, environment, envPrefix: 'OPENTEST_OPENVERSION' },
      { kind: openAnnounce, signingSecret: true, environment: null, envPrefix: 'OPENTEST_OPENANNOUNCE' },
    ];
    registerIntegrationRoutes(app, {
      db: table,
      vault: () => Promise.resolve(vault),
      policy: privateFetch,
      origin,
      appName: 'OpenTest',
      offers,
      isServerAdmin: (request) => request.headers[adminHeader] === 'yes',
    });
    await app.ready();
  };

  const admin = { [adminHeader]: 'yes' };

  it('refuses everyone who is not a server admin', async () => {
    environment = null;
    await build();
    const response = await app.inject({ method: 'GET', url: '/api/admin/integrations' });
    expect(response.statusCode).toBe(403);
    expect(json(response)).toEqual({ error: 'Only a server admin can manage server connections.' });
    await app.close();
  });

  it('shows both connections as not connected before anything is saved', async () => {
    environment = null;
    await build();
    const response = await app.inject({ method: 'GET', url: '/api/admin/integrations', headers: admin });
    expect(json(response)).toEqual([
      expect.objectContaining({ kind: 'openversion', status: 'not-connected' }),
      expect.objectContaining({ kind: 'openannounce', status: 'not-connected' }),
    ]);
    await app.close();
  });

  it('saves a tested connection and shows it as connected', async () => {
    environment = null;
    await build();
    const response = await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openversion',
      headers: admin,
      payload: { url: base, publicKey: 'pk_good_key_1234' },
    });
    expect(response.statusCode).toBe(200);
    expect(json(response)).toEqual(
      expect.objectContaining({ kind: 'openversion', status: 'connected', source: 'database', message: 'Connected to OpenVersion.' }),
    );
    await app.close();
  });

  it('UC-5/S1 saves a pasted connection string, with its deploy token', async () => {
    environment = null;
    await build();
    const connectionString = makeConnectionString('openversion', {
      url: base,
      publicKey: 'pk_good_key_1234',
      deployToken: 'ov_deploy_good_1234',
    });
    const response = await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openversion',
      headers: admin,
      payload: { connectionString },
    });
    expect(response.statusCode).toBe(200);
    expect(json(response)).toEqual(
      expect.objectContaining({ status: 'connected', hasDeployToken: true, secret: 'deploy-token', copy: null }),
    );
    expect(response.body).not.toContain('ov_deploy_good_1234');
    await app.close();
  });

  it('UC-5/S2 refuses a connection string from another product, naming both', async () => {
    environment = null;
    await build();
    const connectionString = makeConnectionString('openannounce', { url: base, publicKey: 'pk_feed_key_1234' });
    for (const method of ['PUT', 'POST'] as const) {
      const response = await app.inject({
        method,
        url: `/api/admin/integrations/openversion${method === 'POST' ? '/test' : ''}`,
        headers: admin,
        payload: { connectionString },
      });
      expect(response.statusCode).toBe(400);
      expect(json(response)).toEqual({
        error: 'That’s a connection string from OpenAnnounce. Paste one from OpenVersion.',
      });
    }
    expect(table.rows.size).toBe(0);
    await app.close();
  });

  it('UC-5/S2 refuses text that isn’t a connection string', async () => {
    environment = null;
    await build();
    for (const connectionString of ['hello', 'openversion+not-json', 42]) {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/admin/integrations/openversion',
        headers: admin,
        payload: { connectionString },
      });
      expect(response.statusCode).toBe(400);
    }
    await app.close();
  });

  it('UC-5/S2 gives this server’s address to copy when the origin isn’t allowed', async () => {
    environment = null;
    origin = 'https://blocked.example.com';
    try {
      await build();
      const response = await app.inject({
        method: 'PUT',
        url: '/api/admin/integrations/openversion',
        headers: admin,
        payload: { url: base, publicKey: 'pk_good_key_1234' },
      });
      expect(json(response)).toEqual(
        expect.objectContaining({ status: 'problem', copy: 'https://blocked.example.com' }),
      );
      const tested = await app.inject({
        method: 'POST',
        url: '/api/admin/integrations/openversion/test',
        headers: admin,
      });
      expect(json(tested)).toEqual(expect.objectContaining({ ok: false, copy: 'https://blocked.example.com' }));
      await app.close();
    } finally {
      origin = 'https://announce.example.com';
    }
  });

  it('says which secret each connection takes', async () => {
    environment = null;
    await build();
    const response = await app.inject({ method: 'GET', url: '/api/admin/integrations', headers: admin });
    expect(json(response)).toEqual([
      expect.objectContaining({ kind: 'openversion', secret: 'deploy-token' }),
      expect.objectContaining({ kind: 'openannounce', secret: 'signing-secret' }),
    ]);
    await app.close();
  });

  it('saves a connection that fails its test, so the admin can fix it, and shows the problem', async () => {
    environment = null;
    await build();
    const response = await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openversion',
      headers: admin,
      payload: { url: base, publicKey: 'pk_bad_key_12345' },
    });
    expect(json(response)).toEqual(expect.objectContaining({ status: 'problem' }));
    expect(table.rows.get('openversion')?.url).toBe(base);
    await app.close();
  });

  it('never returns a signing secret, but says one is stored', async () => {
    environment = null;
    await build();
    const response = await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openannounce',
      headers: admin,
      payload: { url: base, publicKey: 'pk_feed_key_1234', signingSecret: 'signing-secret-value' },
    });
    expect(json(response)).toEqual(expect.objectContaining({ hasSigningSecret: true, status: 'connected' }));
    expect(response.body).not.toContain('signing-secret-value');
    const stored = table.rows.get('openannounce')?.signing_secret_encrypted as string;
    expect(stored).not.toContain('signing-secret-value');
    expect(vault.open(stored)).toBe('signing-secret-value');
    await app.close();
  });

  it('keeps the stored signing secret when a later save leaves it out', async () => {
    environment = null;
    await build();
    await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openannounce',
      headers: admin,
      payload: { url: base, publicKey: 'pk_feed_key_1234', signingSecret: 'signing-secret-value' },
    });
    await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openannounce',
      headers: admin,
      payload: { url: base, publicKey: 'pk_feed_key_1234' },
    });
    const stored = table.rows.get('openannounce')?.signing_secret_encrypted as string;
    expect(vault.open(stored)).toBe('signing-secret-value');
    await app.close();
  });

  it('never returns a deploy token, keeps it when a later save leaves it out, and tests with it', async () => {
    environment = null;
    await build();
    const first = await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openversion',
      headers: admin,
      payload: { url: base, publicKey: 'pk_good_key_1234', deployToken: 'ov_deploy_good_1234' },
    });
    expect(json(first)).toEqual(expect.objectContaining({ hasDeployToken: true, hasSigningSecret: false, status: 'connected' }));
    expect(first.body).not.toContain('ov_deploy_good_1234');
    const stored = table.rows.get('openversion')?.deploy_token_encrypted as string;
    expect(stored).not.toContain('ov_deploy_good_1234');
    expect(vault.open(stored)).toBe('ov_deploy_good_1234');
    expect(table.rows.get('openversion')?.signing_secret_encrypted).toBeNull();

    const again = await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openversion',
      headers: admin,
      payload: { url: base, publicKey: 'pk_good_key_1234' },
    });
    const againCard = json(again) as { hasDeployToken: boolean; message: string };
    expect(againCard.hasDeployToken).toBe(true);
    expect(againCard.message).toContain('deploy token works');
    const test = await app.inject({ method: 'POST', url: '/api/admin/integrations/openversion/test', headers: admin });
    const tested = json(test) as { ok: boolean; message: string };
    expect(tested.ok).toBe(true);
    expect(tested.message).toContain('deploy token works');
    await app.close();
  });

  it('never sends a saved deploy token to a changed address', async () => {
    environment = null;
    await build();
    await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openversion',
      headers: admin,
      payload: { url: base, publicKey: 'pk_good_key_1234', deployToken: 'ov_deploy_good_1234' },
    });
    const moved = await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openversion',
      headers: admin,
      payload: { url: base.replace('127.0.0.1', 'localhost'), publicKey: 'pk_good_key_1234' },
    });
    const card = json(moved) as { message: string; hasDeployToken: boolean };
    expect(card.message).toBe('Connected to OpenVersion.');
    // The token stays saved, for a later save that sends a new one or moves back.
    expect(card.hasDeployToken).toBe(true);
    await app.close();
  });

  it('asks for a saved secret again when the current key can’t open it', async () => {
    environment = null;
    await build();
    table.rows.set('openversion', {
      url: base,
      public_key: 'pk_good_key_1234',
      signing_secret_encrypted: null,
      has_secret: false,
      deploy_token_encrypted: vaultFor('another-key').seal('ov_deploy_good_1234'),
      has_deploy_token: true,
      last_test_ok: true,
      last_test_message: null,
      last_tested_at: new Date(),
    });
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/integrations/openversion/test',
      headers: admin,
    });
    expect(response.statusCode).toBe(400);
    expect(json(response)).toEqual({
      error: 'A saved secret can’t be read with the current secret key. Enter it again.',
    });
    await app.close();
  });

  it('tests sent values with the deploy token sent, and reports a bad one', async () => {
    environment = null;
    await build();
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/integrations/openversion/test',
      headers: admin,
      payload: { url: base, publicKey: 'pk_good_key_1234', deployToken: 'ov_deploy_bad_1234' },
    });
    const answer = json(response) as { ok: boolean; message: string };
    expect(answer.ok).toBe(false);
    expect(answer.message).toContain('deploy token');
    await app.close();
  });

  it('refuses a deploy token for a connection that takes none', async () => {
    environment = null;
    await build();
    const response = await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openannounce',
      headers: admin,
      payload: { url: base, publicKey: 'pk_feed_key_1234', deployToken: 'ov_deploy_good_1234' },
    });
    expect(response.statusCode).toBe(400);
    expect(json(response)).toEqual({ error: 'OpenAnnounce doesn’t take a deploy token.' });
    await app.close();
  });

  it('refuses a signing secret for a connection that takes none', async () => {
    environment = null;
    await build();
    const response = await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openversion',
      headers: admin,
      payload: { url: base, publicKey: 'pk_good_key_1234', signingSecret: 'signing-secret-value' },
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it('refuses an address with a user name in it', async () => {
    environment = null;
    await build();
    const response = await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openversion',
      headers: admin,
      payload: { url: 'https://user:pw@openversion.example.com', publicKey: 'pk_good_key_1234' },
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it('tests the saved connection and records the result', async () => {
    environment = null;
    await build();
    await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openversion',
      headers: admin,
      payload: { url: base, publicKey: 'pk_good_key_1234' },
    });
    await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openversion',
      headers: admin,
      payload: { url: base, publicKey: 'pk_bad_key_12345' },
    });
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/integrations/openversion/test',
      headers: admin,
    });
    const result = json(response) as { ok: boolean; message: string };
    expect(result.ok).toBe(false);
    expect(result.message).toContain('doesn’t recognise');
    await app.close();
  });

  it('tests values sent without saving them', async () => {
    environment = null;
    await build();
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/integrations/openversion/test',
      headers: admin,
      payload: { url: base, publicKey: 'pk_good_key_1234' },
    });
    expect(json(response)).toEqual({ ok: true, message: 'Connected to OpenVersion.', copy: null });
    expect(table.rows.has('openversion')).toBe(false);
    await app.close();
  });

  it('answers 400 when testing with nothing to test', async () => {
    environment = null;
    await build();
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/integrations/openversion/test',
      headers: admin,
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it('lets an environment value win: the card is read-only and saving answers 409', async () => {
    environment = { url: base, publicKey: 'pk_good_key_1234' };
    await build();
    const list = await app.inject({ method: 'GET', url: '/api/admin/integrations', headers: admin });
    expect((json(list) as unknown[])[0]).toEqual(expect.objectContaining({ status: 'set-by-server', source: 'environment' }));
    const save = await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openversion',
      headers: admin,
      payload: { url: base, publicKey: 'pk_good_key_1234' },
    });
    expect(save.statusCode).toBe(409);
    expect((json(save) as { error: string }).error).toContain('OPENTEST_OPENVERSION_URL');
    const remove = await app.inject({ method: 'DELETE', url: '/api/admin/integrations/openversion', headers: admin });
    expect(remove.statusCode).toBe(409);
    await app.close();
  });

  it('disconnects a saved connection', async () => {
    environment = null;
    await build();
    await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openversion',
      headers: admin,
      payload: { url: base, publicKey: 'pk_good_key_1234' },
    });
    const response = await app.inject({ method: 'DELETE', url: '/api/admin/integrations/openversion', headers: admin });
    expect(json(response)).toEqual({ ok: true });
    expect(table.rows.has('openversion')).toBe(false);
    await app.close();
  });

  it('answers 404 for a connection this app does not offer', async () => {
    environment = null;
    await build();
    const response = await app.inject({ method: 'PUT', url: '/api/admin/integrations/unknown', headers: admin, payload: {} });
    expect(response.statusCode).toBe(404);
    await app.close();
  });

  it('serves public values only from client-config, and nothing when unset', async () => {
    environment = null;
    await build();
    await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openannounce',
      headers: admin,
      payload: { url: base, publicKey: 'pk_feed_key_1234', signingSecret: 'signing-secret-value' },
    });
    const response = await app.inject({ method: 'GET', url: '/api/client-config' });
    expect(json(response)).toEqual({
      openversion: null,
      openannounce: { url: base, publicKey: 'pk_feed_key_1234' },
    });
    expect(response.body).not.toContain('signing-secret-value');
    await app.close();
  });

  it('resolves the saved connection with its secret opened, and the environment first', async () => {
    environment = null;
    await build();
    await app.inject({
      method: 'PUT',
      url: '/api/admin/integrations/openannounce',
      headers: admin,
      payload: { url: base, publicKey: 'pk_feed_key_1234', signingSecret: 'signing-secret-value' },
    });
    const connection = resolveConnection(table, () => Promise.resolve(vault), offers[1]);
    await expect(connection).resolves.toEqual({
      url: base,
      publicKey: 'pk_feed_key_1234',
      signingSecret: 'signing-secret-value',
    });
    await app.close();
  });
});

describe('connection strings', () => {
  it('round-trips the details, with only the secret given', () => {
    const text = makeConnectionString('openannounce', {
      url: 'https://announce.example.com',
      publicKey: 'oa_pub_123456',
      signingSecret: 'oa_sign_123456',
    });
    expect(text.startsWith('openannounce+')).toBe(true);
    expect(parseConnectionString(` ${text} `, 'openannounce')).toEqual({
      url: 'https://announce.example.com',
      publicKey: 'oa_pub_123456',
      signingSecret: 'oa_sign_123456',
    });
  });

  it('leaves the secret out when there is none, for a string that shows messages for everyone', () => {
    const text = makeConnectionString('openannounce', { url: 'https://a.example.com', publicKey: 'oa_pub_123456' });
    expect(parseConnectionString(text, 'openannounce')).toEqual({
      url: 'https://a.example.com',
      publicKey: 'oa_pub_123456',
    });
  });

  it('refuses an unknown prefix without naming it', () => {
    expect(() => parseConnectionString('acme+e30', 'openversion')).toThrow(
      'That isn’t a connection string from OpenVersion. Copy it again, or enter the details instead.',
    );
  });
});

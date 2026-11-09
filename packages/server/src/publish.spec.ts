import Fastify from 'fastify';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type IntegrationOffer, openVersion, type Queryable } from './integrations.js';
import { publishOwnVersion, publishVersionOnStart } from './publish.js';
import { vaultFor } from './vault.js';

// Private mode lets the publish reach a local stand-in OpenVersion. Real apps keep the default.
const policy = { mode: 'private' as const, allow: [], envPrefix: 'OPENTEST' };
const log = { info: () => undefined, warn: () => undefined };
const GOOD = 'ov_deploy_good_1234';

interface Seen {
  method?: string;
  path?: string;
  auth?: string;
  idempotency?: string;
  body: string;
}
let seen: Seen[] = [];
let answer = 201;
let server: Server;
let base: string;

beforeAll(async () => {
  server = createServer((request, response) => {
    let body = '';
    request.on('data', (chunk: Buffer) => (body += chunk.toString()));
    request.on('end', () => {
      seen.push({
        method: request.method,
        path: request.url,
        auth: request.headers.authorization,
        idempotency: request.headers['idempotency-key'] as string | undefined,
        body,
      });
      response.setHeader('content-type', 'application/json');
      response.statusCode = request.headers.authorization === `Bearer ${GOOD}` ? answer : 401;
      response.end('{}');
    });
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

beforeEach(() => {
  seen = [];
  answer = 201;
});

const options = { policy, appName: 'OpenTest', log };

describe('publishOwnVersion', () => {
  it('publishes the version with the deploy token, keyed by app and version', async () => {
    expect(await publishOwnVersion({ url: base, deployToken: GOOD }, '1.4.0', options)).toBe('published');
    expect(seen[0]).toMatchObject({
      method: 'POST',
      path: '/api/v1/releases',
      auth: `Bearer ${GOOD}`,
      idempotency: 'opentest-1.4.0',
    });
    expect(JSON.parse(seen[0]?.body ?? '{}')).toEqual({ version: '1.4.0', notes: '' });
  });

  it('leaves the live version alone when OpenVersion has it or a newer one', async () => {
    answer = 409;
    expect(await publishOwnVersion({ url: base, deployToken: GOOD }, '1.3.0', options)).toBe('not-newer');
  });

  it('reports a refused token, and an OpenVersion that doesn’t answer, without throwing', async () => {
    expect(await publishOwnVersion({ url: base, deployToken: 'ov_bad' }, '1.4.0', options)).toBe('refused');
    expect(await publishOwnVersion({ url: 'http://127.0.0.1:1', deployToken: GOOD }, '1.4.0', options)).toBe(
      'failed',
    );
  });

  it('skips a build that doesn’t know its version, and sends nothing', async () => {
    expect(await publishOwnVersion({ url: base, deployToken: GOOD }, 'unknown', options)).toBe('skipped');
    expect(seen).toEqual([]);
  });
});

describe('publishVersionOnStart', () => {
  const vault = vaultFor('test-secret-key');
  const tableWith = (row: Record<string, unknown> | undefined): Queryable => ({
    query: () => Promise.resolve({ rows: row ? [row] : [] }),
  });
  const offer = (environment: IntegrationOffer['environment']): IntegrationOffer => ({
    kind: openVersion,
    signingSecret: false,
    deployToken: true,
    environment,
    envPrefix: 'OPENTEST_OPENVERSION',
  });

  /** Starts a server with the hook and waits until the publish (if any) has been seen. */
  const start = async (db: Queryable, environment: IntegrationOffer['environment']) => {
    const app = Fastify();
    publishVersionOnStart(app, {
      db,
      vault: () => Promise.resolve(vault),
      offer: offer(environment),
      policy,
      appName: 'OpenTest',
      version: '2.0.0',
    });
    await app.listen({ port: 0, host: '127.0.0.1' });
    for (let i = 0; i < 50 && seen.length === 0; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    await app.close();
  };

  it('publishes with the saved deploy token once listening', async () => {
    await start(tableWith({ url: base, public_key: 'pk_good_key_1234', deploy_token_encrypted: vault.seal(GOOD) }), null);
    expect(seen[0]).toMatchObject({ path: '/api/v1/releases', auth: `Bearer ${GOOD}`, idempotency: 'opentest-2.0.0' });
  });

  it('uses the environment’s deploy token first', async () => {
    await start(tableWith(undefined), { url: base, publicKey: 'pk_good_key_1234', deployToken: GOOD });
    expect(seen[0]).toMatchObject({ auth: `Bearer ${GOOD}` });
  });

  it('sends nothing without a deploy token, and starts anyway when the token can’t be opened', async () => {
    await start(tableWith({ url: base, public_key: 'pk_good_key_1234', deploy_token_encrypted: null }), null);
    await start(tableWith({ url: base, public_key: 'pk_good_key_1234', deploy_token_encrypted: 'not-sealed' }), null);
    expect(seen).toEqual([]);
  });
});

import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { type IntegrationOffer, type Queryable, resolveConnection } from './integrations.js';
import { type FetchPolicy, safeFetch } from './safe-fetch.js';
import type { Vault } from './vault.js';

export type PublishOutcome = 'skipped' | 'published' | 'not-newer' | 'refused' | 'failed';

export interface PublishOptions {
  policy: FetchPolicy;
  /** The app's name. Its lowercase form starts the idempotency key, such as `openrelay-1.4.0`. */
  appName: string;
  log: Pick<FastifyBaseLogger, 'info' | 'warn'>;
}

/**
 * Publishes this image's version to OpenVersion, so open tabs learn about it with no CI step. The
 * version is in the idempotency key, so replicas starting together publish once. OpenVersion
 * refuses a version that isn't higher than the live one: that answer is fine and leaves what's
 * live alone, so starting an older image never rolls anything back. Never throws.
 */
export async function publishOwnVersion(
  connection: { url: string; deployToken: string },
  version: string,
  options: PublishOptions,
): Promise<PublishOutcome> {
  const { log } = options;
  // A local build has no release version, and OpenVersion would refuse it anyway.
  if (!version || version === 'unknown') return 'skipped';
  try {
    const response = await safeFetch(`${connection.url.replace(/\/$/, '')}/api/v1/releases`, options.policy, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${connection.deployToken}`,
        'content-type': 'application/json',
        'idempotency-key': `${options.appName.toLowerCase()}-${version}`,
        'user-agent': options.appName,
      },
      body: JSON.stringify({ version, notes: '' }),
      timeout: 10_000,
    });
    if (response.status === 201) {
      log.info({ version }, 'Published this version to OpenVersion.');
      return 'published';
    }
    if (response.status === 409) {
      log.info({ version }, 'OpenVersion already has this version or a newer one live.');
      return 'not-newer';
    }
    if (response.status === 401 || response.status === 403) {
      log.warn('OpenVersion refused the deploy token, so this version was not published.');
      return 'refused';
    }
    log.warn({ status: response.status }, 'OpenVersion did not accept this version.');
    return 'failed';
  } catch (error) {
    log.warn({ err: (error as Error).message }, 'Could not reach OpenVersion to publish.');
    return 'failed';
  }
}

export interface PublishOnStartOptions {
  db: Queryable;
  vault: () => Promise<Vault>;
  /** The app's OpenVersion offer, the same one given to `registerIntegrationRoutes`. */
  offer: IntegrationOffer;
  policy: FetchPolicy;
  appName: string;
  /** The release this image was built from, or `unknown` for a local build. */
  version: string;
}

/**
 * Once the server listens, publishes its version with the connection's deploy token: the
 * environment's, else the saved one. Not awaited, so startup never waits for OpenVersion, and every
 * failure (none connected, no token, a token that can't be opened) only logs.
 */
export function publishVersionOnStart(app: FastifyInstance, options: PublishOnStartOptions): void {
  app.addHook('onListen', () => {
    const publish = async () => {
      const connection = await resolveConnection(options.db, options.vault, options.offer);
      if (!connection?.deployToken) return;
      const { url, deployToken } = connection;
      await publishOwnVersion({ url, deployToken }, options.version, {
        policy: options.policy,
        appName: options.appName,
        log: app.log,
      });
    };
    publish().catch((error: unknown) => {
      app.log.warn({ err: (error as Error).message }, 'Skipped publishing this version.');
    });
  });
}

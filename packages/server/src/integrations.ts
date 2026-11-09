import { signUser } from '@openstuff-dev/announce/server';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { type FetchPolicy, FetchRefused, safeFetch, type SafeResponse } from './safe-fetch.js';
import type { Vault } from './vault.js';
import { ConnectionStringError, parseConnectionString } from './connection-string.js';

/**
 * The table every app keeps server-wide connections in. It sits outside tenant row-level security:
 * only the server-admin routes read or write it. Apps run this in their own migration.
 */
export const serverIntegrationsSql = `
CREATE TABLE server_integrations (
  kind                      text PRIMARY KEY,
  url                       text NOT NULL,
  public_key                text NOT NULL,
  signing_secret_encrypted  text,
  deploy_token_encrypted    text,
  last_test_ok              boolean,
  last_test_message         text,
  last_tested_at            timestamptz,
  updated_at                timestamptz NOT NULL DEFAULT now()
);`;

/**
 * Adds the deploy token column to a table made with 0.2.0's `serverIntegrationsSql`. Safe to run on
 * a table that has it already.
 */
export const serverIntegrationsDeployTokenSql =
  'ALTER TABLE server_integrations ADD COLUMN IF NOT EXISTS deploy_token_encrypted text;';

/** The part of a database pool the routes need. A `pg` Pool satisfies it. */
export interface Queryable {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
}

/** What a connection is made of. The secrets are optional and never returned by a route. */
export interface ConnectionDetails {
  url: string;
  publicKey: string;
  /** OpenAnnounce: signs each person's token, so messages can be aimed at a group. */
  signingSecret?: string;
  /** OpenVersion: lets this server publish its own version on start. */
  deployToken?: string;
}

/** A failed check, with a message to show as is. `retry` says whether trying again may help. */
export class ConnectionError extends Error {
  constructor(
    message: string,
    readonly retry: boolean,
  ) {
    super(message);
  }
}

/** A request the caller got wrong or can't make now, answered with `statusCode`. */
export class IntegrationError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export interface CheckContext {
  policy: FetchPolicy;
  /** This server's own origin. The other system must allow it. */
  origin: string;
  /** Sent as the User-Agent, so the other system's logs name the caller. */
  userAgent: string;
}

/** A kind of system a server can connect to. */
export interface IntegrationKind {
  readonly kind: string;
  readonly name: string;
  /** Checks the connection without changing anything on the other system. Throws on failure. */
  check(details: ConnectionDetails, context: CheckContext): Promise<string>;
}

/** A connection this app offers, with how the app's configuration sets it. */
export interface IntegrationOffer {
  kind: IntegrationKind;
  /** Whether the connection keeps a signing secret, encrypted at rest. */
  signingSecret: boolean;
  /** Whether the connection keeps a deploy token, encrypted at rest. OpenVersion only. */
  deployToken?: boolean;
  /** The configuration's values, when the environment sets them. They always win. */
  environment: ConnectionDetails | null;
  /** The variable prefix, such as `OPENUSECASE_OPENVERSION`, named in the messages. */
  envPrefix: string;
}

export interface IntegrationRoutesOptions {
  db: Queryable;
  /** Opens sealed secrets. Only called when one is stored or read. */
  vault: () => Promise<Vault>;
  policy: FetchPolicy;
  /** This server's origin, as the other system sees it. */
  origin: string;
  /** The app's name, for the User-Agent of checks. */
  appName: string;
  offers: IntegrationOffer[];
  /** Answers whether the signed-in person is a server admin. Anyone else gets 403. */
  isServerAdmin(request: FastifyRequest): boolean;
  /**
   * Who is signed in, for OpenAnnounce: an opaque member id (never an email or a name) and the
   * groups their messages may be aimed at, such as `t-acme`, `role-courier`, `t-acme-role-courier`.
   * Null when nobody is. Setting it adds `GET /api/openannounce-token`.
   */
  announceUser?(request: FastifyRequest): AnnounceUser | null | Promise<AnnounceUser | null>;
}

/** Who OpenAnnounce sees: see `IntegrationRoutesOptions.announceUser`. */
export interface AnnounceUser {
  sub: string;
  groups: string[];
}

/** The groups for one person in one tenant: the tenant, the role, and both together. */
export function announceGroups(tenant: string, role: string): string[] {
  return [`t-${tenant}`, `role-${role}`, `t-${tenant}-role-${role}`];
}

/** One connection as the Integrations tab shows it. Secrets are never included. */
export interface ServerIntegration {
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
  /** Which secret this connection takes, so the form can ask for it. */
  secret: 'deploy-token' | 'signing-secret' | null;
  /** A value the message asks the admin to copy, such as this server's address. */
  copy: string | null;
}

interface Row {
  url: string;
  public_key: string;
  has_secret: boolean;
  has_deploy_token: boolean;
  last_test_ok: boolean | null;
  last_test_message: string | null;
  last_tested_at: Date | null;
}

const serverSays = (response: SafeResponse): string => {
  try {
    const error = (JSON.parse(response.body) as { error?: unknown }).error;
    if (typeof error === 'string' && error) return error;
  } catch {
    // Not JSON: fall back to the status.
  }
  return `it answered ${response.status}`;
};

/** Sends a check request through the guarded fetch. Every failure becomes a ConnectionError. */
async function probe(
  name: string,
  url: string,
  context: CheckContext,
  headers: Record<string, string>,
): Promise<SafeResponse> {
  try {
    return await safeFetch(url, context.policy, {
      headers: { accept: 'application/json', 'user-agent': context.userAgent, ...headers },
    });
  } catch (err) {
    if (err instanceof FetchRefused) throw new ConnectionError(err.message, false);
    throw new ConnectionError(`That address didn’t answer. Check the URL and that ${name} is running.`, true);
  }
}

/** Checks a deploy token by reading the live release: only a token that may publish can. */
async function checkDeployToken(
  url: string,
  deployToken: string,
  context: CheckContext,
): Promise<string> {
  const response = await probe('OpenVersion', `${url.replace(/\/$/, '')}/api/v1/releases/live`, context, {
    authorization: `Bearer ${deployToken}`,
  });
  if (response.status === 200) return 'The deploy token works, so this server can publish its version.';
  if (response.status === 401 || response.status === 403) {
    throw new ConnectionError('OpenVersion doesn’t recognise this deploy token. Make a new one on the environment’s page.', false);
  }
  throw new ConnectionError(`OpenVersion said: ${serverSays(response)}`, response.status >= 500);
}

/** OpenVersion: checks a public key against its version API. Its 401 and 403 say what to change. */
export const openVersion: IntegrationKind = {
  kind: 'openversion',
  name: 'OpenVersion',
  async check(details, context) {
    const { url, publicKey } = details;
    const response = await probe(
      'OpenVersion',
      `${url.replace(/\/$/, '')}/api/v1/version?key=${encodeURIComponent(publicKey)}`,
      context,
      { origin: context.origin },
    );
    if (response.status === 200 || response.status === 304) {
      if (!details.deployToken) return 'Connected to OpenVersion.';
      return `Connected to OpenVersion. ${await checkDeployToken(details.url, details.deployToken, context)}`;
    }
    if (response.status === 401) {
      throw new ConnectionError(`OpenVersion doesn’t recognise this public key: ${serverSays(response)}`, false);
    }
    if (response.status === 403) {
      throw new ConnectionError(
        `Add ${context.origin} to allowed origins in OpenVersion, on the environment’s page, then test again.`,
        false,
      );
    }
    if (response.status === 404) {
      throw new ConnectionError(`${url} doesn’t look like an OpenVersion with the version API. Check the URL.`, false);
    }
    if (response.status === 429) {
      throw new ConnectionError('OpenVersion is checking too often. Try again in a minute.', true);
    }
    throw new ConnectionError(`OpenVersion said: ${serverSays(response)}`, response.status >= 500);
  },
};

/** OpenAnnounce: checks a public key and origin against its feed API, without posting anything. */
export const openAnnounce: IntegrationKind = {
  kind: 'openannounce',
  name: 'OpenAnnounce',
  async check({ url, publicKey }, context) {
    const response = await probe('OpenAnnounce', `${url.replace(/\/$/, '')}/api/v1/feed`, context, {
      'x-openannounce-key': publicKey,
      origin: context.origin,
    });
    if (response.status === 200) return 'Connected to OpenAnnounce.';
    if (response.status === 401) {
      throw new ConnectionError(`OpenAnnounce doesn’t recognise this public key: ${serverSays(response)}`, false);
    }
    if (response.status === 403) {
      throw new ConnectionError(
        `Add ${context.origin} to allowed origins in OpenAnnounce, on the system’s page, then test again.`,
        false,
      );
    }
    if (response.status === 404) {
      throw new ConnectionError(`${url} doesn’t look like an OpenAnnounce with the feed API. Check the URL.`, false);
    }
    throw new ConnectionError(`OpenAnnounce said: ${serverSays(response)}`, response.status >= 500);
  },
};

const httpUrl = (value: unknown): string => {
  if (typeof value !== 'string') throw new IntegrationError(400, 'Enter the address, such as https://openversion.example.com.');
  try {
    const url = new URL(value.trim());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password) {
      return url.href.replace(/\/$/, '');
    }
  } catch {
    // Falls through to the error below.
  }
  throw new IntegrationError(400, 'The address must start with https:// (or http://) and have no user name or password.');
};

const keyText = (value: unknown, label: string, max: number): string => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length < 8 || text.length > max) throw new IntegrationError(400, `Paste the whole ${label}.`);
  return text;
};

const optionalKey = (value: unknown, label: string, max: number): string | undefined =>
  value === undefined || value === null || value === '' ? undefined : keyText(value, label, max);

/** Opens a saved secret. One the current key can't open is the admin's to replace, not a crash. */
const openSaved = (vault: Vault | null, sealed: string | null | undefined): string | undefined => {
  if (!vault || !sealed) return undefined;
  try {
    return vault.open(sealed);
  } catch {
    throw new IntegrationError(
      400,
      'A saved secret can’t be read with the current secret key. Enter it again.',
    );
  }
};

const bodyOf = (request: FastifyRequest): Record<string, unknown> =>
  request.body && typeof request.body === 'object' ? (request.body as Record<string, unknown>) : {};

/**
 * The connection the app uses for a kind: the environment's values when set, otherwise the saved
 * one, with its signing secret opened. Returns null when nothing is connected.
 */
export async function resolveConnection(
  db: Queryable,
  vault: () => Promise<Vault>,
  offer: IntegrationOffer,
): Promise<ConnectionDetails | null> {
  if (offer.environment) return offer.environment;
  const row = await loadRow(db, offer.kind.kind);
  if (!row) return null;
  const details: ConnectionDetails = { url: row.url, publicKey: row.public_key };
  if (row.signing_secret_encrypted) {
    details.signingSecret = (await vault()).open(row.signing_secret_encrypted);
  }
  if (row.deploy_token_encrypted) {
    details.deployToken = (await vault()).open(row.deploy_token_encrypted);
  }
  return details;
}

type SavedRow = Row & {
  signing_secret_encrypted: string | null;
  deploy_token_encrypted: string | null;
};

async function loadRow(db: Queryable, kind: string) {
  const { rows } = await db.query(
    `SELECT url, public_key, signing_secret_encrypted, signing_secret_encrypted IS NOT NULL AS has_secret,
            deploy_token_encrypted, deploy_token_encrypted IS NOT NULL AS has_deploy_token,
            last_test_ok, last_test_message, last_tested_at
       FROM server_integrations WHERE kind = $1`,
    [kind],
  );
  return rows[0] as SavedRow | undefined;
}

/**
 * Server-wide connections, for server admins only. Each route answers `{ error }` when refused.
 * An environment value wins over the saved connection, which then shows read-only. Secrets are
 * encrypted at rest and never returned.
 */
export function registerIntegrationRoutes(
  app: FastifyInstance,
  options: IntegrationRoutesOptions,
): void {
  const { db, policy, origin, offers } = options;
  const context: CheckContext = { policy, origin, userAgent: options.appName };

  const offerFor = (kind: string): IntegrationOffer => {
    const offer = offers.find((item) => item.kind.kind === kind);
    if (!offer) throw new IntegrationError(404, `This server doesn’t offer the ${kind} connection.`);
    return offer;
  };

  const requireAdmin = (request: FastifyRequest) => {
    if (!options.isServerAdmin(request)) {
      throw new IntegrationError(403, 'Only a server admin can manage server connections.');
    }
  };

  const card = (offer: IntegrationOffer, row: Row | undefined): ServerIntegration => {
    const base = {
      kind: offer.kind.kind,
      name: offer.kind.name,
      secret: offer.deployToken
        ? ('deploy-token' as const)
        : offer.signingSecret
          ? ('signing-secret' as const)
          : null,
    };
    if (offer.environment) {
      return {
        ...base,
        url: offer.environment.url,
        publicKey: offer.environment.publicKey,
        hasSigningSecret: offer.environment.signingSecret !== undefined,
        hasDeployToken: offer.environment.deployToken !== undefined,
        status: 'set-by-server',
        source: 'environment',
        message: null,
        testedAt: null,
        copy: null,
      };
    }
    if (!row) {
      return {
        ...base,
        url: null,
        publicKey: null,
        hasSigningSecret: false,
        hasDeployToken: false,
        status: 'not-connected',
        source: null,
        message: null,
        testedAt: null,
        copy: null,
      };
    }
    return {
      ...base,
      url: row.url,
      publicKey: row.public_key,
      hasSigningSecret: row.has_secret,
      hasDeployToken: row.has_deploy_token,
      status: row.last_test_ok === false ? 'problem' : 'connected',
      source: 'database',
      message: row.last_test_message,
      testedAt: row.last_tested_at?.toISOString() ?? null,
      copy: copyFor(row.last_test_ok === false ? row.last_test_message : null),
    };
  };

  /** The fix for an origin the other system doesn't allow is to copy this server's address. */
  const copyFor = (message: string | null): string | null =>
    message?.includes(origin) ? origin : null;

  /** Runs a check and says what it found. A failed check is an answer, not an error. */
  const runCheck = async (offer: IntegrationOffer, details: ConnectionDetails) => {
    try {
      return { ok: true, message: await offer.kind.check(details, context), copy: null };
    } catch (err) {
      if (err instanceof ConnectionError) {
        return { ok: false, message: err.message, copy: copyFor(err.message) };
      }
      throw err;
    }
  };

  /** The details sent, from a pasted connection string when there is one. */
  const sentDetails = (kind: string, request: FastifyRequest): Record<string, unknown> => {
    const body = bodyOf(request);
    if (body.connectionString === undefined) return body;
    if (typeof body.connectionString !== 'string') {
      throw new IntegrationError(400, 'Paste the whole connection string.');
    }
    try {
      return { ...parseConnectionString(body.connectionString, kind) };
    } catch (err) {
      if (err instanceof ConnectionStringError) throw new IntegrationError(400, err.message);
      throw err;
    }
  };

  const handle =
    <T>(fn: (request: FastifyRequest, reply: FastifyReply) => Promise<T>) =>
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          return await fn(request, reply);
        } catch (err) {
          if (err instanceof IntegrationError) {
            return reply.code(err.statusCode).send({ error: err.message });
          }
          throw err;
        }
      };

  app.get(
    '/api/admin/integrations',
    handle(async (request) => {
      requireAdmin(request);
      const cards: ServerIntegration[] = [];
      for (const offer of offers) cards.push(card(offer, await loadRow(db, offer.kind.kind)));
      return cards;
    }),
  );

  /** Saves the connection, then tests it. The save happens either way, so a fix can follow. */
  app.put(
    '/api/admin/integrations/:kind',
    handle(async (request) => {
      requireAdmin(request);
      const { kind } = request.params as { kind: string };
      const offer = offerFor(kind);
      if (offer.environment) {
        throw new IntegrationError(
          409,
          `The server’s configuration sets this. Change ${offer.envPrefix}_URL to change it here.`,
        );
      }
      const body = sentDetails(kind, request);
      const details: ConnectionDetails = {
        url: httpUrl(body.url),
        publicKey: keyText(body.publicKey, 'public key', 200),
      };
      const secret = optionalKey(body.signingSecret, 'signing secret', 500);
      if (secret && !offer.signingSecret) {
        throw new IntegrationError(400, `${offer.kind.name} doesn’t take a signing secret.`);
      }
      const token = optionalKey(body.deployToken, 'deploy token', 500);
      if (token && !offer.deployToken) {
        throw new IntegrationError(400, `${offer.kind.name} doesn’t take a deploy token.`);
      }
      // A save without a secret keeps the stored one, so test with that one too, but only against
      // the address it was saved for: a changed address never receives the saved secrets.
      const found = await loadRow(db, kind);
      const saved = found?.url === details.url ? found : undefined;
      const needsVault =
        secret || token || saved?.signing_secret_encrypted || saved?.deploy_token_encrypted;
      const vault = needsVault ? await options.vault() : null;
      const result = await runCheck(offer, {
        ...details,
        signingSecret: secret ?? openSaved(vault, saved?.signing_secret_encrypted),
        deployToken: token ?? openSaved(vault, saved?.deploy_token_encrypted),
      });
      const sealedSecret = secret && vault ? vault.seal(secret) : null;
      const sealedToken = token && vault ? vault.seal(token) : null;
      await db.query(
        `INSERT INTO server_integrations (kind, url, public_key, signing_secret_encrypted, last_test_ok, last_test_message, deploy_token_encrypted, last_tested_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
         ON CONFLICT (kind) DO UPDATE SET url = EXCLUDED.url, public_key = EXCLUDED.public_key,
           signing_secret_encrypted = coalesce($4, server_integrations.signing_secret_encrypted),
           deploy_token_encrypted = coalesce($7, server_integrations.deploy_token_encrypted),
           last_test_ok = EXCLUDED.last_test_ok, last_test_message = EXCLUDED.last_test_message,
           last_tested_at = now(), updated_at = now()`,
        [
          kind,
          details.url,
          details.publicKey,
          sealedSecret,
          result.ok,
          result.message,
          sealedToken,
        ],
      );
      return card(offer, await loadRow(db, kind));
    }),
  );

  /**
   * Tests the values sent, or the saved connection when none are sent. Only a test of the saved
   * connection updates its stored result.
   */
  app.post(
    '/api/admin/integrations/:kind/test',
    handle(async (request) => {
      requireAdmin(request);
      const { kind } = request.params as { kind: string };
      const offer = offerFor(kind);
      const body = sentDetails(kind, request);
      const sent = body.url !== undefined || body.publicKey !== undefined;
      const saved = await loadRow(db, kind);
      const url = body.url !== undefined ? httpUrl(body.url) : offer.environment?.url ?? saved?.url;
      const publicKeyValue =
        body.publicKey !== undefined
          ? keyText(body.publicKey, 'public key', 200)
          : offer.environment?.publicKey ?? saved?.public_key;
      if (!url || !publicKeyValue) {
        throw new IntegrationError(400, `Enter the ${offer.kind.name} address and public key first.`);
      }
      // Sent values are tested with the secrets sent alongside them, never with saved ones.
      const secrets = sent
        ? {
            signingSecret: optionalKey(body.signingSecret, 'signing secret', 500),
            deployToken: optionalKey(body.deployToken, 'deploy token', 500),
          }
        : offer.environment
          ? {
              signingSecret: offer.environment.signingSecret,
              deployToken: offer.environment.deployToken,
            }
          : await savedSecrets(saved);
      const result = await runCheck(offer, { url, publicKey: publicKeyValue, ...secrets });
      const testsSaved = !offer.environment && saved !== undefined && !sent;
      if (testsSaved) {
        await db.query(
          `UPDATE server_integrations SET last_test_ok = $1, last_test_message = $2, last_tested_at = now()
            WHERE kind = $3`,
          [result.ok, result.message, kind],
        );
      }
      return result;
    }),
  );

  /** Opens the saved secrets, for a test of the saved connection. */
  async function savedSecrets(
    saved: SavedRow | undefined,
  ): Promise<{ signingSecret?: string; deployToken?: string }> {
    if (!saved) return {};
    if (!saved.signing_secret_encrypted && !saved.deploy_token_encrypted) return {};
    const vault = await options.vault();
    return {
      signingSecret: openSaved(vault, saved.signing_secret_encrypted),
      deployToken: openSaved(vault, saved.deploy_token_encrypted),
    };
  }

  app.delete(
    '/api/admin/integrations/:kind',
    handle(async (request) => {
      requireAdmin(request);
      const { kind } = request.params as { kind: string };
      const offer = offerFor(kind);
      if (offer.environment) {
        throw new IntegrationError(
          409,
          `The server’s configuration sets this. Remove ${offer.envPrefix}_URL to disconnect it here.`,
        );
      }
      await db.query('DELETE FROM server_integrations WHERE kind = $1', [kind]);
      return { ok: true };
    }),
  );

  /** Public values only, so the web app can load its clients. Never a secret. */
  app.get(
    '/api/client-config',
    handle(async () => {
      const config: Record<string, { url: string; publicKey: string } | null> = {};
      for (const offer of offers) {
        const details = offer.environment ?? (await loadPublic(offer.kind.kind));
        config[offer.kind.kind] = details
          ? { url: details.url, publicKey: details.publicKey }
          : null;
      }
      return config;
    }),
  );

  /**
   * Signs who is signed in with the OpenAnnounce secret, so the browser can't claim other groups.
   * 204 when OpenAnnounce isn't connected or has no secret: people then see what's for everyone.
   */
  const announceUser = options.announceUser?.bind(options);
  const announceOffer = offers.find((offer) => offer.kind.kind === 'openannounce');
  if (announceUser && announceOffer) {
    app.get(
      '/api/openannounce-token',
      handle(async (request, reply) => {
        void reply.header('cache-control', 'no-store');
        const user = await announceUser(request);
        if (!user) throw new IntegrationError(401, 'Sign in first.');
        const connection = await resolveConnection(db, options.vault, announceOffer);
        if (!connection?.signingSecret) return reply.code(204).send();
        const token = await signUser(connection.signingSecret, {
          sub: user.sub,
          groups: user.groups,
        });
        return reply.type('text/plain').send(token);
      }),
    );
  }

  async function loadPublic(kind: string): Promise<ConnectionDetails | null> {
    const row = await loadRow(db, kind);
    return row ? { url: row.url, publicKey: row.public_key } : null;
  }
}

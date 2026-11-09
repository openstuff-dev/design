import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * Stand-ins for OpenVersion and OpenAnnounce, for an app's own tests. Each answers the requests
 * this package sends, as the real one does, on a local port. The app's test config needs
 * `fetch: 'private'` (or `OPEN…_FETCH=private`) to reach it.
 */

/** One request a stand-in received. */
export interface SeenRequest {
  method: string;
  path: string;
  headers: IncomingMessage['headers'];
  body: string;
}

/** A running stand-in. Close it in `afterAll`. */
export interface StandIn {
  /** Its address, e.g. `http://127.0.0.1:53121`, for the connection's `url`. */
  url: string;
  /** Every request so far, oldest first. Empty it with `requests.length = 0`. */
  requests: SeenRequest[];
  close(): Promise<void>;
}

export interface OpenVersionStandInOptions {
  /** The app's public key. Any other key answers 401. */
  publicKey: string;
  /** The deploy token it accepts. Any other answers 401. */
  deployToken?: string;
  /** Origins allowed to read the version. Leave it out to allow every origin. */
  allowedOrigins?: string[];
  /** The answer to a publish (`POST /api/v1/releases`): 201, or 409 for one that isn’t newer. */
  publishStatus?: number;
}

export interface OpenAnnounceStandInOptions {
  /** The system's public key. Any other key answers 401. */
  publicKey: string;
  /** Origins allowed to read the feed. Leave it out to allow every origin. */
  allowedOrigins?: string[];
}

type Answer = (request: SeenRequest, url: URL) => [status: number, body: unknown];

async function standIn(answer: Answer): Promise<StandIn> {
  const requests: SeenRequest[] = [];
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    let body = '';
    request.on('data', (chunk: Buffer) => (body += chunk.toString()));
    request.on('end', () => {
      const seen = { method: request.method ?? 'GET', path: request.url ?? '/', headers: request.headers, body };
      requests.push(seen);
      const [status, payload] = answer(seen, new URL(seen.path, 'http://stand-in'));
      response.writeHead(status, { 'content-type': 'application/json' });
      response.end(JSON.stringify(payload));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    requests,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      }),
  };
}

const allowed = (origins: string[] | undefined, origin: string | string[] | undefined) =>
  !origins || origins.includes(String(origin));

/** Answers the version check, the deploy token check and a publish, like OpenVersion. */
export function standInOpenVersion(options: OpenVersionStandInOptions): Promise<StandIn> {
  return standIn((request, url) => {
    if (url.pathname === '/api/v1/version') {
      if (url.searchParams.get('key') !== options.publicKey) return [401, { error: 'Unknown public key.' }];
      if (!allowed(options.allowedOrigins, request.headers.origin)) {
        return [403, { error: `${String(request.headers.origin)} isn’t an allowed origin.` }];
      }
      return [200, { version: '1.0.0' }];
    }
    const tokenWorks = !!options.deployToken && request.headers.authorization === `Bearer ${options.deployToken}`;
    if (url.pathname === '/api/v1/releases/live') {
      return tokenWorks ? [200, null] : [401, { error: 'Unknown deploy token.' }];
    }
    if (url.pathname === '/api/v1/releases' && request.method === 'POST') {
      return tokenWorks ? [options.publishStatus ?? 201, {}] : [401, { error: 'Unknown deploy token.' }];
    }
    return [404, { error: 'Not found.' }];
  });
}

/** Answers the feed check, like OpenAnnounce. */
export function standInOpenAnnounce(options: OpenAnnounceStandInOptions): Promise<StandIn> {
  return standIn((request, url) => {
    if (url.pathname !== '/api/v1/feed') return [404, { error: 'Not found.' }];
    if (request.headers['x-openannounce-key'] !== options.publicKey) {
      return [401, { error: 'That public key doesn’t belong to any system.' }];
    }
    if (!allowed(options.allowedOrigins, request.headers.origin)) {
      return [403, { error: `${String(request.headers.origin)} isn’t one of this system’s allowed origins.` }];
    }
    return [200, []];
  });
}

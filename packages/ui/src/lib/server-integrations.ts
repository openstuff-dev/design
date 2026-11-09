/** One connected system, as `GET /api/client-config` gives it. Both are safe in the browser. */
export interface ClientConnection {
  url: string;
  publicKey: string;
}

/** What `GET /api/client-config` answers: each system on offer, null when not connected. */
export type ClientConfig = Record<string, ClientConnection | null | undefined>;

/**
 * How the app starts each system. The app does the `import()`, so the toolkit doesn't depend on
 * the systems' packages and a bundle only grows for what is connected.
 */
export interface ServerIntegrationLoaders {
  /** Runs when OpenVersion is connected and this build knows its version. */
  openversion?: (connection: ClientConnection & { version: string }) => unknown;
  /** Runs when OpenAnnounce is connected. */
  openannounce?: (connection: ClientConnection) => unknown;
}

export interface ServerIntegrationsOptions {
  /** This build's release. 'unknown' or empty (a local build) leaves OpenVersion off. */
  version: string;
  load: ServerIntegrationLoaders;
  /** Default `/api/client-config`. */
  configUrl?: string;
  fetch?: typeof fetch;
  /** Told about anything that failed. Nothing fails loudly: the app works without these systems. */
  onError?: (error: unknown) => void;
}

/**
 * Reads which systems the server is connected to and starts each one with the app's loader.
 * It never throws and never blocks: call it once, without waiting for it, after the app starts.
 * Returns the systems it started.
 *
 * @example
 * void startServerIntegrations({
 *   version: APP_VERSION,
 *   load: {
 *     openversion: async (connection) => {
 *       const [{ configure }] = await Promise.all([
 *         import('@openstuff-dev/version'),
 *         import('@openstuff-dev/version/update'),
 *       ]);
 *       configure(connection);
 *       document.body.prepend(document.createElement('ov-update'));
 *     },
 *   },
 * });
 */
export async function startServerIntegrations(
  options: ServerIntegrationsOptions,
): Promise<(keyof ServerIntegrationLoaders)[]> {
  const report = options.onError ?? (() => undefined);
  let config: ClientConfig;
  try {
    const response = await (options.fetch ?? fetch)(options.configUrl ?? '/api/client-config', {
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`client-config answered ${response.status}`);
    config = (await response.json()) as ClientConfig;
  } catch (error) {
    report(error);
    return [];
  }

  const started: (keyof ServerIntegrationLoaders)[] = [];
  const run = async (kind: keyof ServerIntegrationLoaders, start: () => unknown): Promise<void> => {
    try {
      await start();
      started.push(kind);
    } catch (error) {
      report(error);
    }
  };

  const version = options.version.trim();
  const openVersion = usable(config.openversion);
  const openAnnounce = usable(config.openannounce);
  const { load } = options;
  await Promise.all([
    openVersion && load.openversion && knownVersion(version)
      ? run('openversion', () => load.openversion?.({ ...openVersion, version }))
      : undefined,
    openAnnounce && load.openannounce
      ? run('openannounce', () => load.openannounce?.(openAnnounce))
      : undefined,
  ]);
  return started;
}

function knownVersion(version: string): boolean {
  return version !== '' && version !== 'unknown';
}

function usable(value: unknown): ClientConnection | null {
  if (!value || typeof value !== 'object') return null;
  const { url, publicKey } = value as Partial<ClientConnection>;
  return typeof url === 'string' && url && typeof publicKey === 'string' && publicKey
    ? { url, publicKey }
    : null;
}

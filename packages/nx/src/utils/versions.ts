import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Versions of what generated projects install. The OpenStuff packages are looked up instead. */
export const versions = {
  angular: '~22.2.3',
  angularCli: '~22.2.4',
  rxjs: '~7.8.0',
  tslib: '^2.3.0',
  typescript: '~6.0.3',
  eslint: '^10.13.0',
  prettier: '^3.8.1',
  stylelint: '^17.16.0',
  vitest: '^5.0.1',
  fastify: '^5.12.7',
  fastifyStatic: '^10.1.7',
  tsx: '^4.23.15',
  typesNode: '^24.0.0',
} as const;

export const TOOLKIT = [
  '@openstuff-dev/tokens',
  '@openstuff-dev/ui',
  '@openstuff-dev/ui-angular',
  '@openstuff-dev/lint',
] as const;
export type ToolkitPackage = (typeof TOOLKIT)[number];

/** This plugin's own version, for when the registry can't be reached. */
export function ownVersion(): string {
  const manifest = JSON.parse(
    readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'),
  ) as { version: string };
  return manifest.version;
}

const found = new Map<string, string | null>();

/**
 * The newest published version of a toolkit package as a caret range, or null when the registry
 * can't be reached. The packages are versioned independently, so each one is asked for. npm reads
 * the registry from the environment, so a local registry (`nx local-registry`) works too.
 */
export function publishedVersion(name: ToolkitPackage): string | null {
  if (!found.has(name)) {
    let range: string | null = null;
    try {
      const out = execFileSync('npm', ['view', name, 'version'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 15_000,
        shell: process.platform === 'win32',
      }).trim();
      if (/^\d+\.\d+\.\d+/.test(out)) range = `^${out}`;
    } catch {
      // Offline, or not published yet.
    }
    found.set(name, range);
  }
  return found.get(name) ?? null;
}

/** The range to install for a toolkit package: the published one, else this plugin's version. */
export function toolkitVersion(name: ToolkitPackage): string {
  return publishedVersion(name) ?? `^${ownVersion()}`;
}

/** Forgets looked-up versions (for tests). */
export function clearVersionCache(): void {
  found.clear();
}

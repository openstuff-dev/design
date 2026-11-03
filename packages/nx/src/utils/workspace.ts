import {
  readJson,
  type Tree,
  updateJson,
  visitNotIgnoredFiles,
  writeJson,
} from '@nx/devkit';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  publishedVersion,
  TOOLKIT,
  type ToolkitPackage,
  toolkitVersion,
  versions,
} from './versions';

/** The files every OpenStuff workspace shares. `sync` brings older workspaces up to date. */
const WORKSPACE_FILES = join(__dirname, '..', 'files', 'workspace');

/** Where the OpenPurpose instructions sit in AGENTS.md, so `sync` can replace just that part. */
export const AGENTS_START = '<!-- openstuff:openpurpose:start -->';
export const AGENTS_END = '<!-- openstuff:openpurpose:end -->';

interface PackageJson {
  name?: string;
  private?: boolean;
  workspaces?: string[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  prettier?: string;
}

/**
 * Reads a folder of static files as `{ path: content }`. `__dot__` in a name becomes a dot and a
 * `.template` suffix is dropped, so npm publishes dotfiles and ESLint skips config templates.
 */
export function readStaticFiles(dir: string): Map<string, string> {
  const files = new Map<string, string>();
  const walk = (current: string): void => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else {
        const path = relative(dir, full)
          .split('\\')
          .join('/')
          .replaceAll('__dot__', '.')
          .replace(/\.template$/, '');
        files.set(path, readFileSync(full, 'utf8'));
      }
    }
  };
  walk(dir);
  return files;
}

/**
 * Writes the shared workspace files. With `overwrite` (a new workspace) every file is written.
 * Without it (`sync`), files are only added: an existing AGENTS.md gets its OpenPurpose part
 * replaced, .gitignore gets the lines it lacks, and any other file that differs is left alone and
 * returned, so the person can compare it by hand.
 */
export function writeWorkspaceFiles(tree: Tree, overwrite: boolean): string[] {
  const differ: string[] = [];
  for (const [path, content] of readStaticFiles(WORKSPACE_FILES)) {
    const current = tree.exists(path) ? tree.read(path, 'utf8') : null;
    if (current === null || overwrite) {
      tree.write(path, content);
    } else if (current === content) {
      continue;
    } else if (path === 'AGENTS.md') {
      tree.write(path, replaceAgentsBlock(current, content));
    } else if (path === '.gitignore') {
      tree.write(path, mergeLines(current, content));
    } else if (path === '.vscode/settings.json') {
      updateJson<Record<string, unknown>>(tree, path, (settings) => ({
        ...(JSON.parse(content) as Record<string, unknown>),
        ...settings,
      }));
    } else {
      differ.push(path);
    }
  }
  return differ;
}

/** Puts the template's OpenPurpose part into an existing AGENTS.md, keeping everything else. */
export function replaceAgentsBlock(current: string, template: string): string {
  const block = template.slice(
    template.indexOf(AGENTS_START),
    template.indexOf(AGENTS_END) + AGENTS_END.length,
  );
  const start = current.indexOf(AGENTS_START);
  const end = current.indexOf(AGENTS_END);
  if (start === -1 || end === -1) return `${current.trimEnd()}\n\n${block}\n`;
  return current.slice(0, start) + block + current.slice(end + AGENTS_END.length);
}

/** Appends the template's lines that the file doesn't have yet. */
export function mergeLines(current: string, template: string): string {
  const have = new Set(current.split('\n').map((line) => line.trim()));
  const missing = template
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#') && !have.has(line.trim()));
  if (missing.length === 0) return current;
  return `${current.trimEnd()}\n\n# OpenStuff\n${missing.join('\n')}\n`;
}

/** Workspaces, script aliases and the lint toolchain in the root package.json. */
export function updateRootPackageJson(tree: Tree): void {
  const nxVersion = readJson<PackageJson>(tree, 'package.json').devDependencies?.nx ?? '24.0.2';
  updateJson<PackageJson>(tree, 'package.json', (json) => {
    const workspaces = new Set([...(json.workspaces ?? []), 'apps/*', 'packages/*']);
    return {
      ...json,
      private: true,
      workspaces: [...workspaces],
      scripts: {
        build: 'nx run-many -t build',
        typecheck: 'nx run-many -t typecheck',
        test: 'nx run-many -t test',
        lint: 'nx run-many -t lint stylelint',
        ...json.scripts,
      },
      devDependencies: sortKeys({
        ...json.devDependencies,
        '@nx/eslint': json.devDependencies?.['@nx/eslint'] ?? nxVersion,
        '@openstuff-dev/lint':
          json.devDependencies?.['@openstuff-dev/lint'] ?? toolkitVersion('@openstuff-dev/lint'),
        eslint: json.devDependencies?.eslint ?? versions.eslint,
        prettier: json.devDependencies?.prettier ?? versions.prettier,
        stylelint: json.devDependencies?.stylelint ?? versions.stylelint,
        typescript: json.devDependencies?.typescript ?? versions.typescript,
      }),
      prettier: json.prettier ?? '@openstuff-dev/lint/prettier',
    };
  });
}

const LINT_INPUTS = (tool: string, config: string): unknown[] => [
  'default',
  `{workspaceRoot}/${config}`,
  { externalDependencies: [tool, '@openstuff-dev/lint'] },
];

/** Cached targets, lint inputs and the ESLint plugin in nx.json. Existing settings win. */
export function updateNxJson(tree: Tree): void {
  if (!tree.exists('nx.json')) writeJson(tree, 'nx.json', {});
  updateJson<Record<string, unknown>>(tree, 'nx.json', (json) => {
    const targetDefaults = (json.targetDefaults ?? {}) as Record<string, Record<string, unknown>>;
    const defaults: Record<string, Record<string, unknown>> = {
      build: { cache: true, dependsOn: ['^build'] },
      test: { cache: true, dependsOn: ['^build'] },
      typecheck: { cache: true, dependsOn: ['^build'] },
      lint: {
        cache: true,
        dependsOn: ['^build'],
        inputs: LINT_INPUTS('eslint', 'eslint.config.mjs'),
      },
      stylelint: { cache: true, inputs: LINT_INPUTS('stylelint', 'stylelint.config.mjs') },
    };
    const mergedTargets: Record<string, unknown> = { ...targetDefaults };
    for (const [name, config] of Object.entries(defaults)) {
      mergedTargets[name] = { ...config, ...targetDefaults[name] };
    }
    const plugins = (json.plugins ?? []) as (string | { plugin: string })[];
    const hasEslint = plugins.some(
      (p) => (typeof p === 'string' ? p : p.plugin) === '@nx/eslint/plugin',
    );
    return {
      $schema: './node_modules/nx/schemas/nx-schema.json',
      defaultBase: 'main',
      ...json,
      targetDefaults: mergedTargets,
      plugins: hasEslint
        ? plugins
        : [...plugins, { plugin: '@nx/eslint/plugin', options: { targetName: 'lint' } }],
    };
  });
}

/**
 * Moves every toolkit dependency in the workspace to its newest published version. Packages the
 * registry doesn't know (offline, or not released yet) keep what they have.
 */
export function updateToolkitVersions(tree: Tree): string[] {
  const changed: string[] = [];
  const manifests = ['package.json'];
  visitNotIgnoredFiles(tree, '', (path) => {
    if (path.endsWith('/package.json') && !path.includes('node_modules/')) manifests.push(path);
  });
  for (const path of manifests) {
    updateJson<PackageJson>(tree, path, (json) => {
      for (const field of ['dependencies', 'devDependencies'] as const) {
        const deps = json[field];
        if (!deps) continue;
        for (const name of TOOLKIT) {
          const range = name in deps ? publishedVersion(name) : null;
          if (range && deps[name] !== range) {
            deps[name] = range;
            changed.push(`${path}: ${name} ${range}`);
          }
        }
      }
      return json;
    });
  }
  return changed;
}

/** `{ "@openstuff-dev/ui": "^0.1.0", … }` for the given toolkit packages. */
export function toolkitDependencies(names: ToolkitPackage[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, toolkitVersion(name)]));
}

export function sortKeys<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

/** The npm scope for new packages: `demo` from a root package called `@demo/source` or `demo`. */
export function workspaceScope(tree: Tree): string {
  const name = readJson<PackageJson>(tree, 'package.json').name ?? 'app';
  return name.startsWith('@') ? name.slice(1).split('/')[0] : name;
}

/** `my-app` → `My App`, for titles in the README and the web app. */
export function titleCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** The repository's https remote, for package.json's `repository` field and the site's links. */
export function gitRemote(cwd: string): string | null {
  try {
    const url = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return url.replace(/^git@([^:]+):/, 'https://$1/') || null;
  } catch {
    return null;
  }
}

export function renderWebServerDockerfile(
  packages: string[],
  runtimePackages: string[] = packages,
): string {
  const wsFlags = packages.map((p) => ` -w ${p}`).join('');
  const baseStage = packages.length > 0 ? 'packages' : 'manifests';
  const manifestCopies = packages.map((p) => `COPY ${p}/package.json ${p}/\n`).join('');
  const packagesStage =
    packages.length > 0
      ? `\nFROM manifests AS packages\nRUN npm ci${wsFlags}\nCOPY packages/ packages/\nRUN npm run build${wsFlags}\n`
      : '';
  const runtimeCopies = runtimePackages
    .map(
      (p) =>
        `COPY --from=packages /app/${p}/package.json /app/${p}/\nCOPY --from=packages /app/${p}/dist /app/${p}/dist\n`,
    )
    .join('');
  return `# One image with the API and the web app. The server serves the built web app from WEB_DIR.
FROM node:24-alpine AS manifests
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
${manifestCopies}${packagesStage}
FROM ${baseStage} AS web
RUN npm ci -w apps/web${wsFlags}
COPY apps/web/ apps/web/
RUN npm run tokens -w apps/web && npm run build -w apps/web

FROM ${baseStage} AS server
RUN npm ci -w apps/server${wsFlags}
COPY apps/server/ apps/server/
RUN npm run build -w apps/server

FROM manifests AS server-deps
RUN npm ci -w apps/server --omit=dev && mkdir -p apps/server/node_modules

FROM node:24-alpine
ENV NODE_ENV=production \\
    PORT=8080 \\
    WEB_DIR=/app/web
WORKDIR /app/apps/server
COPY --from=server-deps /app/node_modules /app/node_modules
# Anything npm had to nest under the server instead of hoisting (usually empty).
COPY --from=server-deps /app/apps/server/node_modules ./node_modules
${runtimeCopies}COPY --from=server /app/apps/server/dist ./dist
COPY --from=server /app/apps/server/package.json ./
COPY --from=web /app/apps/web/dist/web/browser /app/web
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1
CMD ["node", "dist/index.js"]
`;
}

/**
 * Updates the web-server Dockerfile to build any workspace packages in `packages/` and copy
 * runtime packages into the final image. Leaves customized Dockerfiles untouched.
 */
export function updateDockerfile(tree: Tree): void {
  if (
    !tree.exists('Dockerfile') ||
    !tree.exists('apps/server/package.json') ||
    !tree.exists('apps/web/package.json')
  ) {
    return;
  }
  const current = tree.read('Dockerfile', 'utf8') ?? '';
  const prevPackages = [
    ...current.matchAll(/^COPY (packages\/[^\s/]+)\/package\.json \1\/$/gm),
  ].map((m) => m[1]);
  const prevRuntime = [
    ...current.matchAll(
      /^COPY --from=packages \/app\/(packages\/[^\s/]+)\/package\.json \/app\/\1\/$/gm,
    ),
  ].map((m) => m[1]);
  if (current.trim() !== renderWebServerDockerfile(prevPackages, prevRuntime).trim()) {
    return;
  }

  const packages = tree.exists('packages')
    ? tree
        .children('packages')
        .sort((a, b) => a.localeCompare(b))
        .map((dir) => `packages/${dir}`)
        .filter((pkg) => tree.exists(`${pkg}/package.json`))
    : [];
  const serverManifest = readJson<PackageJson>(tree, 'apps/server/package.json');
  const serverDeps = serverManifest.dependencies ?? {};
  const serverDevDeps = serverManifest.devDependencies ?? {};
  const runtimePackages = packages.filter((pkg) => {
    const name = readJson<PackageJson>(tree, `${pkg}/package.json`).name;
    if (!name) return true;
    if (name in serverDeps) return true;
    if (name in serverDevDeps) return false;
    return true;
  });

  const next = renderWebServerDockerfile(packages, runtimePackages);
  if (current !== next) tree.write('Dockerfile', next);
}

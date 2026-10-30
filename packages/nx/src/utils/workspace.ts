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
    const targetDefaults = (json.targetDefaults ?? {}) as Record<string, unknown>;
    const plugins = (json.plugins ?? []) as (string | { plugin: string })[];
    const hasEslint = plugins.some(
      (p) => (typeof p === 'string' ? p : p.plugin) === '@nx/eslint/plugin',
    );
    return {
      $schema: './node_modules/nx/schemas/nx-schema.json',
      defaultBase: 'main',
      ...json,
      targetDefaults: {
        build: { cache: true, dependsOn: ['^build'] },
        test: { cache: true },
        typecheck: { cache: true },
        lint: { cache: true, inputs: LINT_INPUTS('eslint', 'eslint.config.mjs') },
        stylelint: { cache: true, inputs: LINT_INPUTS('stylelint', 'stylelint.config.mjs') },
        ...targetDefaults,
      },
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

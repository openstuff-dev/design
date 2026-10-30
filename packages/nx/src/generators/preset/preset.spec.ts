import { readJson, type Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearVersionCache } from '../../utils/versions';
import { presetGenerator } from './preset';

// No registry and no git in tests: toolkit versions fall back to this plugin's version.
vi.mock('node:child_process', () => ({
  execFileSync: () => {
    throw new Error('offline');
  },
}));

interface Manifest {
  name: string;
  workspaces?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  nx?: { name: string; tags: string[] };
}

describe('preset generator', () => {
  let tree: Tree;

  beforeEach(() => {
    clearVersionCache();
    tree = createTreeWithEmptyWorkspace();
    tree.write('package.json', JSON.stringify({ name: '@demo/source', devDependencies: { nx: '24.0.2' } }));
  });

  it('sets up a web app with a server by default', async () => {
    await presetGenerator(tree, { name: 'demo' });

    const root = readJson<Manifest>(tree, 'package.json');
    expect(root.workspaces).toEqual(['apps/*', 'packages/*']);
    expect(root.devDependencies).toMatchObject({
      '@nx/eslint': '24.0.2',
      '@openstuff-dev/lint': expect.stringMatching(/^\^\d/) as unknown,
    });

    const web = readJson<Manifest>(tree, 'apps/web/package.json');
    expect(web.name).toBe('@demo/web');
    expect(web.nx).toMatchObject({ name: 'web', tags: ['type:app'] });
    expect(Object.keys(web.dependencies ?? {})).toEqual(
      expect.arrayContaining(['@openstuff-dev/tokens', '@openstuff-dev/ui', '@openstuff-dev/ui-angular']),
    );
    expect(readJson(tree, 'apps/web/tokens.config.json')).toEqual({
      primaryColor: '#2d5bff',
      outDir: 'src/tokens',
    });
    expect(tree.exists('apps/web/proxy.conf.json')).toBe(true);
    expect(tree.read('apps/web/src/app/home.ts', 'utf8')).toContain("fetch('/api/health')");

    expect(readJson<Manifest>(tree, 'apps/server/package.json').nx?.name).toBe('server');
    expect(tree.read('Dockerfile', 'utf8')).toContain('WEB_DIR=/app/web');
    for (const file of [
      '.gitignore',
      '.editorconfig',
      '.prettierignore',
      '.dockerignore',
      '.env.example',
      '.github/workflows/ci.yml',
      '.vscode/settings.json',
      'eslint.config.mjs',
      'stylelint.config.mjs',
      'AGENTS.md',
      'CLAUDE.md',
      '.claude/skills/ux-details/SKILL.md',
      'LICENSE',
      'README.md',
      'docker-compose.yml',
    ]) {
      expect(tree.exists(file), file).toBe(true);
    }
    expect(tree.exists('.openpurpose.json')).toBe(false);
    expect(tree.read('README.md', 'utf8')).toContain('register_repository');
  });

  it('serves a web app on its own with nginx', async () => {
    await presetGenerator(tree, { name: 'demo', stack: 'web', primaryColor: '#e5484d' });

    expect(tree.exists('apps/server')).toBe(false);
    expect(tree.exists('apps/web/proxy.conf.json')).toBe(false);
    expect(tree.read('apps/web/src/app/home.ts', 'utf8')).not.toContain('/api/health');
    expect(readJson<{ primaryColor: string }>(tree, 'apps/web/tokens.config.json').primaryColor).toBe('#e5484d');
    expect(tree.exists('nginx.conf')).toBe(true);
    expect(tree.read('apps/web/src/index.html', 'utf8')).toContain('<title>Demo</title>');
  });

  it('starts a package without Docker', async () => {
    await presetGenerator(tree, { name: 'money', stack: 'library' });

    const manifest = readJson<Manifest & { publishConfig: unknown; license: string }>(tree, 'packages/money/package.json');
    expect(manifest.name).toBe('money');
    expect(manifest.publishConfig).toEqual({ access: 'public' });
    expect(manifest.license).toBe('MIT');
    expect(tree.exists('apps')).toBe(false);
    expect(tree.exists('Dockerfile')).toBe(false);
  });

  it('writes .openpurpose.json for a given project', async () => {
    await presetGenerator(tree, { name: 'demo-shop', openpurpose: 'acme/demo' });
    expect(tree.read('README.md', 'utf8')).toMatch(/^# Demo Shop$/m);

    expect(readJson(tree, '.openpurpose.json')).toEqual({ project: 'acme/demo' });
    expect(tree.read('README.md', 'utf8')).not.toContain('register_repository');
  });

  it('cleans up after nx new', async () => {
    tree.write('package.json', JSON.stringify({ name: '@demo/source', dependencies: { '@openstuff-dev/nx': '0.2.0' } }));
    tree.write('libs/.gitkeep', '');
    tree.write('apps/.gitkeep', '');

    await presetGenerator(tree, { name: 'demo', stack: 'web' });

    const root = readJson<Manifest>(tree, 'package.json');
    expect(root.dependencies).toBeUndefined();
    expect(root.devDependencies?.['@openstuff-dev/nx']).toBe('^0.2.0');
    expect(tree.exists('libs')).toBe(false);
    expect(tree.exists('apps/.gitkeep')).toBe(false);
  });

  it('refuses an OpenPurpose project that is not org/slug', async () => {
    await expect(presetGenerator(tree, { name: 'demo', openpurpose: 'demo' })).rejects.toThrow(
      'org/slug',
    );
  });
});

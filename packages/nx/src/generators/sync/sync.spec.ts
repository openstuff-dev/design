import { readJson, type Tree, writeJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearVersionCache } from '../../utils/versions';
import { AGENTS_END, AGENTS_START } from '../../utils/workspace';
import { syncGenerator } from './sync';

// The registry knows ui 0.3.0 and nothing else.
vi.mock('node:child_process', () => ({
  execFileSync: (_cmd: string, args: string[]) => {
    if (args[1] === '@openstuff-dev/ui') return '0.3.0\n';
    throw new Error('not found');
  },
}));

describe('sync generator', () => {
  let tree: Tree;

  beforeEach(() => {
    clearVersionCache();
    tree = createTreeWithEmptyWorkspace();
    writeJson(tree, 'package.json', { name: '@old/source', devDependencies: { nx: '24.0.2' } });
  });

  it('adds missing files and keeps the ones a project changed', async () => {
    tree.write('eslint.config.mjs', 'export default [];\n');
    tree.write('.gitignore', 'node_modules\nsecrets/\n');

    await syncGenerator(tree);

    expect(tree.read('eslint.config.mjs', 'utf8')).toBe('export default [];\n');
    expect(tree.exists('stylelint.config.mjs')).toBe(true);
    const gitignore = tree.read('.gitignore', 'utf8') ?? '';
    expect(gitignore).toContain('secrets/');
    expect(gitignore).toContain('apps/*/src/tokens');
    expect(gitignore.match(/^node_modules$/gm)).toHaveLength(1);
  });

  it('replaces only the OpenPurpose part of AGENTS.md', async () => {
    tree.write('AGENTS.md', `# Ours\n\nKeep this.\n\n${AGENTS_START}\nold\n${AGENTS_END}\n\nAnd this.\n`);

    await syncGenerator(tree);

    const agents = tree.read('AGENTS.md', 'utf8') ?? '';
    expect(agents).toContain('Keep this.');
    expect(agents).toContain('And this.');
    expect(agents).not.toContain('\nold\n');
    expect(agents).toContain('get_context');
  });

  it('moves toolkit packages to published versions and leaves unknown ones', async () => {
    writeJson(tree, 'apps/web/package.json', {
      name: 'web',
      dependencies: { '@openstuff-dev/ui': '^0.1.0', '@openstuff-dev/tokens': '^0.1.0', rxjs: '~7.8.0' },
    });

    await syncGenerator(tree);

    expect(readJson<{ dependencies: Record<string, string> }>(tree, 'apps/web/package.json').dependencies).toEqual({
      '@openstuff-dev/ui': '^0.3.0',
      '@openstuff-dev/tokens': '^0.1.0',
      rxjs: '~7.8.0',
    });
  });

  it('merges nx.json defaults without overriding the workspace', async () => {
    writeJson(tree, 'nx.json', { defaultBase: 'master', targetDefaults: { build: { cache: false } } });

    await syncGenerator(tree);

    const nxJson = readJson<{ defaultBase: string; targetDefaults: Record<string, unknown>; plugins: unknown[] }>(tree, 'nx.json');
    expect(nxJson.defaultBase).toBe('master');
    expect(nxJson.targetDefaults.build).toEqual({ cache: false });
    expect(nxJson.targetDefaults.stylelint).toBeDefined();
    expect(nxJson.plugins).toContainEqual({ plugin: '@nx/eslint/plugin', options: { targetName: 'lint' } });
  });
});

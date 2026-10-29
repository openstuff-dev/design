import { addProjectConfiguration, type Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { componentGenerator } from './component';

describe('component generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, 'web', { root: 'apps/web' });
    tree.write('apps/web/angular.json', JSON.stringify({ projects: { web: { prefix: 'acme' } } }));
  });

  it('adds an OnPush component with the app prefix', async () => {
    await componentGenerator(tree, { name: 'InvoiceList' });

    const source = tree.read('apps/web/src/app/invoice-list/invoice-list.ts', 'utf8');
    expect(source).toContain("selector: 'acme-invoice-list'");
    expect(source).toContain('export class InvoiceList');
    expect(source).toContain('ChangeDetectionStrategy.OnPush');
  });

  it('refuses a project without angular.json', async () => {
    addProjectConfiguration(tree, 'server', { root: 'apps/server' });
    await expect(componentGenerator(tree, { name: 'x', project: 'server' })).rejects.toThrow(
      "isn't an Angular app",
    );
  });
});

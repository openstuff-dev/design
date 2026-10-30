import {
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  installPackagesTask,
  names,
  offsetFromRoot,
  type Tree,
  writeJson,
} from '@nx/devkit';
import { join } from 'node:path';
import { versions } from '../../utils/versions';
import { gitRemote, workspaceScope } from '../../utils/workspace';
import type { LibraryGeneratorSchema } from './schema';

export async function libraryGenerator(
  tree: Tree,
  schema: LibraryGeneratorSchema,
): Promise<GeneratorCallback> {
  const name = names(schema.name).fileName;
  const root = `packages/${name}`;
  if (tree.exists(root)) throw new Error(`${root} already exists.`);
  const importPath = schema.importPath ?? `@${workspaceScope(tree)}/${name}`;

  generateFiles(tree, join(__dirname, 'files'), root, {
    name,
    importPath,
    propertyName: names(name).propertyName,
    offset: offsetFromRoot(root),
  });

  const remote = gitRemote(tree.root);
  writeJson(tree, `${root}/package.json`, {
    name: importPath,
    version: '0.0.0',
    type: 'module',
    exports: {
      '.': { types: './dist/index.d.ts', import: './dist/index.js' },
    },
    files: ['dist', '!**/*.tsbuildinfo'],
    scripts: {
      build: 'tsc -p tsconfig.json',
      test: 'vitest run',
      typecheck: 'tsc -p tsconfig.json --noEmit',
    },
    devDependencies: {
      typescript: versions.typescript,
      vitest: versions.vitest,
    },
    // npm needs these to publish a public, scoped package with provenance.
    publishConfig: { access: 'public' },
    license: 'MIT',
    ...(remote && {
      repository: { type: 'git', url: `git+${remote}`, directory: root },
    }),
    nx: {
      name,
      tags: ['type:package'],
      targets: {
        build: { outputs: ['{projectRoot}/dist'] },
      },
    },
  });

  await formatFiles(tree);
  return () => {
    // Forced: the new dependencies are in the project's package.json, not the root one.
    installPackagesTask(tree, true);
  };
}

export default libraryGenerator;

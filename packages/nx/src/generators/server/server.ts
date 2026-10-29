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
import { workspaceScope } from '../../utils/workspace';
import type { ServerGeneratorSchema } from './schema';

export async function serverGenerator(
  tree: Tree,
  schema: ServerGeneratorSchema,
): Promise<GeneratorCallback> {
  const name = names(schema.name ?? 'server').fileName;
  const root = `apps/${name}`;
  if (tree.exists(root)) throw new Error(`${root} already exists.`);

  generateFiles(tree, join(__dirname, 'files'), root, { offset: offsetFromRoot(root) });

  writeJson(tree, `${root}/package.json`, {
    name: `@${workspaceScope(tree)}/${name}`,
    version: '0.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsc -p tsconfig.json',
      start: 'node dist/index.js',
      test: 'vitest run',
      typecheck: 'tsc -p tsconfig.json --noEmit',
    },
    dependencies: {
      '@fastify/static': versions.fastifyStatic,
      fastify: versions.fastify,
    },
    devDependencies: {
      '@types/node': versions.typesNode,
      tsx: versions.tsx,
      typescript: versions.typescript,
      vitest: versions.vitest,
    },
    engines: { node: '>=22' },
    nx: {
      name,
      tags: ['type:app'],
      targets: {
        build: { outputs: ['{projectRoot}/dist'] },
        dev: { continuous: true },
      },
    },
  });

  await formatFiles(tree);
  return () => {
    // Forced: the new dependencies are in the project's package.json, not the root one.
    installPackagesTask(tree, true);
  };
}

export default serverGenerator;

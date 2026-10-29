import {
  formatFiles,
  generateFiles,
  type GeneratorCallback,
  installPackagesTask,
  names,
  type Tree,
  updateJson,
  writeJson,
} from '@nx/devkit';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import {
  sortKeys,
  titleCase,
  updateNxJson,
  updateRootPackageJson,
  writeWorkspaceFiles,
} from '../../utils/workspace';
import { appGenerator } from '../app/app';
import { libraryGenerator } from '../library/library';
import { serverGenerator } from '../server/server';
import type { PresetGeneratorSchema } from './schema';

export async function presetGenerator(
  tree: Tree,
  schema: PresetGeneratorSchema,
): Promise<GeneratorCallback> {
  const stack = schema.stack ?? 'web-server';
  const name = names(schema.name).fileName;
  const title = titleCase(name);
  if (schema.openpurpose && !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(schema.openpurpose)) {
    throw new Error(`--openpurpose takes an OpenPurpose project as org/slug, not "${schema.openpurpose}".`);
  }

  if (!tree.exists('package.json')) writeJson(tree, 'package.json', { name: `@${name}/source` });
  writeWorkspaceFiles(tree, true);
  updateRootPackageJson(tree);
  updateNxJson(tree);
  // Left by `nx new`: its Prettier config (ours comes from @openstuff-dev/lint) and empty folders.
  for (const path of ['.prettierrc', 'libs', 'apps/.gitkeep', 'packages/.gitkeep']) {
    if (tree.exists(path)) tree.delete(path);
  }
  movePluginToDevDependencies(tree);

  generateFiles(tree, join(__dirname, 'files', 'root'), '.', {
    title,
    stack,
    openpurpose: schema.openpurpose ?? '',
    author: schema.author ?? gitUserName(tree.root) ?? `The ${title} authors`,
    year: new Date().getFullYear(),
  });
  if (schema.openpurpose) writeJson(tree, '.openpurpose.json', { project: schema.openpurpose });

  if (stack === 'library') {
    await libraryGenerator(tree, { name, importPath: name });
  } else {
    await appGenerator(tree, {
      name: 'web',
      title,
      primaryColor: schema.primaryColor,
      server: stack === 'web-server' ? 'server' : undefined,
    });
    if (stack === 'web-server') await serverGenerator(tree, { name: 'server' });
    generateFiles(tree, join(__dirname, 'files', `docker-${stack}`), '.', { dot: '.' });
  }

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree, true);
  };
}

/** `nx new` installs the preset as a dependency; it's only needed to run generators. */
function movePluginToDevDependencies(tree: Tree): void {
  updateJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
    tree,
    'package.json',
    (json) => {
      const version = json.dependencies?.['@openstuff-dev/nx'];
      if (version === undefined || !json.dependencies) return json;
      const { '@openstuff-dev/nx': _, ...dependencies } = json.dependencies;
      return {
        ...json,
        dependencies: Object.keys(dependencies).length > 0 ? dependencies : undefined,
        devDependencies: sortKeys({ ...json.devDependencies, '@openstuff-dev/nx': `^${version.replace(/^\D*/, '')}` }),
      };
    },
  );
}

function gitUserName(cwd: string): string | null {
  try {
    return (
      execFileSync('git', ['config', 'user.name'], {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim() || null
    );
  } catch {
    return null;
  }
}

export default presetGenerator;

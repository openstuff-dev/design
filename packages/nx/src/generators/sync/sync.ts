import { formatFiles, type GeneratorCallback, installPackagesTask, logger, type Tree } from '@nx/devkit';
import {
  updateNxJson,
  updateRootPackageJson,
  updateToolkitVersions,
  writeWorkspaceFiles,
} from '../../utils/workspace';

export async function syncGenerator(tree: Tree): Promise<GeneratorCallback | undefined> {
  const differ = writeWorkspaceFiles(tree, false);
  updateRootPackageJson(tree);
  updateNxJson(tree);
  const upgraded = updateToolkitVersions(tree);

  for (const line of upgraded) logger.info(`Updated ${line}`);
  if (differ.length > 0) {
    logger.warn(
      [
        'These files differ from the OpenStuff defaults and were left as they are.',
        'Compare them with packages/nx/src/files/workspace in openstuff-dev/design:',
        ...differ.map((path) => `  ${path}`),
      ].join('\n'),
    );
  }

  await formatFiles(tree);
  if (upgraded.length === 0) return undefined;
  return () => {
    installPackagesTask(tree, true);
  };
}

export default syncGenerator;

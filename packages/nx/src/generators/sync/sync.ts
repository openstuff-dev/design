import { formatFiles, type GeneratorCallback, installPackagesTask, logger, type Tree } from '@nx/devkit';
import {
  updateNxJson,
  updateRootPackageJson,
  updateToolkitVersions,
  writeWorkspaceFiles,
} from '../../utils/workspace';
import { syncSites } from '../../utils/site';

export async function syncGenerator(tree: Tree): Promise<GeneratorCallback | undefined> {
  const differ = writeWorkspaceFiles(tree, false);
  updateRootPackageJson(tree);
  updateNxJson(tree);
  const upgraded = updateToolkitVersions(tree);
  const sites = await syncSites(tree);

  for (const line of upgraded) logger.info(`Updated ${line}`);
  for (const site of sites) logger.info(`Updated the toolkit copy in ${site}/assets/os`);
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

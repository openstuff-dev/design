import {
  formatFiles,
  generateFiles,
  names,
  offsetFromRoot,
  type GeneratorCallback,
  type Tree,
  installPackagesTask,
  writeJson,
} from '@nx/devkit';
import { join } from 'node:path';
import { versions } from '../../utils/versions';
import { sortKeys, titleCase, toolkitDependencies, workspaceScope } from '../../utils/workspace';
import type { AppGeneratorSchema } from './schema';

export async function appGenerator(
  tree: Tree,
  schema: AppGeneratorSchema,
): Promise<GeneratorCallback> {
  const name = names(schema.name ?? 'web').fileName;
  const root = `apps/${name}`;
  if (tree.exists(root)) throw new Error(`${root} already exists.`);
  const scope = workspaceScope(tree);
  const server = schema.server ? names(schema.server).fileName : '';

  generateFiles(tree, join(__dirname, 'files'), root, {
    name,
    prefix: schema.prefix ?? 'app',
    primaryColor: schema.primaryColor ?? '#2d5bff',
    title: schema.title ?? titleCase(scope),
    server,
    offset: offsetFromRoot(root),
  });
  if (!server) tree.delete(`${root}/proxy.conf.json`);

  writeJson(tree, `${root}/package.json`, {
    name: `@${scope}/${name}`,
    version: '0.0.0',
    private: true,
    scripts: {
      ng: 'ng',
      tokens: 'os-tokens',
      serve: 'ng serve',
      build: 'ng build',
      watch: 'ng build --watch --configuration development',
      typecheck: 'tsc -p tsconfig.app.json --noEmit',
      stylelint: 'stylelint "src/**/*.css"',
    },
    dependencies: sortKeys({
      '@angular/aria': versions.angularCli,
      '@angular/cdk': versions.angularCli,
      '@angular/common': versions.angular,
      '@angular/compiler': versions.angular,
      '@angular/core': versions.angular,
      '@angular/forms': versions.angular,
      '@angular/platform-browser': versions.angular,
      '@angular/router': versions.angular,
      ...toolkitDependencies(['@openstuff-dev/tokens', '@openstuff-dev/ui', '@openstuff-dev/ui-angular']),
      rxjs: versions.rxjs,
      tslib: versions.tslib,
    }),
    devDependencies: {
      '@angular/build': versions.angularCli,
      '@angular/cli': versions.angularCli,
      '@angular/compiler-cli': versions.angular,
      typescript: versions.typescript,
    },
    nx: {
      name,
      tags: ['type:app'],
      targets: {
        // Writes src/tokens from tokens.config.json; everything that reads the CSS needs it first.
        tokens: {
          cache: true,
          inputs: [
            '{projectRoot}/tokens.config.json',
            { externalDependencies: ['@openstuff-dev/tokens'] },
          ],
          outputs: ['{projectRoot}/src/tokens'],
        },
        build: { dependsOn: ['tokens'], outputs: ['{projectRoot}/dist'] },
        serve: { dependsOn: ['tokens'], continuous: true },
        watch: { dependsOn: ['tokens'], continuous: true },
        typecheck: { dependsOn: ['tokens'] },
        stylelint: { dependsOn: ['tokens'] },
      },
    },
  });

  await formatFiles(tree);
  return () => {
    // Forced: the new dependencies are in the project's package.json, not the root one.
    installPackagesTask(tree, true);
  };
}

export default appGenerator;

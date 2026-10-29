import {
  formatFiles,
  generateFiles,
  joinPathFragments,
  names,
  readJson,
  readProjectConfiguration,
  type Tree,
} from '@nx/devkit';
import { join } from 'node:path';
import type { ComponentGeneratorSchema } from './schema';

interface AngularJson {
  projects: Record<string, { prefix?: string }>;
}

export async function componentGenerator(
  tree: Tree,
  schema: ComponentGeneratorSchema,
): Promise<void> {
  const project = readProjectConfiguration(tree, schema.project ?? 'web');
  const angularJson = joinPathFragments(project.root, 'angular.json');
  if (!tree.exists(angularJson)) {
    throw new Error(`${project.name ?? project.root} isn't an Angular app (no angular.json).`);
  }
  const prefix =
    Object.values(readJson<AngularJson>(tree, angularJson).projects).at(0)?.prefix ?? 'app';
  const { fileName, className } = names(schema.name);
  const directory = joinPathFragments(project.root, 'src/app', schema.directory ?? fileName);
  if (tree.exists(joinPathFragments(directory, `${fileName}.ts`))) {
    throw new Error(`${directory}/${fileName}.ts already exists.`);
  }

  generateFiles(tree, join(__dirname, 'files'), directory, {
    fileName,
    className,
    selector: `${prefix}-${fileName}`,
  });
  await formatFiles(tree);
}

export default componentGenerator;

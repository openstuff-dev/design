import { formatFiles, generateFiles, names, type Tree, writeJson } from '@nx/devkit';
import { join } from 'node:path';
import { gitRemote } from '../../utils/workspace';
import { SITE_CONFIG, writeSiteToolkit } from '../../utils/site';
import type { SiteGeneratorSchema } from './schema';

/**
 * The inner glyph of each project mark. Every OpenStuff mark is the same ring; the glyph inside
 * it, in the project's primary colour, says which project it is. The dot is OpenStuff's own,
 * the triangle OpenPurpose's and the rounded square OpenStuff Design's.
 */
export const GLYPHS = {
  diamond: 'M16 10.2L21.8 16L16 21.8L10.2 16Z',
  hexagon: 'M16 10.4L20.85 13.2V18.8L16 21.6L11.15 18.8V13.2Z',
  plus: 'M14.2 10.5h3.6v3.7h3.7v3.6h-3.7v3.7h-3.6v-3.7h-3.7v-3.6h3.7Z',
  half: 'M10.75 17.4a5.25 5.25 0 0 1 10.5 0Z',
  bars: 'M10.6 11h10.8v2.6H10.6ZM10.6 14.7h10.8v2.6H10.6ZM10.6 18.4h7v2.6h-7Z',
} as const;

export const RING =
  'M16 1.5a14.5 14.5 0 1 0 0 29a14.5 14.5 0 1 0 0-29Zm0 4a10.5 10.5 0 1 1 0 21a10.5 10.5 0 1 1 0-21Z';
export const OPENSTUFF_DOT = 'M10.75 16a5.25 5.25 0 1 0 10.5 0a5.25 5.25 0 1 0 -10.5 0Z';

/** "OpenLedger" → { open: "Open", rest: "Ledger" }, so the wordmark can weigh them differently. */
export function splitName(name: string): { open: string; rest: string } {
  const match = /^(Open)(.+)$/.exec(name);
  return match ? { open: match[1], rest: match[2] } : { open: '', rest: name };
}

export async function siteGenerator(tree: Tree, schema: SiteGeneratorSchema): Promise<void> {
  const root = schema.directory ?? 'site';
  if (tree.exists(`${root}/index.html`)) throw new Error(`${root}/index.html already exists.`);
  const primaryColor = schema.primaryColor ?? appColor(tree) ?? '#2d5bff';
  if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
    throw new Error(`primaryColor must be a hex colour like #2d5bff, not ${primaryColor}.`);
  }
  const slug = names(schema.name).fileName;
  const repository =
    schema.repository ?? gitRemote(tree.root)?.replace(/\.git$/, '') ??
    `https://github.com/openstuff-dev/${slug}`;
  const domain = schema.domain ?? `${slug.replace(/^open-?/, '')}.openstuff.dev`;
  const appUrl = schema.appUrl?.replace(/\/$/, '') ?? '';

  generateFiles(tree, join(__dirname, 'files'), root, {
    name: schema.name,
    ...splitName(schema.name),
    tagline: schema.tagline ?? 'Say what it does in one line.',
    slug,
    domain,
    repository,
    image: `ghcr.io/${repository.replace(/^https:\/\/github\.com\//, '').toLowerCase()}`,
    appUrl,
    primaryColor,
    glyph: GLYPHS[schema.glyph ?? 'diamond'],
    ring: RING,
    stuffDot: OPENSTUFF_DOT,
    // __dot__nojekyll → .nojekyll
    dot: '.',
  });
  writeJson(tree, `${root}/${SITE_CONFIG}`, { primaryColor });
  await writeSiteToolkit(tree, root, { primaryColor });

  if (!tree.exists('.github/workflows/pages.yml')) {
    generateFiles(tree, join(__dirname, 'workflow'), '.github/workflows', { root });
  }

  await formatFiles(tree);
}

/** The colour the project's web app is themed from, so the site matches it. */
function appColor(tree: Tree): string | undefined {
  for (const path of ['apps/web/tokens.config.json', 'tokens.config.json']) {
    const config = tree.read(path, 'utf8');
    if (config === null) continue;
    const { primaryColor } = JSON.parse(config) as { primaryColor?: unknown };
    if (typeof primaryColor === 'string') return primaryColor;
  }
  return undefined;
}

export default siteGenerator;

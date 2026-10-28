import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseColor } from '../lib/color.js';
import { generateTheme, type GenerateThemeOptions, type Theme } from '../lib/theme.js';
import { buildWithStyleDictionary, FILES } from './style-dictionary.js';

export { assertLightDark } from './style-dictionary.js';

/** What a project's `tokens.config.json` holds. */
export interface TokensConfig extends GenerateThemeOptions {
  /** Any CSS colour, e.g. `#2d5bff`. Everything else is generated from it. */
  primaryColor: string;
  /** Where the files go, relative to the config file. Defaults to `tokens`. */
  outDir?: string;
}

export const CONFIG_FILE = 'tokens.config.json';

export async function readConfig(path: string): Promise<TokensConfig> {
  let config: unknown;
  try {
    config = JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(`Couldn't read ${path}: ${(error as Error).message}`, { cause: error });
  }
  if (!hasPrimaryColor(config)) {
    throw new Error(`${path} needs a primaryColor, e.g. { "primaryColor": "#2d5bff" }.`);
  }
  parseColor(config.primaryColor);
  return config;
}

function hasPrimaryColor(config: unknown): config is TokensConfig {
  return typeof config === 'object' && config !== null && 'primaryColor' in config &&
    typeof config.primaryColor === 'string';
}

export interface BuildResult {
  theme: Theme;
  files: string[];
}

/**
 * Generates the theme and writes tokens.css, tokens.js, tokens.d.ts and tokens.json.
 *
 * @example await buildTokens(await readConfig('tokens.config.json'), 'src/styles/tokens')
 */
export async function buildTokens(config: TokensConfig, outDir: string): Promise<BuildResult> {
  const { primaryColor, outDir: _outDir, ...options } = config;
  const theme = generateTheme(primaryColor, options);
  await mkdir(outDir, { recursive: true });
  await buildWithStyleDictionary(theme, outDir);
  return { theme, files: FILES.map((file) => resolve(outDir, file)) };
}

/** Reads a config file and builds into its `outDir`. */
export async function buildFromConfig(configPath: string, outDir?: string): Promise<BuildResult> {
  const config = await readConfig(configPath);
  const target = outDir ?? resolve(dirname(configPath), config.outDir ?? 'tokens');
  return buildTokens(config, target);
}

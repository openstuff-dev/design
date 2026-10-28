#!/usr/bin/env node
import { relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { buildFromConfig, CONFIG_FILE } from './index.js';

const usage = `Usage: os-tokens [--config ${CONFIG_FILE}] [--out <dir>]

Builds tokens.css, tokens.js, tokens.d.ts and tokens.json from the primaryColor in the
config file. --out overrides the config's outDir (default: tokens, next to the config).`;

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      config: { type: 'string', short: 'c', default: CONFIG_FILE },
      out: { type: 'string', short: 'o' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log(usage);
    return;
  }
  const out = values.out === undefined ? undefined : resolve(values.out);
  const { theme, files } = await buildFromConfig(resolve(values.config), out);
  console.log(`Built tokens from ${theme.primary}:`);
  for (const file of files) console.log(`  ${relative(process.cwd(), file)}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

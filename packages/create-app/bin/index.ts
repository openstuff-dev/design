#!/usr/bin/env node

import { createRequire } from 'node:module';
import { sep } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { createWorkspace } from 'create-nx-workspace';

const packageManagers = ['pnpm', 'yarn', 'npm', 'bun'] as const;
type PackageManager = (typeof packageManagers)[number];

const stacks = [
  { value: 'web-server', label: 'Web app and server (Angular + Fastify, one Docker image)' },
  { value: 'web', label: 'Web app (Angular, served by nginx)' },
  { value: 'library', label: 'Package (TypeScript, published to npm)' },
] as const;

const usage = `Usage: npm create @openstuff-dev/app [name] [options]

Options:
  --stack <stack>          web-server (default), web or library
  --primary-color <hex>    the brand colour the theme is generated from (default #2d5bff)
  --openpurpose <org/slug> the OpenPurpose project, written to .openpurpose.json
  --pm <manager>           npm, pnpm, yarn or bun (default: the one running this)
  --yes, -y                don't ask; use the defaults for what isn't given
  --help, -h               show this help`;

/**
 * Mirrors `create-nx-workspace`: an explicit `--pm` wins, otherwise
 * the manager that invoked this CLI, otherwise npm. Choosing at run time keeps
 * the published CLI usable under whichever manager the consumer actually has
 * installed, rather than the one the plugin author generated it from.
 */
function determinePackageManager(explicit: string | undefined): PackageManager {
  if (explicit) {
    if (!(packageManagers as readonly string[]).includes(explicit)) {
      throw new Error(`Package manager must be one of ${packageManagers.join(', ')}`);
    }
    return explicit as PackageManager;
  }

  const userAgent = process.env.npm_config_user_agent;
  if (userAgent) {
    const invoked = packageManagers.find((pm) => userAgent.startsWith(`${pm}/`));
    if (invoked) {
      return invoked;
    }
  }

  const execPath = process.env.npm_execpath;
  if (execPath) {
    const segments = execPath.split(sep);
    const invoked = packageManagers.find((pm) => segments.includes(pm));
    if (invoked) {
      return invoked;
    }
  }

  return 'npm';
}

const NAME = /^[a-z][a-z0-9-]*$/;
const COLOR = /^#[0-9a-fA-F]{6}$/;

/** Asks until the answer passes `valid`; an empty answer takes the default. */
async function ask(
  rl: ReturnType<typeof createInterface>,
  question: string,
  fallback: string,
  valid: (answer: string) => boolean,
  hint: string,
): Promise<string> {
  for (;;) {
    const answer = (await rl.question(`${question}${fallback ? ` (${fallback})` : ''}: `)).trim();
    const value = answer || fallback;
    if (value && valid(value)) return value;
    console.log(`  ${hint}`);
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      stack: { type: 'string' },
      'primary-color': { type: 'string' },
      primaryColor: { type: 'string' },
      openpurpose: { type: 'string' },
      pm: { type: 'string' },
      packageManager: { type: 'string' },
      yes: { type: 'boolean', short: 'y' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log(usage);
    return;
  }

  let name = positionals.at(0);
  let stack = values.stack;
  let primaryColor = values['primary-color'] ?? values.primaryColor;

  if (!values.yes && process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      name ??= await ask(rl, 'Project name', '', (v) => NAME.test(v),
        'Use lowercase letters, digits and dashes, starting with a letter.');
      if (!stack) {
        console.log('What do you want to start with?');
        stacks.forEach((s, i) => {
          console.log(`  ${i + 1}. ${s.label}`);
        });
        const choice = await ask(rl, 'Choose 1–3', '1', (v) => /^[1-3]$/.test(v), 'Type 1, 2 or 3.');
        stack = stacks[Number(choice) - 1].value;
      }
      if (stack !== 'library') {
        primaryColor ??= await ask(rl, 'Primary colour', '#2d5bff', (v) => COLOR.test(v),
          'Give a hex colour such as #2d5bff.');
      }
    } finally {
      rl.close();
    }
  }

  if (!name) throw new Error(`Give the project a name.\n\n${usage}`);
  if (!NAME.test(name)) {
    throw new Error(`"${name}" isn't a valid name: use lowercase letters, digits and dashes.`);
  }
  stack ??= 'web-server';
  if (!stacks.some((s) => s.value === stack)) {
    throw new Error(`--stack must be one of ${stacks.map((s) => s.value).join(', ')}.`);
  }
  primaryColor ??= '#2d5bff';
  if (!COLOR.test(primaryColor)) {
    throw new Error(`--primary-color takes a hex colour such as #2d5bff, not "${primaryColor}".`);
  }

  // The preset version is our own dependency on it, which nx release moves whenever
  // @openstuff-dev/nx is released (and then releases create-app too), so it always exists.
  const { dependencies } = createRequire(import.meta.url)('../../package.json') as {
    dependencies: Record<string, string>;
  };
  const presetVersion = dependencies['@openstuff-dev/nx'];

  const options = {
    name,
    nxCloud: 'skip',
    packageManager: determinePackageManager(values.pm ?? values.packageManager),
    defaultBase: 'main',
    // Empty name and email: git's own settings are used.
    commit: { message: `Created ${name} with npm create @openstuff-dev/app`, name: '', email: '' },
    // It's our own preset, so create-nx-workspace needn't warn about a third-party one.
    trustThirdPartyPreset: true,
    // Passed through to the @openstuff-dev/nx preset. (Not `template`: that downloads one.)
    stack,
    primaryColor,
    ...(values.openpurpose && { openpurpose: values.openpurpose }),
  } as const;
  const { directory } = await createWorkspace(`@openstuff-dev/nx@${presetVersion}`, options);

  const start = stack === 'library' ? 'npx nx run-many -t build test' : 'npx nx serve web';
  console.log(`\nCreated ${directory}. Next:\n\n  cd ${name}\n  ${start}\n`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

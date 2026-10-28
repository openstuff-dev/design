import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TransformedToken } from 'style-dictionary/types';
import { cssProperties } from '../lib/css.js';
import { assertLightDark, buildFromConfig } from './index.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'os-tokens-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function build(config: object) {
  const path = join(dir, 'tokens.config.json');
  await writeFile(path, JSON.stringify(config));
  return buildFromConfig(path);
}

describe('buildFromConfig', () => {
  it('writes the same custom properties the runtime sets, in one :root block', async () => {
    const { theme, files } = await build({ primaryColor: '#3ecf8e' });
    expect(files.map((file) => file.slice(dir.length + 1))).toEqual([
      'tokens/tokens.css',
      'tokens/tokens.js',
      'tokens/tokens.d.ts',
      'tokens/tokens.json',
    ]);

    const css = await readFile(join(dir, 'tokens/tokens.css'), 'utf8');
    const written = Object.fromEntries(
      [...css.matchAll(/^ {2}(--os-[\w-]+): (.+);$/gm)].map(([, name, value]) => [name, value]),
    );
    expect(written).toEqual(cssProperties(theme));
    expect(css.match(/^:root \{/gm)).toHaveLength(1);
    expect(css).toContain('color-scheme: light dark;');
    expect(css).toContain(':root[data-theme=\'dark\'] {\n  color-scheme: dark;\n}');
    expect(css).not.toContain('prefers-color-scheme');
  });

  it('changes every brand token when the primary colour changes', async () => {
    const green = await build({ primaryColor: '#3ecf8e' });
    const red = await build({ primaryColor: '#e5484d', outDir: 'other' });
    for (const name of ['brand-default', 'brand-soft', 'brand-text', 'bg-default']) {
      expect(red.theme.colors[name]).not.toEqual(green.theme.colors[name]);
    }
    const css = await readFile(join(dir, 'other/tokens.css'), 'utf8');
    expect(css).toContain('from primaryColor #e5484d');
  });

  it('writes typed values and DTCG tokens', async () => {
    const { theme } = await build({ primaryColor: '#2d5bff' });
    const values = await import(join(dir, 'tokens/tokens.js')) as {
      properties: Record<string, string>;
      theme: { primary: string };
    };
    expect(values.theme.primary).toBe('#2d5bff');
    expect(values.properties).toEqual(cssProperties(theme));

    const types = await readFile(join(dir, 'tokens/tokens.d.ts'), 'utf8');
    expect(types).toContain('readonly \'--os-brand-default\': string;');

    const dtcg = JSON.parse(await readFile(join(dir, 'tokens/tokens.json'), 'utf8')) as {
      brand: { default: { $value: string } };
    };
    expect(dtcg.brand.default.$value).toBe(theme.colors['brand-default'].light);
  });

  it('asks for a primaryColor when it is missing', async () => {
    await expect(build({ primary: '#2d5bff' })).rejects.toThrow(/needs a primaryColor/);
  });
});

describe('assertLightDark', () => {
  const token = (name: string, $type: string, $value: string) =>
    ({ name, $type, $value, path: [name] }) as unknown as TransformedToken;

  it('accepts pairs, and shadows whose colours are all pairs', () => {
    expect(() => {
      assertLightDark([
        token('os-bg', 'color', 'light-dark(oklch(1 0 0), oklch(0 0 0))'),
        token('os-shadow', 'shadow', '0 1px 2px 0 light-dark(oklch(0 0 0 / 0.1), oklch(0 0 0 / 0.4))'),
        token('os-radius', 'dimension', '8px'),
      ]);
    }).not.toThrow();
  });

  it('fails on a colour or shadow colour that only has one scheme', () => {
    expect(() => {
      assertLightDark([
        token('os-bg', 'color', 'oklch(1 0 0)'),
        token('os-shadow', 'shadow', '0 1px 2px 0 rgb(0 0 0 / 0.1)'),
      ]);
    }).toThrow(/os-bg: oklch\(1 0 0\)\n {2}os-shadow: 0 1px 2px 0 rgb/);
  });
});

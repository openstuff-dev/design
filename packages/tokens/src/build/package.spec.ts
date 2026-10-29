import { readFileSync } from 'node:fs';

describe('package.json', () => {
  it('names the os-tokens command without a leading ./, which npm 12 drops when publishing', () => {
    const manifest = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { bin: Record<string, string> };
    expect(manifest.bin['os-tokens']).toBe('dist/build/cli.js');
  });
});

import { ESLint, type Linter } from 'eslint';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import angular from './angular.js';
import base from './index.js';

const fixtures = fileURLToPath(new URL('../../fixtures', import.meta.url));

async function lint(config: Linter.Config[], file: string, fix = false) {
  const eslint = new ESLint({
    cwd: fixtures,
    overrideConfigFile: true,
    overrideConfig: config,
    fix,
  });
  const [result] = await eslint.lintFiles([file]);
  return {
    rules: result.messages.map((m) => m.ruleId ?? m.message),
    output: result.output ?? (await readFile(`${fixtures}/${file}`, 'utf8')),
  };
}

describe('@openstuff-dev/lint/eslint', () => {
  it('accepts clean, typed code', async () => {
    expect((await lint(base, 'clean.ts')).rules).toEqual([]);
  });

  it('formats with ESLint Stylistic', async () => {
    const { rules, output } = await lint(base, 'double-quotes.ts', true);
    expect(rules).toEqual([]);
    expect(output).toBe("export const greeting = 'hello';\n");
  });

  it('keeps template literals and lets a blank string fall back with ||', async () => {
    expect((await lint(base, 'strings.ts')).rules).toEqual([]);
  });
});

describe('@openstuff-dev/lint/eslint/angular', () => {
  it('accepts an OnPush component with signal inputs and control flow', async () => {
    expect((await lint(angular, 'component-ok.ts')).rules).toEqual([]);
  });

  it('flags decorators, opting out of OnPush, old structural directives and button types', async () => {
    const { rules } = await lint(angular, 'component-bad.ts');
    expect(rules).toEqual(
      expect.arrayContaining([
        '@angular-eslint/prefer-on-push-component-change-detection',
        '@angular-eslint/prefer-signals',
        '@angular-eslint/template/prefer-control-flow',
        '@angular-eslint/template/button-has-type',
        '@openstuff-dev/format-inline-templates',
      ]),
    );
  });

  it('formats inline templates the way Prettier does', async () => {
    const { output } = await lint(angular, 'component-bad.ts', true);
    expect(output).toContain(`  template: \`<p *ngIf="name">Hello {{ name }}</p>
    <button (click)="name = ''">Clear</button>\`,`);
  });

  it('flags code that skips the sanitizer', async () => {
    const { rules } = await lint(angular, 'inner-html.ts');
    expect(rules.filter((r) => r === 'no-restricted-syntax')).toHaveLength(2);
  });
});

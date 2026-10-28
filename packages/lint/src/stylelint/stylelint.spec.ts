import stylelint from 'stylelint';
import config from './index.js';

async function rules(code: string, codeFilename = 'src/button.css') {
  const { results } = await stylelint.lint({ code, codeFilename, config });
  return results[0].warnings.map((w) => w.rule);
}

describe('@openstuff-dev/lint/stylelint', () => {
  it('accepts tokens and container queries', async () => {
    const css = `.card {
  color: var(--os-fg-default);
}

@container (width < 32rem) {
  .card {
    padding: 0;
  }
}
`;
    expect(await rules(css)).toEqual([]);
  });

  it('wants @import with a string, so package paths read plainly', async () => {
    expect(await rules('@import \'@openstuff-dev/ui/ui.css\';\n')).toEqual([]);
    expect(await rules('@import url(\'./reset.css\');\n')).toEqual(['import-notation']);
  });

  it('flags raw colours outside token files', async () => {
    const css = '.a {\n  color: #fff;\n  background: oklch(0.5 0.1 160);\n  border-color: red;\n}\n';
    expect((await rules(css)).sort()).toEqual([
      'color-named',
      'color-no-hex',
      'function-disallowed-list',
    ]);
    expect(await rules(css, 'src/tokens/theme.css')).toEqual([]);
  });

  it('flags prefers-color-scheme everywhere', async () => {
    const css = '@media (prefers-color-scheme: dark) {\n  .a {\n    margin: 0;\n  }\n}\n';
    expect(await rules(css)).toEqual(['media-feature-name-disallowed-list']);
    expect(await rules(css, 'src/app.layout.css')).toEqual(['media-feature-name-disallowed-list']);
  });

  it('allows viewport width queries only in layout files', async () => {
    const css = '@media (width < 48rem) {\n  .a {\n    margin: 0;\n  }\n}\n';
    expect(await rules(css)).toEqual(['media-feature-name-disallowed-list']);
    expect(await rules(css, 'src/app.layout.css')).toEqual([]);
  });

  it('formats with Stylistic', async () => {
    expect(await rules('.a{color:var(--x)}\n')).toContain('@stylistic/block-opening-brace-space-before');
  });
});

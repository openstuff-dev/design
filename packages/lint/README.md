# @openstuff-dev/lint

One lint and format setup for every OpenStuff project.

- **ESLint** with strict, type-checked TypeScript and **ESLint Stylistic** for formatting.
- **Angular** rules: signal inputs and outputs, `inject()`, standalone components, built-in control flow, accessible templates, and no way around the sanitizer without a comment saying why.
- **Nx** module boundaries: `type:package` projects never import `type:app` projects.
- **Stylelint** with the standard rules and Stylistic formatting, plus:
  - no raw colours (`#fff`, `rgb()`, `oklch()`, `red`) outside token files. Use `var(--os-…)`.
  - no `@media (prefers-color-scheme)`. Themes come from `light-dark()` in the tokens.
  - viewport width queries only in layout files. Components use `@container`.
  - `@import` with a plain string: `@import '@openstuff-dev/ui/ui.css';`.
- **Prettier** for Angular templates only. Inline templates are formatted by an ESLint rule, so `eslint --fix` formats everything.

## Use it

```sh
npm i -D @openstuff-dev/lint eslint typescript
npm i -D prettier   # Angular projects
npm i -D stylelint  # projects with CSS
```

```js
// eslint.config.js
export { default } from '@openstuff-dev/lint/eslint';
// or, in an Angular project:
export { default } from '@openstuff-dev/lint/eslint/angular';
```

```js
// stylelint.config.js
export default { extends: ['@openstuff-dev/lint/stylelint'] };
```

```json
// package.json
{ "prettier": "@openstuff-dev/lint/prettier" }
```

Add your own rules after the shared ones:

```js
import openstuff from '@openstuff-dev/lint/eslint/angular';

export default [...openstuff, { rules: { '@typescript-eslint/no-explicit-any': 'warn' } }];
```

## Which files are which

| Files | Allowed |
|---|---|
| `**/tokens/**/*.css`, `**/*.tokens.css` | Raw colours |
| `**/layout/**/*.css`, `**/*.layout.css` | Viewport width queries (`@media (width < 48rem)`) |

`.scss` works the same way.

## Formatting

ESLint formats code, Stylelint formats CSS and Prettier formats templates. So editors don't fight, keep Prettier off everything else with a `.prettierignore`:

```
*
!*/
!*.html
```

and let ESLint and Stylelint fix on save (see `.vscode/settings.json` in this repository).

## Development

`nx build lint`, `nx test lint`. The tests lint the files in `fixtures/`, which break the rules on purpose.

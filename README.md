# OpenStuff design

The shared toolkit for every [OpenStuff](https://github.com/openstuff-dev) project: one look, one lint setup and one way to start a new project.

| Package | What it is |
|---|---|
| [`@openstuff-dev/tokens`](packages/tokens) | Design tokens. One `primaryColor` in, a full light and dark theme out (`light-dark()` CSS, TypeScript, DTCG JSON). |
| [`@openstuff-dev/ui`](packages/ui) | The framework-neutral CSS core: base styles, components, native `<dialog>` and popover patterns, container queries. Angular and React wrappers build on it. |
| [`@openstuff-dev/ui-angular`](packages/ui-angular) | Angular components on top of the CSS core. |
| [`@openstuff-dev/lint`](packages/lint) | Shared ESLint (with ESLint Stylistic) and Stylelint configs. |
| [`@openstuff-dev/nx`](packages/nx) | Nx preset and generators for OpenStuff workspaces. |
| [`@openstuff-dev/create-app`](packages/create-app) | `npm create @openstuff-dev/app my-app`: a new project with all of the above set up. |

The [docs site](https://openstuff-dev.github.io/design/) ([`apps/docs`](apps/docs)) shows every component in light and dark, themed from a colour you pick, with its Angular and HTML code. Run it locally with `npx nx serve docs`.


## Work on it

```sh
npm ci
npx nx run-many -t build typecheck test   # everything
npx nx affected -t build typecheck test   # only what your branch changed
npx nx graph                              # how the packages depend on each other
```

Try packages locally before publishing with the bundled registry: `npx nx local-registry`, then `npx nx release publish --registry http://localhost:4873`.

## Release

Every change to a package needs a version plan, which CI checks on pull requests:

```sh
npx nx release plan     # pick the bump and write one sentence for the changelog
```

Merge it, then run the **Release** workflow on GitHub (it starts as a dry run). It bumps versions, writes changelogs and GitHub releases, tags `<package>@<version>` and publishes to npm with provenance. It needs an `NPM_TOKEN` secret.

## License

MIT

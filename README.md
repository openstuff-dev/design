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

The [docs site](https://design.openstuff.dev) ([`apps/docs`](apps/docs)) shows every component in light and dark, themed from a colour you pick, with its Angular and HTML code. Run it locally with `npx nx serve docs`.


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

Merge it, then run the **Release** workflow on GitHub (it starts as a dry run). With a stage-only `NPM_TOKEN` secret, the workflow bumps versions, writes changelogs and GitHub releases, tags `<package>@<version>`, and runs `tools/stage-publish.sh` (`npm stage publish` with provenance).

Nothing is public on npm until a maintainer approves each staged package with 2FA (needs **npm 12+** and **Node ≥ 22.22.2**, or approve on npmjs.com). Approve base packages (`@openstuff-dev/tokens`, `@openstuff-dev/ui`, `@openstuff-dev/lint`) before the packages that depend on them (`@openstuff-dev/ui-angular`, `@openstuff-dev/nx`, `@openstuff-dev/create-app`):

```sh
npm stage list
npm stage approve <stage-id>
```

Because `nx release` creates the GitHub releases and `<package>@<version>` tags before 2FA approval, if you reject a staged package, delete its GitHub release and `<package>@<version>` tag by hand.

## License

MIT

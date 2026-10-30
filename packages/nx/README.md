# @openstuff-dev/nx

Nx generators for OpenStuff projects. New projects start with
[`npm create @openstuff-dev/app`](../create-app), which runs the `preset` generator here.

| Generator | What it adds |
|---|---|
| `app [name]` | An Angular web app in `apps/<name>` (default `web`), with tokens, ui, ui-angular and lint wired up. `--primaryColor`, `--prefix`, `--server <project>` sends `/api` to a server in development. |
| `server [name]` | A Fastify + TypeScript API in `apps/<name>` (default `server`): a health check, settings from environment variables, a Vitest test. |
| `library <name>` | A publishable TypeScript package in `packages/<name>`, built with `tsc`, with `publishConfig`, `license` and `repository` set. |
| `component <name>` | A standalone, OnPush Angular component with a signal input, in the app's `src/app`. `--project` (default `web`). |
| `site <name>` | The project's one-page marketing site in `site/`, for GitHub Pages: the same sections, bento grid and hover animations as every other OpenStuff page, themed from the app's primary colour, with a Pages workflow. `--tagline`, `--domain`, `--appUrl` (without one, the buttons point to self-hosting), `--glyph` for the mark. Its README is the brief for writing the copy. |
| `sync` | Brings a workspace up to date: adds the shared files it lacks, refreshes the OpenPurpose part of `AGENTS.md`, merges `nx.json` and `package.json` defaults and moves toolkit packages to their newest versions, and refreshes the toolkit copy in every marketing site. Files you changed are listed, not overwritten. |

```sh
npx nx g @openstuff-dev/nx:library money
npx nx g @openstuff-dev/nx:component invoice-list
npx nx g @openstuff-dev/nx:site OpenLedger --appUrl=https://ledger.openstuff.app
npx nx g @openstuff-dev/nx:sync
```

Every workspace also gets the `ux-details` skill (`.claude/skills/ux-details/SKILL.md`): 20 UX
details, from skeleton loaders to idempotency keys, that an agent checks a new app against and
builds where they fit. `sync` adds it to older workspaces.

The toolkit packages are versioned independently, so the generators ask the registry
(`npm view`) for each one's newest version, and use this plugin's version when it can't be reached.

## Try it locally

```sh
npx nx local-registry                 # Verdaccio on :4873, in another terminal
npx nx run-many -t build
# publish every package to http://localhost:4873 (ui-angular from dist/packages/ui-angular), then:
npm_config_registry=http://localhost:4873 npm create @openstuff-dev/app@<version> demo -- --yes
```

The Angular CLI needs Node 22.22.3 or newer.

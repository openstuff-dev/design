# @openstuff-dev/create-app

Starts a new OpenStuff project in one command.

```sh
npm create @openstuff-dev/app my-app
cd my-app
npx nx serve web
```

It asks for a name, what to start with and a primary colour. To skip the questions:

```sh
npm create @openstuff-dev/app my-app -- --yes --stack web --primary-color '#e5484d'
```

| Option | What it does |
|---|---|
| `--stack` | `web-server` (default): an Angular app and a Fastify API in one Docker image. `web`: the Angular app, served by nginx. `library`: a TypeScript package to publish. |
| `--primary-color` | The brand colour every other colour, light and dark, is generated from. Default `#2d5bff`. |
| `--openpurpose` | The OpenPurpose project (`org/slug`) this repository belongs to. Writes `.openpurpose.json`. |
| `--pm` | `npm`, `pnpm`, `yarn` or `bun`. Default: the one you ran it with. |
| `--yes` | Don't ask; use the defaults. |

Every project gets `@openstuff-dev/ui`, `tokens` and `lint`, CI that runs
`nx affected -t lint stylelint typecheck test build`, a Dockerfile and `docker-compose.yml`
(not for a package), `.env.example`, the MIT licence, a README, and `AGENTS.md` / `CLAUDE.md`
with the OpenPurpose instructions for coding agents. The work is done by the
[`@openstuff-dev/nx`](../nx) preset.

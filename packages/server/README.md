# @openstuff-dev/server

Server building blocks shared by OpenStuff apps, so each app doesn't keep its own copy.

- **`safeFetch`**: fetches a URL someone typed in an admin page without letting the server reach
  its own network. Internal addresses (loopback, private ranges, the cloud metadata address) are
  refused by default. Each address a name resolves to is checked when the connection is made, which
  also stops DNS rebinding. Redirects are not followed.
- **Integration routes**: the server-admin routes for OpenVersion and OpenAnnounce connections, with
  the checks they run (below).
- **`vaultFor` and `loadVault`**: encrypts integration keys with AES-256-GCM. Each seal uses a fresh
  IV. Without a configured secret, one is made on first start and kept in the database, with a
  warning, because a database dump alone could then reveal the keys.

## Use it

```sh
npm i @openstuff-dev/server
```

```ts
import { loadVault, safeFetch } from '@openstuff-dev/server';

const vault = await loadVault(pool, {
  secret: config.secretKey,
  envName: 'OPENRELAY_SECRET_KEY',
  log,
});
const sealed = vault.seal(token);

const policy = { mode: config.fetch, allow: config.fetchAllow, envPrefix: 'OPENRELAY' };
const { status, body } = await safeFetch('https://example.com/api', policy, { timeout: 5_000 });
```

`envPrefix` only shapes the refusal message, which names the setting an admin should change, such
as `OPENRELAY_FETCH=private`.

## Integration routes

`registerIntegrationRoutes` adds the server-admin routes for a server-wide connection to OpenVersion
or OpenAnnounce, and `GET /api/client-config` for the web app's public values:

- `GET /api/admin/integrations` lists each connection, with its status.
- `PUT /api/admin/integrations/:kind` saves a connection, then tests it. The save happens even when
  the test fails, so a fix can follow. Its secrets (`signingSecret` for OpenAnnounce, `deployToken`
  for OpenVersion) are encrypted, never returned, and kept when a later save leaves them out. The
  card says whether one is stored (`hasSigningSecret`, `hasDeployToken`).
- `POST /api/admin/integrations/:kind/test` tests the values sent, or the saved connection.
- `DELETE /api/admin/integrations/:kind` disconnects. The routes refuse all of these when the
  environment sets the connection (409), and the card then reads "Set by the server's configuration".

```ts
import { openAnnounce, openVersion, registerIntegrationRoutes, serverIntegrationsSql } from '@openstuff-dev/server';

// In a migration: run serverIntegrationsSql once.
registerIntegrationRoutes(app, {
  db: pool,
  vault: () => vault,                       // from loadVault
  policy,                                   // from your FETCH settings
  origin: publicOrigin,                     // this server's address, sent to the other system
  appName: 'OpenUsecase',
  offers: [
    { kind: openVersion, signingSecret: false, deployToken: true, environment: envOpenVersion, envPrefix: 'OPENUSECASE_OPENVERSION' },
  ],
  isServerAdmin: (request) => requireAccount(request).isServerAdmin,
});
```

With a deploy token, OpenVersion's check also reads the live release, so a token that can't publish
is caught when it's saved.

### Aiming OpenAnnounce messages

Pass `announceUser` and the routes add `GET /api/openannounce-token`. It signs who is signed in
with the saved OpenAnnounce secret, so the browser can't claim another group. `sub` is an opaque
member id, never an email or a name. `announceGroups(tenant, role)` gives `t-acme`, `role-courier`
and `t-acme-role-courier`, so a message can reach one tenant, one role, or one role in one tenant.
Without a secret it answers 204, and people see only what's for everyone. Signed out: 401.

```ts
registerIntegrationRoutes(app, {
  // …as above, with the openAnnounce offer
  announceUser: (request) => {
    const member = currentMember(request); // null when signed out
    return member && { sub: member.id, groups: announceGroups(member.tenant, member.role) };
  },
});
```

The web app fetches it again when someone switches tenant.

## Publish this server's version on start

`publishVersionOnStart` publishes the image's version to OpenVersion once the server listens, with
the connection's deploy token (the environment's first, then the saved one). Self-hosters then need
no CI step: pull a new image, restart, and open tabs learn about it. It never blocks or fails
startup. A version of `unknown` (a local build) is skipped. The key `<app>-<version>` makes replicas
starting together publish once, and OpenVersion refuses a version that isn't newer than the live
one, so an older image never rolls anything back.

```ts
publishVersionOnStart(app, {
  db: pool,
  vault: () => vault,
  offer: openVersionOffer,                  // the same offer given to registerIntegrationRoutes
  policy,
  appName: 'OpenRelay',
  version: config.appVersion,               // from the image's VERSION build arg
});
```

## Test an app's connections

`@openstuff-dev/server/testing` starts stand-ins for OpenVersion and OpenAnnounce on a local port.
They answer this package's checks and publish as the real ones do: an unknown key or deploy token
answers 401, an origin not in `allowedOrigins` 403. An app's tests then prove its own wiring (its
routes, its config, its export) in a few lines, without copying a fake server. Give the test config
`fetch: 'private'` so the guarded fetch reaches `127.0.0.1`.

```ts
import { standInOpenVersion } from '@openstuff-dev/server/testing';

const ov = await standInOpenVersion({ publicKey: 'pk_app_1234', deployToken: 'ov_deploy_1234' });
// PUT /api/admin/integrations/openversion with makeConnectionString('openversion', { url: ov.url, … })
// ov.requests lists what the app sent; publishStatus: 409 answers a publish as "not newer".
await ov.close();
```

## Upgrading from 0.2.0

0.3.0 reads a `deploy_token_encrypted` column. Run `serverIntegrationsDeployTokenSql` in a new
migration before you upgrade; a new table made with `serverIntegrationsSql` has it already.

`resolveConnection` returns a connection the app uses (the environment's values first, then the
saved one with its secret opened). The table is server-wide: keep it outside tenant row-level
security, and export nothing from it. The routes leave `Idempotency-Key` to the app's own middleware.

## Scope

This package holds the guarded fetch, encrypted storage and the server-wide integration routes.
Sign-in, tenancy and database helpers are planned separately.

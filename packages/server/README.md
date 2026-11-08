# @openstuff-dev/server

Server building blocks shared by OpenStuff apps, so each app doesn't keep its own copy.

- **`safeFetch`**: fetches a URL someone typed in an admin page without letting the server reach
  its own network. Internal addresses (loopback, private ranges, the cloud metadata address) are
  refused by default. Each address a name resolves to is checked when the connection is made, which
  also stops DNS rebinding. Redirects are not followed.
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

## Scope

This package holds only what is shared so far: the guarded fetch and encrypted storage. Sign-in,
tenancy and database helpers are planned separately.

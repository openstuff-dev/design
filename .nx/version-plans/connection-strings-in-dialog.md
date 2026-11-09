---
server: minor
ui-angular: patch
---

Connection strings can now hold an OpenAnnounce publish key, and `@openstuff-dev/server/connection-string` reads and makes them in the browser too. `SecretDialog` takes an optional `connection` and shows that string under the secret, with its own copy button.

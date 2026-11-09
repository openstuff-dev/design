---
server: patch
---

Saved connection secrets are reused only for the address they were saved for, so changing a connection's address never sends them to the new one. A saved secret the current key can't open now answers 400 and asks to be entered again, instead of failing with a server error.

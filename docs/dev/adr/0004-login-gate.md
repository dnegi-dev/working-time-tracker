# ADR 0004 — Client-side login gate

**Decision:** the GitHub Pages build shows a login screen and compares SHA-256(`user:pass`) with `VITE_LOGIN_HASH` (default `admin:admin`). The iOS app skips it.

**Honest limits:** this is not security. The bundle is public, and with default credentials published, the site is arguably still publicly accessible. Whether this avoids an Impressum obligation (§ 5 DDG) is **not verified and not legal advice**. Set the repository secret `LOGIN_HASH` to a hash of your own credentials:
`printf 'me:secret' | sha256sum`.
No personal data leaves the device either way.

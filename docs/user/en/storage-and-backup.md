# Storage, backup & restore

**Goal:** control where your data lives and never lose it.

## Where data is stored

**Settings → Data → Storage:**

- **This device** (default) — browser storage / app storage.
- **Files – one per month / per year / one file** — JSON files in a folder. iOS app: _Files → On My iPhone → Working Time → WorkingTime_. Desktop Chrome/Edge: you choose a folder. Not available in Safari.

A copy is always kept in device storage as cache. The web app and the iOS app have separate data — move data with backup/restore.

## Backup

**Settings → Data → Create backup** saves one complete JSON file (with checksum).

## Restore

**Restore…** → choose the file → check the preview → **Replace my data** or **Merge** (adds entries by id, keeps your settings). Damaged or foreign files are rejected.

Backups are for restoring. For reports use [Export](export.md).

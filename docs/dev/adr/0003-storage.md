# ADR 0003 — Storage

**Decision:** `Repository` port with whole-dataset `load/save`. Adapters: localStorage (key per month), files (per month/year/single, JSON) mirrored into localStorage. A database adapter is only a stub.

**Why:** personal data volume is small; partitioning keeps files readable and diffs small. **Backup** (full JSON + checksum) and **Export** (reports, one-way) are deliberately separate features.

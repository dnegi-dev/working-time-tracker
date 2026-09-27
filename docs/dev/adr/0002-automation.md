# ADR 0002 — Automation through one command registry

**Decision:** NFC, QR, geofence and Shortcuts call URL commands (`wtt://cmd?…`, `#/do/cmd?…`). The same registry backs a `GET /api/v1/cmd` bridge in the service worker and a generated OpenAPI spec with Swagger UI.

**Why:** iOS Shortcuts "Personal Automations" provide NFC and location triggers without native code. One registry = one place to change. Commands are GET so they work as plain links. Duplicate automated triggers within 60 s are ignored.

**Limits:** the SW bridge needs an open app tab, because data lives in page storage.

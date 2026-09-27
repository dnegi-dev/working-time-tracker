# Command API (Swagger)

**Goal:** see and try every automation command.

1. Open the app and log in (keep the tab open).
2. **Settings → Automation → Command API (Swagger)** opens `…/api.html`.
3. Pick a command → **Execute**. The call runs in your open app tab; the app updates immediately.

Every command exists in three forms:

| Where          | Form                                                  |
| -------------- | ----------------------------------------------------- |
| iOS app        | `wtt://toggle?place=HQ`                               |
| Web / PWA      | `https://…/working-time-tracker/#/do/toggle?place=HQ` |
| HTTP (browser) | `GET …/working-time-tracker/api/v1/toggle?place=HQ`   |

Without an open app tab, the API answers **503**. Optional `source=nfc|qr|geofence|shortcut` records what triggered the command. The spec is at `api/openapi.json`.

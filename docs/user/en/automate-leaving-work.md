# Clock out when leaving work

**Goal:** tracking stops (or starts) automatically based on your location.

1. Shortcuts → **Automation** → **+** → **Leave** → choose your workplace address.
2. Action **Open URLs** → `wtt://clock-out?source=geofence`.
3. Optionally a second automation **Arrive** → `wtt://clock-in?place=HQ&source=geofence`.

**Result:** tracking stops when you leave. iOS may ask for confirmation for location automations depending on the version (nicht geprüft). `clock-in`/`clock-out` never double-count: they do nothing if already in that state.

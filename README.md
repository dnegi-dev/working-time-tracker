# Working Time Tracker

Minimal app to track daily working hours, projects, the office/home-office quota and notes. It runs as a PWA (GitHub Pages) and as an iOS app (Capacitor), works offline, and keeps data on your device.

- **User guide:** [English](docs/user/en/README.md) · [Deutsch](docs/user/de/README.md)
- **Architecture & recipes:** [docs/dev/ARCHITECTURE.md](docs/dev/ARCHITECTURE.md) · [iOS build](docs/dev/ios.md) · [ADRs](docs/dev/adr)
- **AI contributor rules:** [CLAUDE.md](CLAUDE.md) · [Claude workflow](docs/dev/claude-workflow.md)

```sh
npm ci
npm run dev      # http://localhost:5173/working-time-tracker/  (admin / admin)
npm run check    # lint, types, layers, i18n, unit tests
npm run e2e      # Playwright end-to-end
```

Public holidays: [OpenHolidays API](https://www.openholidaysapi.org), fetched at build time.

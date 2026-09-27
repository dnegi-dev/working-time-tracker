# ADR 0001 — Svelte 5 + Vite + Capacitor

**Decision:** single web codebase (Svelte 5, TypeScript strict, Vite) shipped as PWA (GitHub Pages) and as iOS app via Capacitor.

**Why:** least code per feature (small AI context), everything testable with Playwright on Linux, a native shell only where iOS needs it (URL scheme, Files). **Trade-off:** no native background location; automation relies on iOS Shortcuts (see ADR 0002). React Native/Expo was rejected because iOS e2e cannot run in Linux CI.

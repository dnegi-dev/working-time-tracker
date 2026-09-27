# Automate with NFC tags and QR codes

**Goal:** clock in/out or switch project with one tap of the phone.

## 1. Build the link

**Settings → Automation → Link & QR builder**: choose command (`toggle`, `clock-in`, `clock-out`, `switch-project`, `switch-place`), project/place and trigger. Copy the **iOS app link** (`wtt://…`) or **Web link**.

## 2a. NFC tag (iPhone, Shortcuts app)

1. Shortcuts → **Automation** → **+** → **NFC** → scan your tag (e.g. on the office desk).
2. Action **Open URLs** → paste the link, e.g. `wtt://toggle?place=HQ%20%2F%203.14&source=nfc`.
3. Set **Run immediately** (option name depends on iOS version — nicht geprüft).

## 2b. QR code

Print the QR code from the builder. Scanning it with the Camera opens the link.

## Good to know

- `toggle` ignores a second scan within 60 s, so double taps do not stop you again.
- Links name projects and places by **name** (case-insensitive) or id.
- Links need the **iOS app** for `wtt://`. Web links open Safari, which has separate data from a home-screen web app (nicht geprüft). If you use the web app, set **Open links in → Installed app** only when the native app is installed.

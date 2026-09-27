# iOS build (Capacitor)

Needs a Mac with Xcode. Linux CI cannot build iOS.

```sh
npm ci
BASE_PATH=./ npm run build
npx cap add ios          # first time only, creates ios/
npx cap sync ios
npx cap open ios
```

After `cap add ios`, one-time native settings in Xcode (commit the `ios/` folder afterwards):

1. **URL scheme:** Target → Info → URL Types → `+` → URL Schemes: `wtt`. Deep links `wtt://…` now open the app (handled in `src/wiring/deeplinks.ts`).
2. **Files app access:** Info.plist `UIFileSharingEnabled` = YES and `LSSupportsOpeningDocumentsInPlace` = YES, so file storage and exports appear under _On My iPhone_.
3. **App icon:** use `resources/icon-1024.png`.

Universal links (`https://…` opening the app) need an `apple-app-site-association` file at the domain root, which a GitHub project page cannot serve. It needs a custom domain (not set up yet).

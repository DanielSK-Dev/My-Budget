# Shipping My Budget to the Google Play Store

The app is packaged with [Capacitor](https://capacitorjs.com): the web app in
`index.html` runs inside a native Android WebView. The native project lives in
`android/` and is ready to open in Android Studio.

App ID: `com.danielsk.mybudget` · App name: **My Budget**

## One-time setup (your computer)

1. Install [Android Studio](https://developer.android.com/studio) (includes the Android SDK).
2. Install [Node.js](https://nodejs.org) (v18+).
3. Clone this repo and run `npm install`.

## Two-track workflow

**Track 1 — daily development (instant updates, no builds).** Keep using the
PWA from GitHub Pages on your phone. The service worker is network-first, so
every push to `main` shows up the next time you open/reload the app. Nothing
to build, nothing to install.

**Track 2 — Play Store releases (semi-frequent, one command).** When you want
the Play version to catch up:

```bash
npm run release
```

That script automatically:
1. reads `APP_VERSION` from `index.html` → android `versionName`
2. bumps the android `versionCode` (Play requires +1 every upload)
3. syncs the web app into the native project
4. builds the signed `.aab` with gradle

Then drag `android/app/build/outputs/bundle/release/app-release.aab` into the
Play Console (Production → Create new release) and commit the version bump it
made to `android/app/version.properties`.

To test the *native* app on a device/emulator during development:

```bash
npm run sync && npm run open:android   # then ▶ in Android Studio
```

## One-time signing setup

Google Play requires the bundle to be signed with your upload key.

1. Create the keystore (once — keep it safe, e.g. in a password manager):

```bash
keytool -genkey -v -keystore my-budget-upload.keystore \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

2. Copy `keystore.properties.example` to `keystore.properties` and fill in
   the passwords. Both the keystore and `keystore.properties` are gitignored —
   **never commit them**. The gradle build picks them up automatically, so
   `npm run release` produces an upload-ready signed bundle.

## Play Console (first release only)

1. Create a developer account at https://play.google.com/console ($25 one-time).
2. **Create app** → fill in name, free/paid, declarations.
3. Complete the required sections: privacy policy URL, data-safety form
   (the app stores everything locally — no data collected/shared), content
   rating questionnaire, target audience.
4. Upload the `.aab` under **Production → Create new release** (or start with
   Internal testing to try it from the Play Store privately first).
5. Submit for review. First review typically takes a few days.

## Notes specific to this app

- **Data lives on-device**: state is in `localStorage` inside the app's
  WebView, which persists across app updates. Uninstalling the app deletes the
  data — the Settings tab's export/backup is the user's safety net. (A future
  improvement: migrate storage to `@capacitor/preferences` for extra
  robustness.)
- **Icons & splash**: generated from `assets/icon.png` (1024×1024) and
  `assets/splash*.png` into `android/app/src/main/res/`. To regenerate after
  changing the icon: `npx @capacitor/assets generate --android`.
- **The PWA still works**: the root `index.html` / `manifest.json` / `sw.js`
  remain usable on GitHub Pages exactly as before. `www/` is just a synced
  copy for the native build.

## iOS later

The same project supports iOS, but Apple builds require a Mac with Xcode:

```bash
npm install @capacitor/ios
npx cap add ios
npm run sync
npx cap open ios
```

Then archive/upload via Xcode. You'll also need an Apple Developer account
($99/year). Everything else (the web app, www/, capacitor.config.json) is
already shared between the two platforms.

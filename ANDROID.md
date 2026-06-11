# Shipping My Budget to the Google Play Store

The app is packaged with [Capacitor](https://capacitorjs.com): the web app in
`index.html` runs inside a native Android WebView. The native project lives in
`android/` and is ready to open in Android Studio.

App ID: `com.danielsk.mybudget` · App name: **My Budget**

## One-time setup (your computer)

1. Install [Android Studio](https://developer.android.com/studio) (includes the Android SDK).
2. Install [Node.js](https://nodejs.org) (v18+).
3. Clone this repo and run `npm install`.

## Day-to-day workflow

All app development still happens in the root `index.html` — nothing about
that workflow changes. When you want to update the Android app:

```bash
npm run sync          # copies index.html etc. into www/ and into the android project
npm run open:android  # opens the project in Android Studio
```

Then run on a device/emulator with the ▶ button, or build a release (below).

## Building the release bundle (.aab) for Play

Google Play requires an **Android App Bundle (.aab)** signed with your upload key.

### 1. Create your upload keystore (once — keep it safe!)

```bash
keytool -genkey -v -keystore my-budget-upload.keystore \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore file and its passwords somewhere safe (password manager).
**Do not commit it** — `.gitignore` already excludes `*.keystore`.

### 2. Bump the version

In `android/app/build.gradle` increase both values for every Play upload:

```gradle
versionCode 2          // integer, must increase every upload
versionName "1.13.0"   // human-readable, match APP_VERSION in index.html
```

### 3. Build

In Android Studio: **Build → Generate Signed App Bundle / APK → Android App Bundle**,
pick your keystore, choose *release*. The bundle lands in
`android/app/release/app-release.aab`.

(Command line alternative: `cd android && ./gradlew bundleRelease`, then sign
with the keystore via the signing config or `jarsigner`.)

### 4. Play Console

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

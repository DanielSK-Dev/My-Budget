// One-command Play Store release build:
//   npm run release
//
// 1. Reads APP_VERSION from index.html → android versionName
// 2. Bumps the android versionCode (Play requires it to increase every upload)
// 3. Copies the web app into www/ and syncs the native project
// 4. Builds the signed release bundle (.aab) via gradle
//
// Requires on your machine: Android SDK (Android Studio) and keystore.properties
// in the repo root pointing at your upload keystore (see ANDROID.md).
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const run = (cmd, cwd) => execSync(cmd, { cwd: cwd || root, stdio: 'inherit' });

// 1. App version from index.html
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const verMatch = html.match(/APP_VERSION\s*=\s*'([^']+)'/);
if (!verMatch) { console.error('Could not find APP_VERSION in index.html'); process.exit(1); }
const versionName = verMatch[1];

// 2. Bump versionCode
const vpPath = path.join(root, 'android', 'app', 'version.properties');
const vp = fs.readFileSync(vpPath, 'utf8');
const code = parseInt(vp.match(/VERSION_CODE=(\d+)/)[1], 10) + 1;
fs.writeFileSync(vpPath, `VERSION_CODE=${code}\nVERSION_NAME=${versionName}\n`);
console.log(`\nRelease ${versionName} (versionCode ${code})\n`);

// 3. Sync web app into the native project
run('node scripts/copy-www.js');
run('npx cap sync android');

// 4. Build the bundle
if (!fs.existsSync(path.join(root, 'keystore.properties'))) {
  console.warn('\n⚠ keystore.properties not found — the bundle will be UNSIGNED');
  console.warn('  and Google Play will reject it. See ANDROID.md → signing.\n');
}
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
run(`${gradlew} bundleRelease`, path.join(root, 'android'));

const aab = path.join('android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
console.log(`\n✅ Done: ${aab}`);
console.log('Upload it at https://play.google.com/console → your app → Production → Create new release');
console.log(`Don't forget to commit the version bump: git add android/app/version.properties && git commit -m "Release ${versionName} (${code})"`);

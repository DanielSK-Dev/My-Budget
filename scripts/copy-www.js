// Copies the root web app into www/ (the Capacitor webDir) and makes the
// manifest paths relative so they work inside the native WebView.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const www  = path.join(root, 'www');

fs.mkdirSync(www, { recursive: true });
for (const f of ['index.html', 'sw.js', 'icon.png']) {
  fs.copyFileSync(path.join(root, f), path.join(www, f));
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
manifest.start_url = './';
manifest.scope = './';
fs.writeFileSync(path.join(www, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log('Copied web app into www/');

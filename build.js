const fs   = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const ID           = (process.env.STRAVA_CLIENT_ID     || '').replace(/\n/g, '').trim();
const SECRET       = (process.env.STRAVA_CLIENT_SECRET || '').replace(/\n/g, '').trim();
const SUPA_URL     = (process.env.SUPABASE_URL          || '').replace(/\n/g, '').trim();
const SUPA_KEY     = (process.env.SUPABASE_ANON_KEY     || '').replace(/\n/g, '').trim();

function injectIndexHtml() {
  let content = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  content = content.replace(/__STRAVA_CLIENT_ID__/g,     ID);
  content = content.replace(/__STRAVA_CLIENT_SECRET__/g, SECRET);
  content = content.replace(/__STRAVA_ACCESS_TOKEN__/g,  '');
  content = content.replace(/__STRAVA_REFRESH_TOKEN__/g, '');
  content = content.replace(/__SUPABASE_URL__/g,         SUPA_URL);
  content = content.replace(/__SUPABASE_KEY__/g,         SUPA_KEY);
  return content;
}

function injectCallbackHtml() {
  let content = fs.readFileSync(path.join(__dirname, 'callback.html'), 'utf8');
  content = content.replace(/const CLIENT_ID\s*=\s*'.*?';/g, `const CLIENT_ID     = '${ID}';`);
  content = content.replace(/const CLIENT_SECRET\s*=\s*'.*?';/g, `const CLIENT_SECRET = '${SECRET}';`);
  return content;
}

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'),    injectIndexHtml());
fs.writeFileSync(path.join(__dirname, 'dist', 'callback.html'), injectCallbackHtml());

// copy static PWA files
['manifest.json', 'sw.js', 'icon.svg'].forEach(f => {
  const src = path.join(__dirname, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(__dirname, 'dist', f));
});

// copy css/ and js/ folders
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(file => {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
  });
}
['css', 'js'].forEach(dir => {
  const src = path.join(__dirname, dir);
  if (fs.existsSync(src)) copyDir(src, path.join(__dirname, 'dist', dir));
});

console.log('Build complete → dist/');
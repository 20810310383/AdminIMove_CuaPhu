import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Admin development starts only Vite and has no Node Gateway', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.dev, 'vite');
  assert.equal(fs.existsSync(path.join(root, 'server')), false);
  assert.equal(pkg.dependencies.express, undefined);
  assert.equal(pkg.dependencies.mongoose, undefined);
});

test('Admin Web is configured to call Core Backend directly', () => {
  const env = read('.env.example');
  const productionEnv = read('.env.production.example');
  const vite = read('vite.config.js');
  const app = read('src/App.jsx');
  const trust = read('src/TrustSafetyPage.jsx');
  const settings = read('src/SettingsPage.jsx');

  assert.match(env, /^VITE_CORE_BACKEND_URL=http:\/\/127\.0\.0\.1:5050$/m);
  assert.match(productionEnv, /^VITE_CORE_BACKEND_URL=https:\/\/backendimove\.daututh79\.com$/m);
  assert.doesNotMatch(vite, /proxy\s*:/);
  assert.doesNotMatch(vite, /runtime_config/);
  assert.match(app, /coreUrl\(`\/api\$\{path\}`\)/);
  assert.doesNotMatch(trust, /\/core-api\//);
  assert.match(settings, /adminApiRequest\('\/health'\)/);
  assert.match(settings, /không có Admin Gateway riêng/);
});

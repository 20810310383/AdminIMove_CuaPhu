import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { permissionGroups } from '../src/permissionsModel.js';

test('permission model includes current enterprise permission families', () => {
  const all = permissionGroups().flatMap((group) => group.permissions.map((permission) => permission.code));
  for (const code of ['trust.view', 'pricing.manage', 'promotions.manage', 'reports.view', 'payments.view', 'matching.manage', 'audit.view', 'admins.manage']) {
    assert.ok(all.includes(code), `missing ${code}`);
  }
});

test('profile requires current password and settings describe Core Backend', () => {
  const profile = fs.readFileSync(new URL('../src/ProfilePage.jsx', import.meta.url), 'utf8');
  const settings = fs.readFileSync(new URL('../src/SettingsPage.jsx', import.meta.url), 'utf8');
  assert.match(profile, /currentPassword/);
  assert.match(settings, /Core Backend|TrackAsia/);
});

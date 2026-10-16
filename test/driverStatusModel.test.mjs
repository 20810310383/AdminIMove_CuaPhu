import test from 'node:test';
import assert from 'node:assert/strict';
import { driverRuntimeStatus } from '../src/driverAdminModel.js';

test('driver display status is limited to Online or Offline', () => {
  assert.equal(driverRuntimeStatus({ onlineStatus: 'ONLINE' }), 'ONLINE');
  assert.equal(driverRuntimeStatus({ onlineStatus: 'BUSY' }), 'ONLINE');
  assert.equal(driverRuntimeStatus({ onlineStatus: 'OFFLINE' }), 'OFFLINE');
  assert.equal(driverRuntimeStatus({ onlineStatus: 'UNKNOWN' }), 'OFFLINE');
});

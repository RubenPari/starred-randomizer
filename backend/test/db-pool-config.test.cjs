const assert = require('node:assert/strict');
const { test } = require('node:test');
const { execFileSync } = require('node:child_process');
const { parseDbPoolMax } = require('../dist/db-pool-config.js');

test('defaults to 10 only when DB_POOL_MAX is absent', () => {
  assert.equal(parseDbPoolMax(undefined), 10);
});

for (const value of [undefined, '2']) {
  test(`application config exposes pool max ${value ?? '(default 10)'}`, () => {
    execFileSync(process.execPath, ['-e', `
      const assert = require('node:assert/strict');
      const { config } = require('../dist/config.js');
      assert.equal(config.dbPoolMax, ${value === undefined ? 10 : 2});
    `], {
      cwd: __dirname,
      env: {
        NODE_ENV: 'test',
        GITHUB_TOKEN: 'test-placeholder',
        ...(value === undefined ? {} : { DB_POOL_MAX: value }),
      },
      stdio: 'pipe',
    });
  });
}

for (const value of ['1', '2', '10', '25']) {
  test(`accepts positive integer DB_POOL_MAX=${value}`, () => {
    assert.equal(parseDbPoolMax(value), Number(value));
  });
}

for (const value of ['', ' ', '0', '-1', '1.5', '2x', 'NaN', 'Infinity', '1e2', '0x10', '9007199254740992']) {
  test(`rejects invalid DB_POOL_MAX=${JSON.stringify(value)}`, () => {
    assert.throws(() => parseDbPoolMax(value), {
      message: 'DB_POOL_MAX must be a positive safe integer',
    });
  });
}

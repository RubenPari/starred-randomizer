import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const configUrl = new URL('../dist/config.js', import.meta.url).href;

test('production authentication settings fail closed without reading project secrets', (t) => {
  const root = mkdtempSync(path.join(tmpdir(), 'starred-auth-config-'));
  const cwd = path.join(root, 'backend');
  mkdirSync(cwd);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const valid = {
    NODE_ENV: 'production',
    BETTER_AUTH_URL: 'https://starred.example.com',
    BETTER_AUTH_SECRET: 'production-configuration-test-only-secret-12345',
  };
  const load = (env) => spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(configUrl)})`], {
    cwd, env, encoding: 'utf8',
  });
  assert.equal(load(valid).status, 0);
  assert.equal(load({ ...valid, TRUST_PROXY_HOPS: '1' }).status, 0);
  for (const hops of ['true', '-1', '1.5', '11', '']) {
    assert.match(load({ ...valid, TRUST_PROXY_HOPS: hops }).stderr, /TRUST_PROXY_HOPS/);
  }
  const { BETTER_AUTH_SECRET: _unused, ...noSecret } = valid;
  assert.match(load(noSecret).stderr, /BETTER_AUTH_SECRET must be set/);
  assert.match(load({ ...valid, BETTER_AUTH_SECRET: 'short' }).stderr, /at least 32/);
  assert.match(load({ ...valid, BETTER_AUTH_URL: 'http://starred.example.com' }).stderr, /HTTPS/);
  assert.match(load({ ...valid, BETTER_AUTH_URL: 'https://starred.example.com/api/auth' }).stderr, /without path/);
  assert.match(load({ ...valid, BETTER_AUTH_URL: 'https://name:password@starred.example.com' }).stderr, /without path or credentials/);

  const authUrl = new URL('../dist/auth.js', import.meta.url).href;
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    const { createAuth } = await import(${JSON.stringify(authUrl)});
    const pg = (await import(${JSON.stringify(new URL('../node_modules/pg/lib/index.js', import.meta.url).href)})).default;
    const pool = new pg.Pool();
    const auth = createAuth(pool);
    const context = await auth.$context;
    assert.equal(context.authCookies.sessionToken.attributes.secure, true);
    assert.equal(context.authCookies.sessionToken.attributes.httpOnly, true);
    assert.equal(context.skipOriginCheck, false);
    assert.equal(context.skipCSRFCheck, false);
    await pool.end();
  `], { cwd, env: valid, stdio: 'pipe' });
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import pg from 'pg';
import { spawnSync } from 'node:child_process';
import { createApplication } from '../dist/app.js';

test('registro, login y token contra PostgreSQL real', async () => {
  const url = process.env.DATABASE_URL;
  assert.ok(url, 'DATABASE_URL es obligatoria');
  assert.equal(new URL(url).pathname, '/nexo_integration_test',
    'Esta prueba solo se ejecuta en la base aislada nexo_integration_test');
  process.env.JWT_SECRET = 'integration-test-secret-with-at-least-32-bytes';
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const app = await createApplication();
  app.useLogger(false);
  await app.listen(0, '127.0.0.1');
  const baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  const suffix = Date.now().toString().slice(-7);
  const email = `integracion${suffix}@udistrital.edu.co`;
  const nickname = `Integracion_${suffix}`;
  const studentCode = '20231515042';
  const password = 'ClaveSegura123';
  const post = (path, body) => fetch(`${baseUrl}${path}`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const registration = await post('/auth/register', { email, nickname, studentCode, password });
    assert.equal(registration.status, 201, await registration.text());
    const row = await client.query('SELECT email, nickname, password_hash, role, active FROM users WHERE email = $1', [email]);
    assert.equal(row.rowCount, 1);
    assert.equal(row.rows[0].role, 'ESTUDIANTE');
    assert.equal(row.rows[0].active, true);
    assert.notEqual(row.rows[0].password_hash, password);
    assert.equal((await post('/auth/register', { email, nickname, studentCode, password })).status, 409);
    const login = await post('/auth/login', { email, password });
    assert.equal(login.status, 200);
    const token = (await login.json()).accessToken;
    const me = await fetch(`${baseUrl}/auth/me`, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).email, email);
    const promotion = spawnSync(process.execPath, ['scripts/promote-admin.mjs'], {
      cwd: process.cwd(), encoding: 'utf8', windowsHide: true,
      env: { ...process.env, ADMIN_EMAIL: email }, timeout: 10000,
    });
    assert.equal(promotion.status, 0, promotion.stderr);
    const promoted = await client.query('SELECT role FROM users WHERE email = $1', [email]);
    assert.equal(promoted.rows[0].role, 'ADMINISTRADOR');
    const asAdmin = await fetch(`${baseUrl}/auth/me`, { headers: { authorization: `Bearer ${token}` } });
    assert.equal((await asAdmin.json()).role, 'ADMINISTRADOR');
  } finally {
    await client.query('DELETE FROM users WHERE email = $1', [email]);
    await app.close();
    await client.end();
  }
});

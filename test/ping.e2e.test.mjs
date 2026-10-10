import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { createApplication } from '../dist/app.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
let app;
let baseUrl;

before(async () => {
  app = await createApplication();
  app.useLogger(false);
  assert.equal(app.getHttpServer().listening, false);

  try {
    await app.listen(0, '127.0.0.1');
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  } catch (error) {
    await app.close();
    app = undefined;
    throw error;
  }
});

after(async () => {
  await app?.close();
});

test('la fábrica permite iniciar un servidor HTTP y no agrega una ruta raíz', async () => {
  const response = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(5000) });
  assert.equal(response.status, 404);
});

test('GET /ping sin credenciales devuelve exactamente pong en texto plano', async () => {
  const response = await fetch(`${baseUrl}/ping`, { signal: AbortSignal.timeout(5000) });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type')?.split(';')[0], 'text/plain');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [112, 111, 110, 103]);
});

test('GET /ping conserva texto plano cuando Accept solicita JSON', async () => {
  const response = await fetch(`${baseUrl}/ping`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type')?.split(';')[0], 'text/plain');
  assert.equal(await response.text(), 'pong');
});

function runBootstrap(port) {
  const result = spawnSync(process.execPath, ['dist/main.js'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: port },
    encoding: 'utf8',
    timeout: 10000,
    windowsHide: true,
  });
  assert.ifError(result.error);
  return result;
}

test('el arranque rechaza PORT inválido con salida no cero', () => {
  for (const port of ['invalid', '0', '65536']) {
    const result = runBootstrap(port);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /PORT must be an integer between 1 and 65535/);
  }
});

test('un puerto ocupado provoca un error de arranque y el proceso termina', async () => {
  const occupied = createServer();
  await new Promise((resolve, reject) => {
    occupied.once('error', reject);
    occupied.listen(0, resolve);
  });

  try {
    const result = runBootstrap(String(occupied.address().port));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /EADDRINUSE/);
  } finally {
    await new Promise((resolve, reject) => {
      occupied.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

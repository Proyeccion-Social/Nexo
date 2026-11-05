import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LoginService } from '../dist/auth/login.service.js';

const input = { email: 'ALUMNO@udistrital.edu.co', password: 'ClaveSegura123' };

test('compara una vez con Bcrypt tanto si el usuario falta como si está inactivo', async () => {
  for (const user of [null, { id: '1', active: false, passwordHash: 'stored-hash' }]) {
    const calls = [];
    const service = new LoginService(
      { findByEmail: async () => user },
      { verify: async (password, passwordHash) => {
        calls.push({ password, passwordHash });
        return true;
      } },
      { signAsync: async () => { throw new Error('No debe emitir un token'); } },
    );
    await assert.rejects(service.login(input), (error) => error.getStatus() === 401);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].password, input.password);
    assert.match(calls[0].passwordHash, /^\$2b\$12\$/);
    assert.notEqual(calls[0].passwordHash, user?.passwordHash);
  }
});

test('una cuenta activa compara su hash real antes de emitir el token', async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-bytes-123';
  try {
    const calls = [];
    const service = new LoginService(
      { findByEmail: async () => ({ id: '1', active: true, passwordHash: 'stored-hash' }) },
      { verify: async (password, passwordHash) => {
        calls.push({ password, passwordHash });
        return true;
      } },
      { signAsync: async () => 'signed-token' },
    );
    assert.equal((await service.login(input)).accessToken, 'signed-token');
    assert.deepEqual(calls, [{ password: input.password, passwordHash: 'stored-hash' }]);
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

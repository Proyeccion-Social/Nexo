import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QueryFailedError } from 'typeorm';
import { RegisterService } from '../dist/auth/register.service.js';
import { BcryptPasswordHasher } from '../dist/auth/password-hasher.js';
import { compare } from 'bcrypt';

const valid = { email: 'ESTUDIANTE@udistrital.edu.co', nickname: 'Alumno_1',
  password: 'ClaveSegura123', studentCode: '20231515042' };

test('deriva la contraseña antes de persistir y asigna el rol del servidor', async () => {
  const events = [];
  const service = new RegisterService({
    exists: async () => { events.push('exists'); return null; },
    save: async (user) => { events.push('save'); assert.equal(user.passwordHash, 'bcrypt-hash');
      assert.equal(user.role, 'ESTUDIANTE'); assert.equal(user.active, true); },
  }, { hash: async (password) => { events.push('hash'); assert.equal(password, valid.password); return 'bcrypt-hash'; } });
  await service.register(valid);
  assert.deepEqual(events, ['exists', 'hash', 'save']);
});

test('convierte una colisión UNIQUE concurrente en 409', async () => {
  const service = new RegisterService({ exists: async () => null,
    save: async () => { throw new QueryFailedError('INSERT', [], { code: '23505' }); } },
  { hash: async () => 'hash' });
  await assert.rejects(service.register(valid), (error) => error.getStatus() === 409);
});

test('Bcrypt produce un hash verificable sin conservar la contraseña', async () => {
  const derived = await new BcryptPasswordHasher().hash(valid.password);
  assert.notEqual(derived, valid.password);
  assert.match(derived, /^\$2[aby]\$12\$/);
  assert.equal(await compare(valid.password, derived), true);
});

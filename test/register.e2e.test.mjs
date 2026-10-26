import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../dist/app.module.js';
import { USER_REPOSITORY } from '../dist/auth/user.repository.js';

let app;
let baseUrl;
const saved = [];
const users = {
  async exists(email, nickname, studentCode) {
    if (saved.some((user) => user.email === email)) return 'email';
    if (saved.some((user) => user.nickname === nickname)) return 'nickname';
    if (saved.some((user) => user.studentCode === studentCode)) return 'studentCode';
    return null;
  },
  async save(user) { saved.push(user); },
  async findByEmail(email) { const user = saved.find((item) => item.email === email);
    return user ? { ...user, id: '1' } : null; },
  async findById(id) { return id === '1' && saved[0] ? { ...saved[0], id } : null; },
};

before(async () => {
  process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-bytes-123';
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(USER_REPOSITORY).useValue(users).compile();
  app = module.createNestApplication();
  app.useLogger(false);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(0, '127.0.0.1');
  baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
});

after(async () => { await app?.close(); });

const valid = { email: 'ALUMNO@udistrital.edu.co', nickname: 'Alumno_1',
  password: 'ClaveSegura123', studentCode: '20231515042' };

async function post(path, body) {
  return fetch(`${baseUrl}${path}`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
}

test('POST /auth/register valida, crea estudiante y deriva la contraseña', async () => {
  const response = await post('/auth/register', valid);
  assert.equal(response.status, 201);
  assert.equal(await response.text(), '');
  const { passwordHash, ...user } = saved[0];
  assert.deepEqual(user, { email: 'alumno@udistrital.edu.co', nickname: 'Alumno_1',
    studentCode: valid.studentCode, entrySemester: '2023-1', role: 'ESTUDIANTE', active: true });
  assert.equal(await compare(valid.password, passwordHash), true);
});

test('rechaza dominio, apodo, código, contraseña y propiedades ajenas en HTTP', async () => {
  for (const patch of [
    { email: 'alumno@gmail.com' }, { email: 'a@udistrital.edu.co.evil' },
    { nickname: 'apodo con espacios' }, { nickname: '_alias' },
    { studentCode: '20232515042' }, { password: 'corta' },
    { role: 'ADMINISTRADOR' },
  ]) {
    const response = await post('/auth/register', { ...valid, ...patch });
    assert.equal(response.status, 400, JSON.stringify(patch));
  }
  assert.equal(saved.length, 1);
});

test('rechaza identidades duplicadas', async () => {
  for (const patch of [
    { nickname: 'Otro_1', studentCode: '20231515043' },
    { email: 'otro@udistrital.edu.co', studentCode: '20231515043' },
    { email: 'otro@udistrital.edu.co', nickname: 'Otro_1' },
  ]) assert.equal((await post('/auth/register', { ...valid, ...patch })).status, 409);
});

test('login emite un token y /auth/me exige firma válida y cuenta activa', async () => {
  assert.equal((await fetch(`${baseUrl}/auth/me`)).status, 401);
  assert.equal((await fetch(`${baseUrl}/auth/me`, { headers: { authorization: 'Bearer incorrecto' } })).status, 401);
  const login = await post('/auth/login', { email: valid.email, password: valid.password });
  assert.equal(login.status, 200);
  const { accessToken, tokenType, expiresIn } = await login.json();
  assert.equal(tokenType, 'Bearer');
  assert.equal(expiresIn, 3600);
  const identity = await fetch(`${baseUrl}/auth/me`, { headers: { authorization: `Bearer ${accessToken}` } });
  assert.equal(identity.status, 200);
  assert.deepEqual(await identity.json(), { id: '1', email: 'alumno@udistrital.edu.co',
    nickname: 'Alumno_1', role: 'ESTUDIANTE' });
  assert.equal((await fetch(`${baseUrl}/auth/me`,
    { headers: { authorization: `Bearer ${accessToken}x` } })).status, 401);
  assert.equal((await post('/auth/login', { email: valid.email, password: 'claveIncorrecta' })).status, 401);
  saved[0].active = false;
  assert.equal((await fetch(`${baseUrl}/auth/me`,
    { headers: { authorization: `Bearer ${accessToken}` } })).status, 401);
  saved[0].active = true;
  const expired = await new JwtService().signAsync({ sub: '1' },
    { secret: process.env.JWT_SECRET, expiresIn: -1 });
  assert.equal((await fetch(`${baseUrl}/auth/me`,
    { headers: { authorization: `Bearer ${expired}` } })).status, 401);
});

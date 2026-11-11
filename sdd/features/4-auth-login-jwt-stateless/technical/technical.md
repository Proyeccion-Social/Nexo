# Especificación técnica — Autenticación Stateless con JWT

## Arquitectura

La autenticación se añade como una nueva capa transversal sobre la aplicación NestJS existente (feature 1: `application-runtime` + `health-check`). Se sigue el principio de Defensa en Profundidad: el guardia se registra a nivel global en `AppModule`, por lo que **todas** las rutas requieren autenticación salvo aquellas explícitamente marcadas con `@Public()`.

Componentes:

- `AuthModule` (`src/auth/auth.module.ts`): agrupa el controlador, el servicio, el guard y el decorator de autenticación.
- `AuthController` (`src/auth/auth.controller.ts`): expone `POST /auth/login` y `POST /auth/logout`.
- `AuthService` (`src/auth/auth.service.ts`): valida credenciales, verifica correo confirmado, emite y valida JWT.
- `JwtAuthGuard` (`src/auth/jwt-auth.guard.ts`): `AuthGuard` global que intercepta peticiones sin token válido y devuelve `401 Unauthorized`.
- `Public` decorator (`src/auth/public.decorator.ts`): metadatos `isPublic = true` para eximir rutas del guardia.
- `AuthGuard` aplicado globalmente en `AppModule` mediante `APP_GUARD`.

## Interfaces

### Endpoints

| Método | Ruta | Público | Cuerpo de petición | Respuesta exitosa | Respuesta de error |
|--------|------|---------|--------------------|-------------------|--------------------|
| POST | `/auth/login` | No | `{ email: string; password: string }` | `200` `{ access_token: string }` | `400`, `401`, `403` |
| POST | `/auth/logout` | No | `{}` | `200` `{ message: string }` | — |

### Guardia global

- Se registra como `APP_GUARD` en `AppModule` para cubrir todas las rutas.
- Lee el encabezado `Authorization: Bearer <token>`.
- Si falta el encabezado o el token es inválido/expirado → `401 Unauthorized` antes de alcanzar el controlador.
- Las rutas con metadatos `isPublic = true` (`@Public()`) se saltean.

### Decorador `@Public()`

```typescript
export const Public = () => SetMetadata('isPublic', true);
```

Se aplica en controladores o métodos individuales (por ejemplo, `GET /ping` permanece público).

## Datos

### Payload del JWT (mínimo)

- `sub`: ID de usuario (`string`).
- `role`: rol del usuario (`string`).
- `exp`: tiempo de expiración (configurable por variable de entorno).

No se incluyen datos sensibles ni credenciales en el payload.

### Almacenamiento

- Stateless: el servidor no mantiene sesiones ni lista negra de tokens revocados.
- El cliente almacena el token y lo envía en cada petición autorizada.
- `POST /auth/logout` es del lado del cliente: el servidor confirma el cierre y el cliente descarta el token.

## Restricciones

Heredadas de la especificación técnica global (feature 1):

- Node.js 24 LTS (`>=24.15.0 <25`), pnpm 11.25.0 fijado, `pnpm-lock.yaml` como lockfile reproducible.
- NestJS 12.1.2, Nest CLI 12.0.8, TypeScript 6.0.3, `@types/node` 24.19.2. Mantener versiones exactas.
- TypeScript ESM con `module` y `moduleResolution` NodeNext, modo estricto, metadata de decoradores Nest.
- `src/main.ts` inicia el proceso; `src/app.ts` expone una fábrica sin abrir puerto al importarse.
- `dist/main.js` como salida de producción; tests excluidos del build de producción.
- Adaptador Express estándar de NestJS.
- Puerto por variable de entorno `PORT`, default 3000; enteros 1–65535, fallar con código distinto de cero ante valores inválidos o errores de escucha.
- Pruebas con `node:test`, `node:assert` y `fetch` nativas (E2E sobre la fábrica compartida y puertos dinámicos).
- Comandos portables documentados en README; sin depender de CLI Nest global.

## Decisiones

| Decisión | Opción elegida | Alternativa considerada | Razón |
|----------|----------------|------------------------|-------|
| Algoritmo de firma JWT | HS256 | RS256 | Simplicidad operacional con un solo secreto compartido; suficiente para monolitos internos. |
| Secreto JWT | Variable de entorno `JWT_SECRET` | Código fijo | Evita secretos en el repositorio; permite rotación por despliegue. |
| Expiración JWT | Variable de entorno `JWT_EXPIRATION` | Sin expiración | Reduce la ventana de ataque si el token se filtra. |
| Registro del guardia | `APP_GUARD` global en `AppModule` | Guardia por controlador/módulo | Defensa en Profundidad: olvida proteger una ruta es imposible por diseño. |
| Exención de rutas | Decorador `@Public()` + `isPublic` metadata | Lista de rutas en el guardia | Mantiene el guardia agnóstico a rutas y declarativo en el controlador. |
| Revocación de tokens | Stateless (ninguna) | Lista negra en base de datos/Redis | Complejidad y dependencia adicional; el logout es cliente-lado. |

## Riesgos / Trade-offs

- [Token robado válido hasta `exp`] → Mitigación: expiración corta (`JWT_EXPIRATION`) y rotación de `JWT_SECRET`.
- [Sin revocación inmediata] → Mitigación: vida limitada del token; el cliente descarta el token en logout.
- [Todas las rutas protegidas por defecto] → Mitigación: revisar que cada nueva ruta pública use `@Public()` explícitamente; `GET /ping` sigue público.

## Comprobaciones

| Requisito | Comprobación | Resultado esperado |
|-----------|--------------|--------------------|
| R006 — Login y emisión de JWT | E2E `POST /auth/login` con credenciales válidas | `200`, `access_token` JWT con `sub` y `role` |
| R006 — Contraseña incorrecta | E2E `POST /auth/login` con contraseña errónea | `401`, sin token |
| R006 — Correo no confirmado | E2E `POST /auth/login` con correo no confirmado | `403` |
| R006 — Campo faltante | E2E `POST /auth/login` sin email/password | `400` |
| R007 — Guardia global sin token | E2E a ruta protegida sin `Authorization` | `401` antes del controlador |
| R007 — Token inválido/expirado | E2E con JWT alterado o expirado | `401` |
| R008 — `@Public()` exime rutas | E2E `GET /ping` sin token | `200`, `pong` |
| R009 — Firma alterada | E2E con JWT cuyo payload cambió sin firma | `401` |
| R009 — Secreto distinto | E2E con JWT firmado con otro secreto | `401` |
| R009 — JWT expirado | E2E con `exp` superado | `401` |
| R010 — Logout | E2E `POST /auth/logout` | `200`, confirmación de cierre |

Todas las pruebas HTTP de extremo a extremo usan `node:test`, `node:assert` y `fetch` nativas sobre la fábrica de `src/app.ts` con puertos dinámicos, sin servicios externos.

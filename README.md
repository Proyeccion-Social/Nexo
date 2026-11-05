# Nexo

Base de aplicación NestJS con TypeScript y módulos ESM. Incluye `GET /ping` para comprobar que la aplicación responde.

## Registro y PostgreSQL

`POST /auth/register` recibe JSON con `email`, `nickname`, `password` y `studentCode`.
El correo debe terminar en `@udistrital.edu.co`. El apodo debe comenzar con una letra y tener entre 3 y 30 letras, números o guiones bajos. El código estudiantil tiene 11 dígitos: año (4), semestre (`1` o `3`), proyecto curricular (3) y consecutivo (`001` a `299`). La contraseña debe tener al menos 8 caracteres y no superar 72 bytes UTF-8; el mismo límite de bytes se aplica al iniciar sesión. Se devuelve `201` sin cuerpo, `400` para datos inválidos y `409` para identidad repetida. El rol siempre se asigna en el servidor como `ESTUDIANTE`; el cliente no puede solicitar `ADMINISTRADOR`. Se guarda un hash Bcrypt con coste 12. La cuenta queda activa, pues la verificación de propiedad del correo (RF-02) aún no forma parte de este módulo.

`POST /auth/login` recibe `email` y `password`; devuelve `accessToken`, `tokenType: Bearer` y `expiresIn: 3600`. Enviar `Authorization: Bearer <accessToken>` para consultar `GET /auth/me`. Un guard global exige un token JWT válido en las rutas Nest salvo las marcadas explícitamente como públicas (`/ping`, `/auth/register` y `/auth/login`). La cuenta debe seguir activa para usar el token. Define `JWT_SECRET` con al menos 32 bytes antes de iniciar sesión. La especificación OpenAPI y su interfaz Swagger están en `GET /api`.

Para asignar el segundo rol base, `ADMINISTRADOR`, configura `ADMIN_EMAIL` con el correo institucional de una cuenta activa existente y ejecuta `pnpm run admin:promote` en un entorno de mantenimiento con acceso a `DATABASE_URL`. La operación actualiza solamente esa cuenta. El registro público nunca permite elegir el rol; las rutas protegidas consultan el rol vigente en la base incluso para tokens ya emitidos.

Para habilitar persistencia, crea una base PostgreSQL vacía y define `DATABASE_URL` como URL de conexión, por ejemplo `postgresql://nexo:clave@localhost:5432/nexo`. Aplica una sola vez la [migración inicial](migrations/0001_create_users.sql) antes de arrancar:

```powershell
$env:DATABASE_URL = 'postgresql://nexo:clave@localhost:5432/nexo'
$env:JWT_SECRET = 'una-clave-aleatoria-de-al-menos-32-bytes'
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f migrations/0001_create_users.sql
pnpm run start:dev
```

TypeORM usa esta conexión, la entidad `User` y `synchronize: false`; los cambios estructurales deben pasar por migraciones SQL. Sin `DATABASE_URL`, `/ping` y Swagger siguen disponibles, y el registro responde `503`. Si la URL está definida pero PostgreSQL no responde, el arranque falla. La lógica de registro depende de interfaces inyectadas para persistencia y derivación de claves.

La prueba `pnpm run test:db` usa una base aislada llamada `nexo_integration_test` indicada en `DATABASE_URL`, con la migración ya aplicada. Registra un usuario, comprueba el hash y el rol en PostgreSQL, inicia sesión, consulta la ruta protegida y elimina el usuario de prueba al terminar.

## Requisitos

- Node.js 24 LTS, versión 24.15.0 o posterior de la línea 24.
- pnpm 11.25.0, fijado en `packageManager`.

Usa tu instalación habitual de Node.js y pnpm. El proyecto utiliza el CLI Nest local; no requiere un CLI global ni rutas del runtime de Codex.

## Instalar dependencias

Desde la raíz del repositorio:

```sh
pnpm install --frozen-lockfile
```

`pnpm-lock.yaml` fija la resolución de dependencias. Al modificar deliberadamente las dependencias, utiliza `pnpm install` y conserva los cambios del lockfile junto al manifiesto.

## Ejecutar

```sh
pnpm run start:dev
```

El servidor utiliza el puerto `3000` por defecto. Este modo recompila y reinicia la aplicación cuando cambia el código. Detén el proceso con `Ctrl+C`.

Para compilar y ejecutar la versión compilada:

```sh
pnpm run build
pnpm run start:prod
```

`start:prod` ejecuta `dist/main.js` y requiere una compilación previa. `pnpm run start` también permite arrancar mediante el CLI local de Nest.

## Configurar el puerto

`PORT` debe ser un entero entre `1` y `65535`. Un valor inválido o un puerto ocupado provoca un error de arranque y salida no cero.

PowerShell:

```powershell
$env:PORT = '3001'
pnpm run start:dev
```

POSIX:

```sh
PORT=3001 pnpm run start:dev
```

Para recuperar el puerto por defecto en PowerShell, elimina la variable de esta sesión con `Remove-Item Env:PORT -ErrorAction SilentlyContinue`.

## Ping

Con el servidor activo, ejecuta en otra terminal:

PowerShell:

```powershell
curl.exe -i http://localhost:3000/ping
```

POSIX:

```sh
curl -i http://localhost:3000/ping
```

La respuesta tiene estado `200`, `Content-Type: text/plain; charset=utf-8` y cuerpo exacto `pong`, sin JSON ni salto de línea. Si configuraste `PORT`, utiliza ese puerto en la URL.

En PowerShell también puedes consultar cuerpo y media type:

```powershell
$response = Invoke-WebRequest http://localhost:3000/ping
$response.StatusCode
$response.Headers['Content-Type']
$response.Content
```

El endpoint es público y comprueba únicamente **liveness**: que el servidor HTTP responde. No consulta base de datos, caché ni APIs externas y conserva su respuesta en texto plano aunque el cliente envíe `Accept: application/json`.

## Comprobaciones

El flujo de GitHub Actions y los requisitos de aprobación y cierre de features
se describen en [CI y condiciones de merge](docs/ci.md).

```sh
pnpm run test:e2e
pnpm run test:unit
```

El comando compila y ejecuta pruebas HTTP con el runner nativo de Node.js. Utiliza puertos dinámicos, comprueba `/ping`, su representación ante `Accept: application/json`, errores de arranque y cierra los servidores al terminar.

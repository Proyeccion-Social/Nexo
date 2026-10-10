# Nexo

Base de aplicación NestJS con TypeScript y módulos ESM. Incluye `GET /ping` para comprobar que la aplicación responde.

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
```

El comando compila y ejecuta pruebas HTTP con el runner nativo de Node.js. Utiliza puertos dinámicos, comprueba `/ping`, su representación ante `Accept: application/json`, errores de arranque y cierra los servidores al terminar.

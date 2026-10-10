# Especificación técnica global

Decisiones técnicas vigentes consolidadas de la feature inicial. Los detalles y alternativas aprobadas se conservan en la [especificación técnica de origen](../../features/1-initial-scaffolding/technical/technical.md).

## Runtime y dependencias

- Usar Node.js 24 LTS, con soporte del proyecto para `>=24.15.0 <25`.
- Usar pnpm 11.25.0 fijado en `packageManager` y mantener `pnpm-lock.yaml` como lockfile reproducible.
- La base implementada fija NestJS 12.1.2, Nest CLI 12.0.8, TypeScript 6.0.3 y `@types/node` 24.19.2. Mantener las versiones exactas y revisar compatibilidad antes de actualizarlas.

## Aplicación y módulos

- Mantener TypeScript ESM con `module` y `moduleResolution` NodeNext, modo estricto y metadata de decoradores Nest.
- `src/main.ts` inicia el proceso; `src/app.ts` expone una fábrica que puede usarse sin abrir un puerto al importarse. `AppModule` incorpora módulos de capacidad.
- Mantener `dist/main.js` como salida de producción y excluir tests del build de producción.

## HTTP y liveness

- Usar el adaptador Express estándar de NestJS.
- GET /ping es público, devuelve estado 200, cuerpo exacto `pong` con media type `text/plain`, y no consulta servicios externos.
- El puerto se configura mediante `PORT`, con valor predeterminado 3000; aceptar enteros de 1 a 65535 y fallar con código distinto de cero ante valores inválidos o errores de escucha.

## Verificación y documentación

- Usar las APIs nativas `node:test`, `node:assert` y `fetch` para pruebas HTTP de extremo a extremo sobre la fábrica compartida y puertos dinámicos.
- Mantener comandos portables para desarrollo, build, producción y pruebas documentados en README; no depender de CLI Nest global.
- La feature de origen está archivada en [1-initial-scaffolding](../../features/1-initial-scaffolding/technical/technical.md).

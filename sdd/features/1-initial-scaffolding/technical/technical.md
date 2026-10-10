# Design

## Context

Feature: 1-initial-scaffolding. El documento funcional está aprobado y define R001–R005; consultar functional/functional.md en la feature SDD, proposal.md y los delta specs application-runtime y health-check de este cambio para el alcance.

El repositorio todavía no contiene código ni configuración de aplicación y no tiene specs técnicas globales. El entorno inspeccionado dispone de Node.js 24.19.0 y pnpm 11.25.0 mediante el runtime de Codex; npm no está en el PATH de esta sesión. Estas observaciones no se convierten en rutas personales dentro del proyecto.

## Goals / Non-Goals

**Goals:** estructura pequeña y ampliable de NestJS; arranque y compilación reproducibles; respuesta /ping determinista; comprobaciones HTTP que utilicen la misma configuración que el arranque real.

**Non-Goals:** arquitectura por capas adicional, DTOs sin entrada, servicios para devolver una constante, framework de health con dependencias externas, monorepo, despliegue o integración de observabilidad. Los límites funcionales permanecen en el documento aprobado.

## Decisions

### D001 — Runtime, lenguaje y módulos

Proponer Node.js 24 LTS, con mínimo 24.15.0 y engine >=24.15.0 <25; NestJS 12; TypeScript 6; módulos ESM y compilación NodeNext. Los paquetes @nestjs/common, @nestjs/core, @nestjs/platform-express y @nestjs/cli local deben pertenecer a la misma línea mayor compatible. Resolver versiones de parche publicadas y compatibles al implementar y registrarlas de forma exacta en package.json y en el lockfile; no adoptar versiones prerelease ni otra major silenciosamente.

Motivo: Node 24 está disponible localmente y cumple el mínimo de los generadores actuales. Nest documenta ESM para la línea 12 y TypeScript 6 en su actualización. Usar imports relativos con extensión .js en los archivos TypeScript para el código emitido.

Alternativas: CommonJS es posible en el runtime compatible, pero introduce interoperabilidad innecesaria para un proyecto nuevo; JavaScript requeriría renunciar al contrato de tipos o configurar transformación adicional. No actualizar globalmente Node, pnpm o el CLI durante esta feature.

### D002 — Dependencias y gestión del proyecto

Usar pnpm 11.25.0, la versión ya comprobada en el entorno, fijada mediante packageManager. Generar y versionar pnpm-lock.yaml; utilizar instalaciones frozen-lockfile una vez generado el lock. La documentación debe explicar cómo disponer de Node y de esa versión de pnpm en un entorno normal.

Dependencias de ejecución: @nestjs/common, @nestjs/core, @nestjs/platform-express, reflect-metadata y rxjs. Dependencias de desarrollo: @nestjs/cli local, typescript y @types/node compatible con Node 24. Resolver los peers declarados por los paquetes antes de fijarlos.

Alternativas: npm requeriría preparar una herramienta ausente en esta sesión; actualizar a pnpm 12 no aporta una capacidad necesaria para este alcance. No copiar rutas del runtime de Codex a scripts del proyecto ni requerir un CLI Nest global.

### D003 — Organización y responsabilidades

Estructura propuesta de la aplicación:

```text
src/
  main.ts
  app.ts
  app.module.ts
  health/
    health.module.ts
    health.controller.ts
test/
  ping.e2e.test.mjs
package.json
pnpm-lock.yaml
nest-cli.json
tsconfig.json
tsconfig.build.json
.gitignore
README.md
```

main.ts es el punto de arranque; app.ts expone una fábrica de aplicación sin abrir un puerto al importarse. AppModule importa HealthModule, que registra HealthController. El controlador es suficiente para una respuesta constante. La fábrica común evita que los tests usen una configuración diferente de la aplicación.

Configurar TypeScript con strict, experimentalDecorators, emitDecoratorMetadata, module y moduleResolution NodeNext, target ES2023, rootDir src y outDir dist. Importar reflect-metadata antes de crear la aplicación. Excluir test y dist del build de producción. El contrato de salida es dist/main.js.

Mantener .agents/, openspec/ y sdd/ como documentación y orquestación; no incluirlos en el código compilado ni sobrescribirlos al crear el scaffolding. Ignorar node_modules, dist, archivos temporales y logs de ejecución.

Alternativa: un único controlador en AppModule reduce un archivo, pero el módulo health mantiene una frontera de responsabilidad clara para futuras funcionalidades. No se introduce un servicio sin comportamiento propio.

### D004 — Adaptador HTTP y contrato de /ping

Usar el adaptador Express de Nest mediante @nestjs/platform-express. HealthController expone @Controller() sin prefijo y @Get('ping'); el método retorna la cadena literal pong. Fijar @HttpCode(200) y @Header('Content-Type', 'text/plain; charset=utf-8') mediante las APIs estándar de Nest.

No registrar un prefijo global, guards de autenticación, interceptores de envoltura JSON ni negociación que cambie la representación según Accept. La respuesta debe conservar exactamente los bytes UTF-8 de pong. No usar @Res() porque el manejo estándar y los decoradores cubren el contrato sin acoplar el controlador al objeto Response de Express.

Alternativa: Fastify también puede cumplir el contrato, pero no se ha identificado una necesidad de cambiar el adaptador habitual de Nest. No incorporar Terminus para un endpoint que no comprueba dependencias externas.

### D005 — Arranque y configuración local

Leer PORT de process.env, con 3000 como valor predeterminado. Aceptar únicamente enteros entre 1 y 65535 en el arranque de usuario; un valor inválido debe terminar con error claro y código distinto de cero. Los tests pueden pasar puerto 0 directamente al listener para reservar un puerto libre.

Crear la aplicación mediante la fábrica compartida, habilitar cierre ordenado y escuchar el puerto configurado. Propagar errores de creación o de escucha con código de salida no cero y cerrar recursos abiertos cuando corresponda. No exigir .env ni un servicio externo para responder /ping.

Documentar comandos portables y ejemplos PowerShell/POSIX cuando cambie la sintaxis de variables de entorno. La configuración de PORT no añade otro endpoint ni cambia el contrato HTTP aprobado.

### D006 — Comandos y reproducibilidad

Scripts del proyecto:

| Script | Comportamiento |
| --- | --- |
| start | Arranque local mediante el CLI Nest del proyecto. |
| start:dev | Arranque con recompilación y reinicio ante cambios. |
| build | Compilar src a dist mediante nest build. |
| start:prod | Ejecutar node dist/main.js; requiere build previo. |
| test:e2e | Compilar y ejecutar las pruebas HTTP con node --test sobre test/*.e2e.test.mjs. |

README debe documentar requisitos, instalación con pnpm, scripts, puerto, llamada a /ping, respuesta esperada y que este endpoint comprueba liveness. Mantener una sola estrategia de instalación y un solo lockfile.

### D007 — Verificación ligada a los requisitos

Usar node:test, node:assert/strict y fetch nativos de Node. Las pruebas E2E en JavaScript ESM importan la fábrica compilada, crean una aplicación real con Express, escuchan en 127.0.0.1 y puerto dinámico y cierran el servidor al finalizar, incluso ante fallos.

| Requisito | Evidencia necesaria en implementación |
| --- | --- |
| R001 | Arranque de desarrollo comprobado y servidor HTTP disponible; arranque compilado comprobado por separado. |
| R002 | Instalación reproducible con lockfile, build exitoso y revisión de los comandos documentados. |
| R003 | Petición sin credenciales: estado 200 y bytes exactamente [112, 111, 110, 103]. |
| R004 | Content-Type con media type text/plain; mismo cuerpo y media type con Accept: application/json. |
| R005 | Ejecución de las pruebas sin configuración ni uso de servicios externos; inspección del controlador y sus dependencias. |

No sustituir pruebas HTTP por comparar únicamente el retorno de un método. Las comprobaciones del build y del arranque detectan errores de imports, decoradores, compilación y configuración que una prueba aislada del controlador no cubre.

Alternativas: Jest o Vitest son válidos, pero añaden configuración y dependencias que este contrato pequeño no necesita. No añadir comprobaciones que solo repliquen la implementación sin validar comportamiento observable.

## Risks / Trade-offs

- [Interoperabilidad ESM y decoradores] → Usar NodeNext, extensiones .js y metadata de decoradores; comprobar build y arranque real.
- [Versiones o peers incompatibles] → Resolver versiones estables compatibles, fijarlas y comprobar el lockfile antes de implementación completa. Si la línea propuesta no está disponible, presentar una revisión técnica.
- [Cadena enviada con media type equivocado] → Fijar Content-Type y verificar headers y bytes mediante HTTP real.
- [Puerto local ocupado] → Permitir PORT y utilizar puertos dinámicos en pruebas; reportar el error de escucha.
- [Herramientas solo disponibles dentro de Codex] → Documentar prerrequisitos portables; mantener rutas absolutas fuera de los scripts del proyecto.
- [Scaffolding generado con archivos extras] → Incorporar únicamente los archivos aprobados y preservar la configuración SDD/OpenSpec existente.

## Migration Plan

No hay aplicación existente ni datos que migrar. El cambio introduce una base nueva y no implica despliegue. La reversión debe limitarse a los archivos de aplicación añadidos y sus dependencias, conservando los artefactos de trazabilidad SDD/OpenSpec. Este documento define el diseño; la planificación de ejecución y las tareas se generan después de la aprobación técnica.

## Sources

Fuentes primarias consultadas para las decisiones de compatibilidad y APIs:

- [NestJS: guía de migración a la línea 12](https://docs.nestjs.com/migration-guide).
- [NestJS: controllers, respuestas y headers](https://docs.nestjs.com/controllers).
- [Node.js: estado de las líneas de versiones](https://nodejs.org/en/about/previous-releases).
- [Node.js 24: test runner](https://nodejs.org/docs/latest-v24.x/api/test.html).
- [pnpm: compatibilidad de versiones y Node.js](https://pnpm.io/installation).

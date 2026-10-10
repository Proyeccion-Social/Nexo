# Especificación funcional global

Índice generado de las capacidades funcionales consolidadas del proyecto. Los contratos normativos viven en las specs OpenSpec enlazadas; esta vista resume su alcance y origen.

## Capacidades

### application-runtime

Base local ejecutable de NestJS, con instalación reproducible, comandos documentados de desarrollo y compilación, y arranque de la aplicación compilada.

- Requisitos: R001 — inicio del servidor HTTP; R002 — preparación, compilación y arranque local reproducibles.
- Especificación: [application-runtime](../../../openspec/specs/application-runtime/spec.md).
- Feature de origen: [1-initial-scaffolding](../../features/1-initial-scaffolding/functional/functional.md).

### health-check

Comprobación pública de liveness mediante GET /ping, con respuesta HTTP 200 y cuerpo exacto pong en texto plano, sin servicios externos.

- Requisitos: R003 — respuesta pública; R004 — representación text/plain; R005 — liveness sin dependencias externas.
- Especificación: [health-check](../../../openspec/specs/health-check/spec.md).
- Feature de origen: [1-initial-scaffolding](../../features/1-initial-scaffolding/functional/functional.md).

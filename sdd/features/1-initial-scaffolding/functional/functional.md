# Especificación funcional — 1-initial-scaffolding

## Objetivo

Crear la base inicial de un proyecto NestJS en este repositorio, con un endpoint de health GET /ping que responda pong en texto plano.

## Contexto observado

- El repositorio tiene configuración y skills de OpenSpec/SDD, pero no código de aplicación, manifiesto de dependencias ni features previas.
- No existen specs funcionales o técnicas globales consolidadas.
- Esta es la primera feature del proyecto. Las decisiones de implementación se elaboran después de la revisión funcional.

## Alcance y criterios de aceptación

| ID | Resultado esperado |
| --- | --- |
| R001 | La aplicación puede iniciarse localmente y recibir peticiones HTTP. |
| R002 | La documentación permite instalar dependencias, ejecutar en desarrollo, compilar, arrancar la versión compilada e invocar /ping. |
| R003 | GET /ping responde 200 sin credenciales y con exactamente pong, sin comillas, JSON, espacios adicionales ni salto de línea. |
| R004 | La respuesta usa Content-Type text/plain; se permite charset. El formato permanece en texto plano aunque el cliente acepte JSON. |
| R005 | /ping comprueba liveness de la aplicación y no consulta servicios externos. |

NestJS es una restricción explícita del usuario para la aplicación. El gestor de paquetes, las versiones, el puerto y el adaptador HTTP se definirán en la etapa técnica.

## Suposiciones para revisar

- Se utiliza GET para el endpoint de consulta solicitado.
- /ping es público y está disponible en esa ruta exacta, sin prefijo adicional.
- El scaffolding incluye los comandos y la documentación mínimos para preparar y ejecutar el proyecto.
- Health significa liveness del proceso HTTP; no incluye readiness de base de datos u otros servicios.

Estas suposiciones forman parte del documento pendiente de revisión; no constituyen decisiones aprobadas todavía.

## Fuera de alcance

Base de datos, autenticación, caché, contenedores, CI/CD, despliegue y endpoints adicionales de health/readiness. Las decisiones técnicas y las tareas se producen en sus etapas respectivas.

## Propuesta OpenSpec

El siguiente bloque es la fuente de la proyección proposal.md:

```markdown
# Proposal

## Why

El repositorio aún no contiene una aplicación ejecutable. Se necesita una base NestJS y una señal HTTP simple para comprobar que el servidor responde antes de desarrollar nuevas funcionalidades.

## What Changes

- Crear el scaffolding mínimo de una aplicación NestJS ejecutable en este repositorio.
- Proporcionar comandos documentados para preparar, ejecutar en desarrollo, compilar y arrancar la aplicación compilada.
- Exponer GET /ping sin autenticación, con estado 200, cuerpo exacto pong y Content-Type text/plain.
- Limitar el endpoint a liveness de la aplicación; no consultar dependencias externas.

## Capabilities

### New Capabilities

- `application-runtime`: preparación y ejecución local de la aplicación NestJS.
- `health-check`: comprobación HTTP de disponibilidad de la aplicación mediante /ping.

### Modified Capabilities

Ninguna; no existen specs consolidadas en el proyecto.

## Impact

- Nueva aplicación NestJS y sus archivos mínimos de código y configuración.
- Manifiesto de dependencias, comandos de ejecución y documentación de arranque.
- Nueva API pública GET /ping.
- Las versiones, el gestor de paquetes, el adaptador HTTP y la estructura concreta se definirán en la revisión técnica.
- Fuera de alcance: base de datos, autenticación, contenedores, CI/CD, despliegue y comprobaciones de readiness de servicios externos.
```

## Contratos por capacidad

Los bloques normativos se expresan en inglés con SHALL y WHEN/THEN para conservar el formato de OpenSpec. Sus IDs corresponden a los criterios anteriores. Todos los requisitos son ADDED porque no existen capacidades consolidadas.

### application-runtime

```markdown
# Spec Delta

## Purpose

Provide a locally runnable application foundation so developers can prepare, start and build the project before adding business functionality.

## ADDED Requirements

### Requirement: R001 - Application startup
The project SHALL provide an application that starts an HTTP server using documented local startup commands after its dependencies have been installed.

#### Scenario: Start the development application
- **WHEN** a developer prepares the documented prerequisites, installs dependencies and executes the documented development command
- **THEN** the application starts an HTTP server that can receive requests

### Requirement: R002 - Reproducible local preparation and build
The project SHALL document its prerequisites, dependency installation, development startup, build and compiled startup commands, together with how to invoke the ping endpoint.

#### Scenario: Follow the local setup instructions
- **WHEN** a developer follows the project documentation in a clean supported environment
- **THEN** the developer can install dependencies, build the application, start the compiled application and invoke GET /ping
```

### health-check

```markdown
# Spec Delta

## Purpose

Allow callers to check that the running application responds to HTTP requests using a minimal public endpoint with a stable plain-text response.

## ADDED Requirements

### Requirement: R003 - Public ping response
The application SHALL expose GET /ping without requiring authentication and return HTTP 200 with a body consisting of exactly the four characters pong.

#### Scenario: Invoke the ping endpoint
- **WHEN** a caller sends GET /ping to the running application without authentication credentials
- **THEN** the response status is 200 and the response body is exactly pong, without quotes, wrapping objects, leading or trailing whitespace, or a newline

### Requirement: R004 - Plain-text representation
The ping response SHALL declare Content-Type text/plain, optionally including a charset parameter, and SHALL retain that representation when the caller accepts JSON.

#### Scenario: Read the response media type
- **WHEN** a caller sends GET /ping
- **THEN** the response Content-Type media type is text/plain and its body is not JSON

#### Scenario: Invoke ping with a JSON accept header
- **WHEN** a caller sends GET /ping with Accept: application/json
- **THEN** the application still returns HTTP 200 with Content-Type text/plain and the exact body pong

### Requirement: R005 - Application liveness only
The ping endpoint SHALL answer without checking a database, external API, cache or any other external service.

#### Scenario: Invoke ping without external services
- **WHEN** the application is running and no external services are configured
- **THEN** GET /ping still returns HTTP 200 and the exact body pong
```

## Revisión requerida

Revisar alcance, suposiciones y criterios. La aprobación funcional habilita la elaboración del documento técnico mediante sdd_kit.approve_functional 1-initial-scaffolding.

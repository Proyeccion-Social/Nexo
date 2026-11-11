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

### auth-login

Autenticación de credenciales de usuario y emisión de un JWT firmado criptográficamente tras validar el hash de la contraseña y que el correo esté confirmado, con payload mínimo (ID y rol).

- Requisitos: R006 — login y emisión de JWT.
- Especificación: [auth-login](../../../openspec/specs/auth-login/spec.md).
- Feature de origen: [4-auth-login-jwt-stateless](../../features/4-auth-login-jwt-stateless/functional/functional.md).

### auth-logout

Cierre de sesión del cliente; el servidor confirma el fin de la sesión y el cliente descarta el token almacenado (stateless, sin lista negra).

- Requisitos: R010 — logout.
- Especificación: [auth-logout](../../../openspec/specs/auth-logout/spec.md).
- Feature de origen: [4-auth-login-jwt-stateless](../../features/4-auth-login-jwt-stateless/functional/functional.md).

### auth-guard

Guardia de autenticación global que rechaza peticiones sin token válido con `401 Unauthorized`, eximiendo rutas declaradas con el decorador `@Public()`. Valida criptográficamente la firma, el secreto y la expiración del JWT.

- Requisitos: R007 — guardia global; R008 — decorador @Public(); R009 — validación de firma del JWT.
- Especificación: [auth-guard](../../../openspec/specs/auth-guard/spec.md).
- Feature de origen: [4-auth-login-jwt-stateless](../../features/4-auth-login-jwt-stateless/functional/functional.md).

# Especificación funcional — Autenticación Stateless con JWT

## Objetivo

Asegurar la API de NestJS bajo el principio de Defensa en Profundidad, exigiendo autenticación por JSON Web Token (JWT) en todas las rutas salvo aquellas declaradas explícitamente como públicas, y proviendo un flujo de login que emita un token firmado criptográficamente con un payload mínimo.

## Alcance

- Endpoint `POST /auth/login` que valide credenciales (correo y contraseña), compruebe que el correo esté confirmado y emita un JWT firmado.
- Guardia de autenticación global (`AuthGuard`) registrado a nivel de aplicación que intercepte y rechace peticiones sin token válido.
- Decorador personalizado `@Public()` que exima rutas específicas del guardia global.
- Validación criptográfica de la firma del token (algoritmo, secreto y expiración).
- Endpoint `POST /auth/logout` para finalizar la sesión del cliente.

## Exclusiones

- No se implementa registro de usuarios (queda fuera de este alcance; depende de feature `3-auth-registration-postgres`).
- No se implementa refresco de tokens (refresh tokens); el cliente obtiene un JWT de vida limitada en el login.
- No se gestiona revocación de tokens por lista negra; el logout es del lado del cliente (descartar el token).
- No se integra proveedor de identidad externo (OAuth/OIDC).

## Requisitos estables

| ID | Requisito | Origen |
|---|---|---|
| R006 | `POST /auth/login` autentica credenciales y emite un JWT firmado tras validar hash de contraseña y correo confirmado. | RF-06 — Estrategia de Credenciales |
| R007 | El guardia de autenticación global rechaza toda petición sin token válido con `401 Unauthorized`. | RF-06 — Global Guard |
| R008 | El decorador `@Public()` exime una ruta específica del guardia global, permitiendo acceso sin autenticación. | RF-06 — Global Guard |
| R009 | La firma del JWT se valida criptográficamente al recibirlo (algoritmo, secreto y expiración). | RF-06 — Firma y Emisión |
| R010 | `POST /auth/logout` finaliza la sesión indicando al cliente que descarte el token. | RF-06 — Logout |

## Escenarios comprobables

### R006 — Login y emisión de JWT

**WHEN** el cliente envía `POST /auth/login` con correo y contraseña válidos de una cuenta cuya confirmación de correo está activa  
**THEN** la respuesta es `200 OK` con cuerpo JSON que contiene un campo `access_token`; el token es un JWT firmado cuyo payload incluye como mínimo `sub` (ID de usuario) y `role` (rol).

**WHEN** el cliente envía credenciales con contraseña incorrecta  
**THEN** la respuesta es `401 Unauthorized` y no se emite token.

**WHEN** el cliente envía credenciales de un correo no confirmado  
**THEN** la respuesta es `403 Forbidden` indicando que el correo debe confirmarse antes de iniciar sesión.

**WHEN** el cuerpo de la petición falta el correo o la contraseña  
**THEN** la respuesta es `400 Bad Request` con detalle del campo faltante.

### R007 — Guardia global

**WHEN** una petición llega a cualquier ruta protegida sin encabezado `Authorization: Bearer <token>`  
**THEN** el guardia global la rechaza con `401 Unauthorized` sin invocar el controlador de destino.

**WHEN** el token presentado tiene firma inválida o está expirado  
**THEN** el guardia global lo rechaza con `401 Unauthorized`.

### R008 — Decorador @Public

**WHEN** una ruta está anotada con `@Public()`  
**THEN** el guardia global la saltea y permite el acceso sin token.

**WHEN** `GET /ping` (ruta pública existente de la feature 1) no lleva token  
**THEN** responde `200 OK` con cuerpo `pong` sin intervención del guardia de autenticación.

### R009 — Validación de firma del token

**WHEN** se presenta un JWT cuyo payload fue alterado sin recalcular la firma  
**THEN** el middleware de validación lo rechaza con `401 Unauthorized`.

**WHEN** el JWT fue firmado con un secreto distinto al configurado en el servidor  
**THEN** la validación falla y se rechaza con `401 Unauthorized`.

**WHEN** el JWT superó su tiempo de expiración (`exp`)  
**THEN** la validación falla y se rechaza con `401 Unauthorized`.

### R010 — Logout

**WHEN** el cliente envía `POST /auth/logout`  
**THEN** la respuesta es `200 OK` confirmando el cierre de sesión y el cliente debe descartar el token almacenado.

## Cambios por capacidad

| Capacidad | Operación | Rutas afectadas | Notas |
|---|---|---|---|
| auth-login | ADDED | `POST /auth/login` | Nuevo endpoint de emisión de JWT |
| auth-logout | ADDED | `POST /auth/logout` | Nuevo endpoint de cierre de sesión |
| auth-guard | ADDED | Global (todas las rutas) | Guardia de autenticación con `@Public()` |
| health-check | UNCHANGED | `GET /ping` | Sigue público, no afectado por el guardia |

## Decisiones confirmadas

- Defensa en Profundidad: el guardia se aplica a nivel global en `AppModule`; solo las rutas marcadas `@Public()` quedan exentas.
- Payload mínimo del JWT: `sub` (ID) y `role` (rol), sin datos sensibles.
- Almacenamiento del token: del lado del cliente; el servidor no mantiene sesiones ni lista negra (stateless).
- Algoritmo de firma: HS256 con secreto configurado por variable de entorno.

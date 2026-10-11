# Especificación técnica: flujo de ramas SDD

## Contexto

La feature mantiene la orquestación en `.agents/skills/sdd-kit/SKILL.md`, sus contratos de estado en `.agents/skills/sdd-kit/references/contracts.md` y las instrucciones de PR en `feature_template.md`. La especificación técnica global fija NestJS y Node.js para la aplicación; esta feature no cambia ese runtime ni agrega dependencias.

El repositorio usa `main` como rama predeterminada remota y no tiene `develop` actualmente. El estado de la feature inicial archivada precede a este contrato y no incluye metadatos Git; esos campos nuevos son obligatorios solo para features nuevas.

## Decisiones técnicas

### Identidad y creación de la rama

- Usar `feature/<feature_id>` como nombre exacto de la rama local. Mantener `feature_id` estable entre el directorio SDD, la rama y el comentario de PR.
- Antes de crear la rama, resolver una base concreta: preferir `develop` si existe localmente o como referencia remota conocida; en este repositorio la base observada es `main` (`origin/HEAD` apunta a `origin/main`). Si no hay `develop`, aceptar la rama actual solo con su función de integración confirmada.
- Registrar en `state.json` `git.branch`, `git.base_branch`, `git.base_sha` y `git.created_at`. El `base_sha` registra el commit desde el cual se creó la feature; no se recalcula durante el flujo.
- Comprobar colisiones de ID, de rama y de destino antes de crear la rama. Una identidad ya reservada se reanuda; no se numera de nuevo después de una interrupción.

### Preservación de cambios locales

- Inspeccionar `git status --porcelain=v1 --untracked-files=all` antes de cambiar de rama. Si los cambios quedarían mezclados, detenerse, conservarlos y permitir al usuario limpiarlos o elegir aislamiento.
- No usar `stash`, `stage`, `reset`, `restore` ni operaciones destructivas para resolver automáticamente ese bloqueo. El aislamiento puede ejecutarse en un worktree limpio.
- La única mutación Git automática del flujo es crear la rama local de la feature durante `init`; no crear commits, publicar ramas, abrir PR ni fusionar.

### Validación de rama y estado

- En `approve_functional`, `approve_technical`, `review`, `implement` y `archive`, comparar `git branch --show-current` con `state.json.git.branch` antes de escribir.
- Si no coinciden, conservar artefactos y estado; mostrar el comando Git exacto para volver a la rama registrada.
- Permitir que estados archivados históricos no tengan `git`; exigir esos datos únicamente en identidades nuevas. No reescribir automáticamente estados previos.

### Merge y plantilla de PR

- Documentar el merge de `feature/*` hacia `develop` y de `release/*` hacia `main` mediante **Squash and merge**. Archivar en SDD no fusiona ramas.
- Mantener la aprobación **Approve** y los checks obligatorios como requisitos independientes del texto del comentario; el archivo de plantilla no configura por sí solo branch protection.
- Reemplazar en la plantilla la referencia obsoleta a `docs/ci.md` por `.github/workflows/sdd-gate.yml`, que es el workflow presente y que valida el contrato del comentario. No recrear `docs/ci.md`.
- No crear automáticamente `develop` ni ramas `release/*`. La disponibilidad de `develop` y la configuración de protección de ramas son condiciones de operación del repositorio, no efectos de la skill.

### Relación con OpenSpec

Este cambio modifica tooling y documentación del proceso de desarrollo, no requisitos de comportamiento de la aplicación. OpenSpec conserva `skip_specs: true`; el documento funcional SDD y `proposal.md` son las fuentes de esta etapa, y `design.md` es la proyección técnica. No se crea una capability de producto artificial.

## Verificación técnica prevista

- Verificar que cada campo Git guardado corresponde a la rama y al commit base realmente observados.
- Revisar los flujos para confirmar que ningún paso hace stash, commit, push, merge ni crea ramas de integración.
- Comprobar que la plantilla mantiene el identificador SDD, los requisitos de aprobación y checks, la estrategia Squash and merge y el enlace al workflow existente.
- Validar el JSON de estado y los artefactos OpenSpec con la CLI; la validación OpenSpec no sustituye la comprobación funcional del workflow.

## Riesgos y mitigaciones

- **`develop` no existe en el remoto actual:** no se podrá abrir una PR de feature a ese destino hasta que el equipo establezca esa rama; el flujo no la crea silenciosamente.
- **La documentación puede divergir de la protección de GitHub:** configurar la protección y los checks como regla del repositorio; la plantilla solo comunica el contrato.
- **Un cambio local podría perderse al cambiar de rama:** bloquear el cambio y ofrecer aislamiento antes de crear documentos de la feature.

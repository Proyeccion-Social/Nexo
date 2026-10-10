<!--
Uso: copiar esta plantilla como primer comentario de conversación de la PR,
publicado por su autor. Reemplazar <feature-id> por el identificador completo
de SDD (por ejemplo, 1-initial-scaffolding) y completar las secciones.

Contrato para el futuro check obligatorio de CI:
- Leer el primer comentario de conversación publicado por el autor de la PR.
- Exigir exactamente un bloque sdd-feature con JSON válido y schema_version 1.
- Rechazar placeholders e identificadores que no cumplan
  ^[1-9][0-9]*-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$.
- Derivar sdd/features/<feature_id>/state.json del identificador; leerlo en el
  commit actual de la PR. Debe existir, coincidir en feature_id y declarar
  status archived, operation.command archive y operation.phase complete.
- Exigir feature_status archived y required_review_state APPROVED en el JSON.
- Exigir al menos una revisión vigente APPROVED de GitHub de un revisor
  habilitado, distinto del autor. Una aprobación descartada o invalidada por
  cambios posteriores no satisface el requisito. El comentario no otorga
  aprobación; CI debe consultar las revisiones reales de la PR.
- Fallar si falta información o no puede comprobarse alguna condición.
- Reevaluar al cambiar comentarios, commits o revisiones. Configurar este check
  como obligatorio y las aprobaciones en la protección de la rama destino.

El workflow SDD gate implementa este contrato. La protección de ramas debe
exigir sus resultados; consultar docs/ci.md para activar el bloqueo de merge.
-->

<!-- sdd-feature:start -->
```json
{
  "schema_version": 1,
  "feature_id": "<feature-id>",
  "feature_status": "archived",
  "required_review_state": "APPROVED"
}
```
<!-- sdd-feature:end -->

## Feature

`<feature-id>`

Estado de cierre: `sdd/features/<feature-id>/state.json`.

## Cambios

<Describir el problema resuelto y el comportamiento que incorpora esta PR.>

## Verificación

<Indicar las comprobaciones realizadas, sus resultados y las limitaciones relevantes.>

## Aprobación

Requiere al menos una aprobación vigente mediante **Approve** en una revisión
de GitHub antes del merge.

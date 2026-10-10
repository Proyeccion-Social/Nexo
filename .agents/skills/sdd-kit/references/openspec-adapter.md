# Adaptación a las skills locales de OpenSpec

## Dependencias y alcance

Resolver el ejecutable openspec mediante PATH o una ruta existente comprobada; no fijar rutas personales en la skill portable. Leer --version y --help cuando falten capacidades conocidas. Obtener raíz con context --json; respetar stores y flags devueltos/seleccionados. La ausencia de raíz no autoriza init del CLI: explicar la dependencia y requerir que el usuario solicite configurar OpenSpec antes de escribir.

Este contrato adopta schema spec-driven para las proyecciones. Si la raíz usa otro schema o una configuración incompatible, reportar el conflicto antes de crear cambios; no cambiar configuración global ni forzar un schema silenciosamente.

Resolver skills en `.agents/skills/openspec-*/SKILL.md`. Si falta una skill necesaria, reportarlo; no simular que se invocó. No modificar archivos generados de OpenSpec. Cargar skill específica cuando su flujo completo sea compatible; para etapas parciales, reutilizar instrucciones del CLI y procedimientos pertinentes, sin fingir que una invocación completa se puede recortar sin adaptación.

## Fuentes de verdad y proyecciones

| Dato | Fuente de verdad | Adaptación |
| --- | --- | --- |
| Identidad, revisiones, aprobaciones | SDD state.json | Mapping explícito a cambio OpenSpec |
| Funcional de la feature | functional/functional.md | proposal y delta specs por capacidad |
| Técnico de la feature | technical/technical.md | design.md; no incluye plan |
| Definición de tareas y evidencia | tasks/tasks.json | tasks.md como proyección de ejecución |
| Progreso durante apply | Checkboxes OpenSpec como recibos de ejecución | Importar con comprobaciones y luego reconciliar JSON |
| Requisitos globales consolidados | Specs por capacidad de OpenSpec | global_functional.md como vista generada con referencias |
| Conocimiento técnico global | sdd/specs/technical/global_technical.md | Consolidación explícita de decisiones técnicas vigentes |

No editar simultáneamente una fuente y su proyección de manera independiente. Si el usuario modifica una proyección fuera de apply autorizado, preservar el cambio y reconciliarlo mediante review antes de sobrescribir. OpenSpec no recibe autoridad sobre aprobaciones SDD.

## Operaciones reales

- `openspec new change <change_name>` crea metadata del cambio; nunca scaffold manual del cambio OpenSpec.
- `openspec status --change <change_name> --json` informa artefactos, dependencias y rutas reales.
- `openspec instructions <artifact_id> --change <change_name> --json` entrega instruction, template, rules, context y dependencias.
- `openspec instructions apply --change <change_name> --json` informa bloqueo y tareas con origen.
- `openspec validate <change_name>` comprueba artefactos OpenSpec; no prueba comportamiento del código.
- `openspec validate --specs` comprueba specs consolidadas.

Comprobar sintaxis y mantener --store cuando corresponda. Usar changeRoot, artifactPaths y rutas concretas resueltas; nunca escribir a un glob. No inventar comandos generate ni asumir que validate entiende documentos SDD o tareas JSON.

## init y generación funcional

Reutilizar openspec-explore para descubrir contexto y aclarar decisiones. No confundir preguntas contestadas con aprobación de documento. El comando init del usuario autoriza producir el funcional dentro del alcance descrito, no otras etapas.

Crear un cambio asociado con new change. Obtener instrucciones de proposal y specs en su orden de dependencias. Redactar el documento funcional SDD con:

- Objetivo, alcance, exclusiones y decisiones confirmadas.
- Requisitos con IDs estables y escenarios WHEN/THEN comprobables.
- Secciones por ruta de capacidad, distinguiendo ADDED, MODIFIED, REMOVED y RENAMED conforme a las instrucciones OpenSpec vigentes.

Materializar proposal y delta specs a partir de ese documento, preservando rutas de capacidades e IDs mediante metadata de mapping en state.artifacts. No inferir operaciones MODIFIED sobre requisitos inexistentes. Mantener las secciones originales no afectadas. No crear design ni tasks durante init aunque propose completo normalmente lo haría.

La revisión funcional abarca el documento funcional y su proyección vigente. Si la representación no puede ser equivalente, plantear la inconsistencia antes de aprobar.

## Técnico y planificación

approve_functional obtiene instrucciones de design y genera documento SDD y proyección equivalente. SDD exige un técnico aunque el schema pueda considerar design condicional; se trata de una exigencia adicional de nuestro flujo, no de alterar el estado del CLI.

approve_technical obtiene instrucciones de tasks. La planificación vive en conversación; design conserva decisiones arquitectónicas y tasks contiene trabajo concreto. No utilizar proposal, design o logs para almacenar una copia del plan.

## Adaptación de tareas y apply

JSON es la fuente de definición. Materializar tasks.md conforme a las instrucciones OpenSpec con un checkbox por tarea, incluyendo ID estable visible y sus criterios pertinentes. Relacionar ID SDD con tarea CLI por contenido, no solo por línea; las líneas cambian.

La proyección tiene checksum registrado. done verificado se representa como [x]; pendientes, bloqueadas o en curso como [ ]. No atribuir a OpenSpec estados JSON que no soporta. Metadata y JSON permanecen fuera del parser de checkboxes.

Antes de apply, comprobar equivalencia de IDs, descripciones, requisitos y progreso; recuperar primero cualquier recibo pendiente. Cargar openspec-apply-change y ejecutarlo inline. Sus actualizaciones de checkboxes son cambios esperados de la proyección durante esta operación, no edición externa.

Reconciliar después de cada checkpoint observable y al terminar o interrumpirse: refresh de instrucciones CLI → comparar IDs y definición → inspeccionar resultado real → registrar evidencia → actualizar tarea JSON → guardar recibo y checksum. Un checkbox marcado sin evidencia suficiente no convierte la tarea SDD en done. Mantenerla en curso/bloqueada según el resultado, ajustar la proyección y realizar la comprobación o reparación específica antes de volver a apply. No duplicar tareas ni repetir trabajo ya comprobado.

Si no se puede observar progreso incremental de la skill, registrar la ventana de ejecución y reconciliar sus cambios antes de otra operación; ante interrupción, usar archivos y evidencia. No prometer callback o mecanismo de delegación inexistente.

Solo pasa a merging_specs cuando JSON, checkboxes y evidencia coinciden y la cobertura funcional/técnica está verificada. Un fallo de validación OpenSpec bloquea también el avance, pero su éxito no sustituye comprobaciones de código.

## review

Cargar openspec-update-change para reconciliar artefactos existentes cuando el alcance sea compatible. Sin observaciones, usar su análisis y presentar propuestas sin mutar. Si la skill pide confirmación para una revisión adicional, presentar el cambio específico; no inventar una confirmación. La autorización explícita del usuario sigue siendo el límite.

Aplicar primero cambios a las fuentes SDD y reconciliar sus proyecciones bajo la misma operación. Si el workflow de update escribe proyecciones, importar a la fuente solo una edición confirmada y equivalente; no mantener divergencia. Artefactos inexistentes se generan con instructions y una operación de la etapa apropiada, no invocando update como generador universal.

Invalidar aprobaciones y tareas afectadas conforme a SKILL.md. Si el cambio implica una intención nueva, proponer una feature separada antes de alterar la identidad existente.

## Consolidación y archivo

Reutilizar openspec-sync-specs: merges semánticos de requisitos, reglas de preservación, validación e idempotencia. Ejecutar inline y terminar antes del movimiento. Seguir sus condiciones para nuevas capacidades y retiro; no copiar delta headers a specs globales.

Generar global_functional.md como vista de specs consolidadas, organizada por capacidad, con referencias a sus fuentes. Si el documento ya contiene contenido no generado o ediciones independientes, migrar/reconciliarlo antes de regenerar; no descartarlo.

Consolidar global_technical.md comparando decisiones anteriores y cambios técnicos aprobados. Identificar decisiones añadidas, sustituidas o retiradas y feature de origen; preservar decisiones fuera del alcance. No trasladar automáticamente todo design al global ni tratarlo como un delta funcional. Contradicciones relevantes requieren resolución antes de escribir.

Reutilizar openspec-archive-change cuando se satisfagan sus precondiciones y confirmaciones. Nuestro contrato no permite sus alternativas de archivo incompleto o sin sync. Si su movimiento no puede coordinarse con el journal SDD, usar la operación archive del CLI con sintaxis comprobada, después de sync verificado y sin flags que evadan validación. Registrar dónde quedó el cambio; OpenSpec mantiene su destino real y SDD mantiene sdd/features/<feature_id>.

Estos son dos archivos vinculados por mapping, no dos estructuras de feature SDD distintas. No redirigir manualmente la raíz del CLI ni aplicar un segundo sync por accidente. Seguir el journal de contracts.md para completar o recuperar ambas operaciones.

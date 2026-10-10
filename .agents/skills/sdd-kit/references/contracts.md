# Contratos SDD

## Versionado y formatos

Usar schema_version: 1. JSON inválido o versión incompatible bloquea mutaciones; no regenerar el archivo silenciosamente. Conservar campos adicionales compatibles. Timestamps en ISO 8601 UTC; presentar fechas al usuario según su zona. Hashes SHA-256 de bytes UTF-8 reales, no de un resumen conversacional.

## Identidad y selección

feature_id tiene forma `<número positivo>-<slug kebab-case>`. slug comienza con letra ASCII; normalizar acentos y espacios para el nombre y conservar la descripción original. Número máximo entre ambas carpetas más uno. Leer state.json de candidatas existentes para detectar identidades inconsistentes; ante inconsistencias, detener reserva y reportar. Si se eliminaron identidades del historial, no garantizar continuidad: recuperar el registro antes de numerar de nuevo.

Mantener mapping OpenSpec separado. Proponer `sdd-<feature_id>` como nombre compatible, comprobar restricciones reales y colisiones antes de crear. No usar el ID SDD directamente si el CLI lo rechaza.

## state.json

Campos obligatorios:

| Campo | Tipo y contrato |
| --- | --- |
| schema_version | Entero 1 |
| feature_id, slug, description | Strings; identidad estable y descripción del usuario |
| git | En features nuevas: {branch, base_branch, base_sha, created_at}; branch = `feature/<feature_id>`, inmutable. Datos históricos pueden no tenerlo. |
| number, revision | Enteros positivos; revision aumenta al escribir estado |
| status | Uno de los siete estados definidos por SKILL.md |
| created_at, updated_at | Timestamps |
| openspec | root, change_name, schema_name, change_root, archive_path nullable; rutas resueltas y verificadas |
| artifacts | Por documento: path relativo, revision, sha256, inputs y valid boolean |
| approvals | functional y technical, null o {artifact_sha256, approved_at, source}; source identifica la invocación explícita, nunca un aprobador inventado |
| operation | null o {id, command, phase, started_at, input_hashes, receipts, error}; IDs de operación únicos |
| verification | {status: pending/pass/fail/blocked, inputs, evidence}; evidencia ligada a documentos, tareas y versión del código comprobada |
| history | Eventos breves de transición, invalidación y reanudación, sin copiar conversaciones ni planes |

No borrar aprobaciones históricas: registrar invalidación en history y limpiar aprobaciones activas afectadas. El estado OpenSpec de existencia de archivos no sustituye status ni approvals SDD.

Cambios externos a artefactos: conservar contenido, marcar derivados inválidos y solicitar review. Detectar diferencias de formato mediante hash también invalida de forma conservadora; no aprobar automáticamente por parecer equivalente. Cambios externos en JSON de tareas requieren validar y reconciliar antes de ejecutar.

## plan/metadata.json

Campos: schema_version, plan_id, revision, created_at, input_hashes {functional, technical}, tasks_revision, status (draft/complete/invalid), conversation_ref nullable.

No contiene plan, resumen, pasos ni texto de conversación. No guardar el plan en logs, otra carpeta o en los artefactos OpenSpec. No prometer controlar almacenamiento interno de la aplicación. Regenerar la planificación si se pierde el contexto antes de obtener tareas válidas.

## tasks/tasks.json

Objeto {schema_version: 1, revision, plan_revision, tasks: [...]}.

Cada tarea: id estable (T001, T002…), title, description, requirement_ids, depends_on, acceptance_criteria, status, evidence y history. depends_on y requirement_ids son arrays de IDs existentes; acceptance_criteria es un array de resultados comprobables; status: pending/in_progress/blocked/done. evidence contiene comprobaciones, resultados y referencias a código o salidas pertinentes, sin secretos. IDs no se reciclan al revisar tareas.

Validar IDs únicos, referencias existentes, ausencia de ciclos y cobertura de todos los requisitos del alcance vigente. Una feature implementable requiere tareas concretas; si no hay trabajo de código, las tareas pueden producir documentación u otro entregable explícito, sin fingir implementación.

done exige comportamiento completo y evidencia; comprobaciones obligatorias bloqueadas no cuentan como pass. No marcar como done una excepción, trabajo parcial o diferido. Afectar una tarea terminada por una revisión reabre su trabajo conservando evidence anterior en history. Cambios al código después de verificar invalidan la evidencia relacionada hasta comprobar de nuevo.

## Interrupciones e idempotencia

Persistir operation antes de un paso con efectos. Cada recibo registra acción, rutas e input/output hashes y resultado observado. Tras interrupción, releer archivos, comprobar recibos y continuar desde el primer paso no verificado. No usar la memoria del chat como evidencia.

Una repetición tras éxito devuelve el resultado existente cuando los inputs y la etapa coinciden. No implica que dos descripciones iguales sean necesariamente la misma feature: aclarar la intención de creación si hay una coincidencia plausible.

Fallo al producir un técnico: mantener pending_functional_review y registrar la aprobación funcional y progreso, permitiendo reanudar approve_functional. Fallo al producir tareas: mantener pending_technical_review y registrar progreso. Fallo durante init: conservar drafting_functional y permitir reanudación explícita sobre la identidad ya reservada.

## Escritura y concurrencia

Antes de mutar, disponer de exclusión de escritura real del proyecto SDD y sus proyecciones OpenSpec durante esa operación. Para sesiones largas, liberar durante preguntas/revisiones humanas y revalidar inputs al adquirir de nuevo. Implementar con creación exclusiva o mecanismo de locking del runtime, no con una simple comprobación de existencia.

Registrar propietario, operación y momento del lock. Ante otro propietario activo, detener esta mutación. No robar un lock por antigüedad sin comprobar si el proceso sigue activo y resolver su recuperación. La exclusión debe ser respetada por todas las invocaciones sdd-kit; ediciones externas se detectan mediante hashes.

Validar rutas reales dentro de las raíces autorizadas. Escribir un temporal en la misma carpeta, validar su contenido y reemplazar el archivo usando una operación atómica soportada por el sistema; releer el resultado. Comprobar que las entradas no cambiaron antes de sustituirlas. No concatenar comandos de shell con entrada del usuario.

Estas son exigencias al adaptador, no garantías obtenidas mediante texto. Si el entorno no proporciona primitivas fiables, detener escrituras compartidas y reportar la capacidad ausente, sin afirmar protección transaccional.

## Recuperación de archivo

No existe una transacción única automática entre OpenSpec y SDD. Usar un journal durable en state.operation, respaldos de archivos afectados y recibos para una operación recuperable:

1. prepare: verificar inputs, destino, conflictos y respaldo de specs existentes, incluyendo cuáles aún no existían.
2. sync: consolidar specs OpenSpec y comprobar resultado.
3. globals: generar la proyección funcional y consolidar conocimiento técnico SDD; comprobar ambos.
4. openspec_archive: archivar una vez y registrar la ubicación real.
5. sdd_move: mover carpeta completa al destino sin sobrescribir.
6. complete: confirmar integridad y escribir archived en state.json del destino.

Tras un movimiento, buscar la operación en el destino y validar identidad antes de interpretar como feature ausente. Si aparece en ambas ubicaciones con contenido distinto, parar y reportar conflicto.

Reanudar por recibos; comprobar si OpenSpec ya fue archivado antes de ejecutarlo otra vez. Un fallo mantiene merging_specs y error de operación aunque la carpeta ya esté en features/. No permitir review/implement mientras haya archivo parcial sin resolver.

Los respaldos y recibos de recuperación viajan con la carpeta cuando existan; no contienen el plan. No restaurar un respaldo sobre ediciones posteriores o ajenas. Si no puede recuperarse con certeza, conservar ambos estados y pedir la decisión necesaria. Reportar éxito solo cuando specs y ambos archivos están comprobados.

# Especificación funcional: flujo de ramas SDD

## Objetivo

Hacer que cada feature SDD tenga una rama Git identificable y trazable, y que las instrucciones de la PR indiquen la estrategia de integración acordada para cada ruta de entrega.

## Alcance

- La skill `sdd-kit` crea una rama local `feature/<feature_id>` al iniciar una feature nueva, antes de escribir sus documentos o código.
- La skill prefiere `develop` como base cuando existe. Si no existe, solo continúa desde una rama de integración confirmada y registra la decisión; no crea ramas base ni de release automáticamente.
- El estado de cada feature nueva registra la rama, la rama base, el commit base y la fecha de creación. Las etapas posteriores exigen permanecer en la rama registrada.
- La plantilla de PR documenta **Squash and merge** para `feature/*` hacia `develop` y para `release/*` hacia `main`, y conserva la exigencia de aprobación de GitHub y de checks obligatorios.
- Archivar la feature SDD no fusiona la rama ni publica cambios.

## Exclusiones

- Crear `develop` o ramas `release/*`, abrir PR, hacer commit, push o merge.
- Implementar el CI que valida el comentario de PR; esta feature solo conserva la plantilla y las reglas de documentación del merge.
- Cambiar el comportamiento de la aplicación NestJS.

## Requisitos

### FR-001: Rama por feature y trazabilidad
La skill SHALL crear una rama `feature/<feature_id>` antes de escribir artefactos de una feature nueva y registrar su rama base y commit inicial en `state.json`.

#### Scenario: Inicio con develop disponible
- **WHEN** una feature nueva se inicia y existe la rama `develop`
- **THEN** el flujo crea `feature/<feature_id>` desde `develop` y conserva los datos de base en el estado

#### Scenario: Inicio sin develop
- **WHEN** una feature nueva se inicia y no existe `develop`
- **THEN** el flujo solo usa la rama actual si su función de integración está confirmada y no crea ramas base por su cuenta

#### Scenario: Cambios locales pendientes
- **WHEN** el cambio de rama mezclaría modificaciones o archivos sin seguimiento existentes
- **THEN** el flujo se detiene sin hacer stash, stage ni descartar esos cambios, e informa cómo continuar o aislar el trabajo

### FR-002: Operaciones en la rama registrada
Las etapas de aprobación, revisión, implementación y archivo SHALL exigir la rama `feature/<feature_id>` registrada y SHALL detenerse ante una discrepancia sin crear commits ni publicar la rama.

#### Scenario: Rama distinta a la registrada
- **WHEN** se solicita una etapa posterior desde otra rama
- **THEN** el flujo no muta la feature y entrega el comando para volver a su rama registrada

### FR-003: Estrategia de merge documentada
La plantilla de PR SHALL indicar **Squash and merge** para `feature/*` hacia `develop` y `release/*` hacia `main`, además de requerir un Approve vigente de GitHub y checks obligatorios.

#### Scenario: PR de feature
- **WHEN** se prepara una PR de una rama `feature/*`
- **THEN** la plantilla indica `develop` como destino y Squash and merge como estrategia

#### Scenario: PR de release
- **WHEN** se prepara una PR de una rama `release/*`
- **THEN** la plantilla indica `main` como destino y Squash and merge como estrategia

#### Scenario: Archivar una feature
- **WHEN** se archiva una feature en SDD
- **THEN** la rama permanece local y no se hace merge ni push automáticamente

## Suposiciones

- `main` es la base de integración disponible en este repositorio porque `origin/HEAD` apunta a `origin/main` y no existe una rama `develop` local o remota.
- La documentación de merge describe el flujo esperado aunque `develop` todavía no exista en el remoto.

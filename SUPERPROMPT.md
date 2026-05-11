# SUPERPROMPT.md — Prototipo de Agrupación por Grupos (C360 / ROBOTIX)

> Spec viva v5 para Claude Code. Construye un prototipo aislado de la feature "Agrupar por Grupos" sobre la pantalla "Mi alumnado: Progreso por unidad didáctica" del C360. Usa datos mock desde Supabase. Persiste solo composición de grupos en localStorage. No toca producción.

> Para el historial de iteraciones v1→v4 ver `git log`. Este documento describe **únicamente** el estado v5.

---

## 1. Contexto

- **Producto**: prototipo de la feature "Agrupar por Grupos" para el programa C360 SuperNova Yellow de ROBOTIX.
- **Objetivo**: validar la UX de agrupación (2-4 alumnos por robot) antes de integrarla en el C360 real.
- **Pantalla destino**: réplica visual de "Mi alumnado: Progreso por unidad didáctica" (lista de alumnos con columnas de progreso por unidad).
- **Repo**: aislado en `robotix_group_prototype/`. **No tocar el C360 existente.**
- **Persistencia**: localStorage solo de `pods` (composición, sin `evaluation`) y `lastRobotCount`. Bloqueos y semáforos se pierden al cerrar pestaña. Los pods sobreviven a refrescos.
- **Mock data**: tablas `students` y `classes` ya creadas en Supabase de test.

Si la validación va bien, se integrará en el C360 real. Esa integración no forma parte de este prompt.

---

## 2. Mejoras respecto a v4

| Cambio | v4 | v5 |
|---|---|---|
| Botones de barra | `Agrupar` + `Reagrupar` (menú 4 modos) + segmented `[Alfabético\|Por grupos]` + `Evaluar` + `Snapshot` + `Historial` | **Un solo botón** que en `alphabetical` dice "Reagrupar" y en `grouped` dice "Volver a lista" |
| Checkbox "Vista con POD" | Sí | **Eliminado** (se infiere de `sortMode`) |
| Historial | `useHistoryStore` con snapshots, evaluaciones por sesión, matriz coocurrencia | **Eliminado entero** |
| Evaluación | Modal "Evaluar sesión" | **Semáforo por grupo** (🟢🟡🔴) en la cabecera de cada pod. No persiste; reset al reagrupar |
| Candados | `pod.isLocked` (cabecera) + `lockedStudentIds` (individuales) condicionales | **Solo candado individual**, siempre visible, no persiste |
| Modal Agrupar | 2 campos numéricos + Zod | + **selector de modo** (Aleatorio/Compensada/Por niveles/Por avance), pre-rellenado de presentes (auto) y robots (`lastRobotCount`) |
| Defaults | min=3 max=4 con cap silencioso | **min=2 max=4 con error duro** si `presentCount` fuera del rango |
| Persist | v5: incluía evaluación, historial, currentSeed... | v6: solo `{ pods (evaluation=null), lastRobotCount }` |
| `regroupConfirmNeeded` | Sí, dispersaba `set({ regroupConfirmNeeded: false })` en cada acción | **Eliminado** |
| Drag handle | `GripVertical` (6 puntos en 2×3) | Sin cambios |
| Modo Proyección | Sin cambios | Sin cambios |

---

## 3. Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15.5 (App Router) |
| Lenguaje | TypeScript 5.7, `strict` + `noUncheckedIndexedAccess` |
| UI | Tailwind v4 con `@theme`, tokens `c360-*` y `grade-*` |
| UI state | Zustand v5 con `persist` middleware y selectors granulares |
| Server state | Tanstack Query v5 (todo data-fetching) |
| DnD | `@dnd-kit/core` + `/sortable` (sensors: PointerSensor distance 4 + KeyboardSensor) |
| Validación | Zod v4 |
| Backend datos | Supabase **solo lectura** vía `@supabase/ssr` |
| Tests | Vitest 4 (solo lógica pura en `lib/pods/*`) |
| Iconos | `lucide-react` exclusivamente |

Convenciones detalladas en `SKILLS_PROTOTYPE_GROUPS.md`. No instalar dependencias adicionales sin justificación.

---

## 4. Conexión Supabase (mock)

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://andprbqacpspbxmqqxuj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable__-RDC0rLI9Rg2iARjbOnXA_t2uICKYK
```

Publishable/anon key, pública por diseño (RLS protege los datos).

### Tablas relevantes

- **`students`**: `id`, `full_name`, `initials`, `avatar_url`, `class_id`, `created_at`.
- **`classes`**: `id`, `name`, `subject`, `created_at`.

**Solo lectura.** Cero inserts/updates/deletes desde el prototipo.

---

## 5. Comportamiento detallado (v5)

### 5.1 Carga inicial

- **Sin pods persistidos**: vista alfabética sin badges. Botón "Reagrupar" arriba a la derecha.
- **Con pods persistidos**: vista alfabética con badges informativos en cada fila (a qué grupo pertenecía). Botón "Reagrupar" disponible.

En ambos casos `lockedStudentIds=[]`, cada `pod.evaluation = null` y `sortMode = 'alphabetical'` (no se persisten).

### 5.2 Botón "Reagrupar" (modo alphabetical)

Pulsar abre `PodGroupingModal`:

```
┌─────────────────────────────────────────────┐
│  Reagrupar                                  │
│  Cada grupo tendrá entre 2 y 4 alumnos.     │
│                                             │
│  Modo:                                      │
│  ┌──────────────┬──────────────┐            │
│  │ Aleatorio    │ Compensada   │            │
│  ├──────────────┼──────────────┤            │
│  │ Por niveles  │ Por avance   │            │
│  └──────────────┴──────────────┘            │
│                                             │
│  Alumnos presentes hoy: [30]                │
│  Robots disponibles:    [8]                 │
│                                             │
│              [Cancelar]   [Reagrupar]       │
└─────────────────────────────────────────────┘
```

- **Modo** (default `Aleatorio`): 4 opciones mutuamente excluyentes con descripción breve.
- **Alumnos presentes**: pre-rellenado con `students.length`. Editable [1..students.length] para excluir ausentes.
- **Robots disponibles**: pre-rellenado con `lastRobotCount` si existe; si no, `Math.ceil(presentes/4)` acotado a [1, MAX_PODS=15].

Validación Zod (`lib/pods/grouping-schema.ts`):

- Ambos enteros ≥ 1.
- `robotCount ≤ 15`.
- `robotCount ≤ presentCount`.
- `presentCount ∈ [robotCount*2, robotCount*4]`. Si no: error claro `"No se puede distribuir N alumnos en M grupos respetando min 2 y max 4."`

Al confirmar, según modo:
- **Aleatorio sin pods previos** → `createPods`.
- **Aleatorio con pods** → `regroupWithLocks` (mantiene emojis/colores).
- **Compensada / Por niveles** → `createPodsByLevel` con `{ scoreFn: getStudentScore, lockedStudentIds, currentPods }`.
- **Por avance** → `createPodsByProgress` con `{ scoreFn: getStudentOverallScore, progressFn: getStudentProgress, lockedStudentIds, currentPods }`.

En todos los casos: `pod.evaluation` se reinicia a `null`, `sortMode` pasa a `'grouped'`, `lastRobotCount` se guarda.

### 5.3 Botón "Volver a lista" (modo grouped)

Pulsar ejecuta `setSortMode('alphabetical')`. No toca pods, candados, ni semáforos.

### 5.4 Vista grouped

Cada pod renderiza un `<tbody>` con cabecera:
- Emoji + nombre del grupo editable (popover de emoji al click en el emoji vía `PodHeaderTrigger`).
- **Semáforo** (`PodEvaluationRadio`): 3 botones radio (🟢 🟡 🔴). Click asigna; click en el seleccionado deselecciona (`null`). Selección visual con `ring-2 ring-<color>` (no solo background).
- Contador `N de 4 alumnos`.

Cada fila de alumno (`StudentRowDraggable`):
- **Candado individual siempre visible**: icono `Lock`/`Unlock`. Bloqueado = fondo amarillo y `aria-pressed=true`.
- **Handle DnD** (`DragHandle`): `GripVertical` (6 puntos en 2×3).
- Resto: badge + nombre + columnas de progreso.

Al final, un botón "Crear nuevo grupo" si `pods.length < 15`.

### 5.5 Drag & drop

- `DndContext` con `pointerWithin`, sensors `PointerSensor({distance: 4})` + `KeyboardSensor`.
- Drop en pod lleno → ring rojo, banner `role="alert"` 2.5s con `MOVE_ERROR_MESSAGES.destination-pod-full`.
- Drop en pod libre → animación de entrada, actualización inmediata.
- Anuncios ARIA en castellano (announcements + screenReaderInstructions).

### 5.6 Modo Proyección

`PodProjectionButton` abre `PodProjectionModal` a pantalla completa con cada pod como card grande (emoji + nombre del grupo + lista de alumnos). Sin cambios respecto a v4.

---

## 6. Función pura `createPods` (lib/pods/create-pods.ts)

```ts
type PodEvaluation = 'green' | 'amber' | 'red' | null;

type Pod = {
  id: string;          // 'pod-1', 'pod-2', ...
  emoji: string;       // 🤖, 🚀, ...
  emojiLabel: string;
  color: PodColor;     // { name, hex, textOn }
  students: Student[];
  maxCapacity: number;
  evaluation: PodEvaluation;
};

type CreatePodsInput = {
  students: Student[];
  presentCount: number;
  robotCount: number;
  maxPerPod?: number;   // default DEFAULT_MAX_PER_POD = 4
  minPerPod?: number;   // default DEFAULT_MIN_PER_POD = 2
  seed?: string;
  random?: () => number;
};

function createPods(input: CreatePodsInput): { pods: Pod[]; seed: string };
```

### Reglas

1. Toma los primeros `presentCount` alumnos como pool.
2. Crea `robotCount` pods con emojis únicos (Fisher-Yates con seed) y colores únicos (furthest-point sampling sobre paleta de 15).
3. Reparto balanceado: `base = floor(presentCount/robotCount)`, `extra = presentCount % robotCount`. Primeros `extra` pods reciben `base+1`, resto `base`.
4. **Validación dura** (cambio v5): throw si `presentCount < robotCount*minPerPod` o `presentCount > robotCount*maxPerPod`. Mensaje: `distributionErrorMessage(...)` = `"No se puede distribuir {N} alumnos en {M} grupos respetando min {min} y max {max}."`
5. Throw también si: `robotCount > 15`, `robotCount > presentCount`, `presentCount > students.length`, valores no enteros.
6. Cada pod nace con `evaluation: null`.

### Variantes

- **`createPodsByLevel({ ..., mode: 'mixed' | 'leveled', scoreFn, lockedStudentIds?, currentPods? })`**: respeta candados — alumnos lockeados mantienen su pod-id si éste existe en el reparto nuevo; los free se distribuyen por score respetando `freeSlots[i] = max - lockedByPodIndex[i]`. En modo `leveled` mantiene balance via `targetSize = base+extra` y redistribuye overflow. En modo `mixed` zigzag saltando pods saturados.
- **`createPodsByProgress({ ..., progressFn, scoreFn, ... })`**: wrapper que compone `score = progress*1000 + score` y llama `createPodsByLevel` modo `leveled`.
- **`createEmptyPod({ existing, ... })`**: pod vacío adicional con emoji/color únicos para "Crear nuevo grupo".

### `regroupWithLocks` (lib/pods/regroup-with-locks.ts)

Mantiene emojis/colores de los pods actuales. Solo redistribuye alumnos no bloqueados respetando capacidad. **Resetea `evaluation: null` en cada pod devuelto.**

---

## 7. Estructura de archivos (v5)

```
app/
  layout.tsx, providers.tsx, globals.css   ← tokens c360-* y grade-* en @theme
  mi-alumnado/page.tsx                     ← renderiza <AppShell />

components/
  layout/
    AppShell.tsx, Sidebar.tsx, TopBar.tsx, ClassSelector.tsx, StoresHydrator.tsx
  pods/
    PodMainButton.tsx                      ← botón único Reagrupar / Volver a lista
    PodGroupingModal.tsx                   ← modal con selector de modo + counts
    PodEvaluationRadio.tsx                 ← semáforo 3 colores en cabecera
    PodBadge.tsx, PodBadgeWithDropdown.tsx
    PodChangeDropdown.tsx                  ← cambiar de grupo manualmente
    PodHeaderTrigger.tsx                   ← editor de emoji
    PodEmojiPicker.tsx
    PodDroppableTbody.tsx                  ← tbody droppable por pod (drop inválido si full)
    PodProjectionButton.tsx, PodProjectionModal.tsx
  students/
    StudentTable.tsx                       ← tabla principal + DndContext + PodSectionHeaderRow
    StudentRow.tsx, StudentRowDraggable.tsx
    DragHandle.tsx                         ← GripVertical
    ScoreLegend.tsx
  ui/
    Button.tsx, Input.tsx, Modal.tsx, Checkbox.tsx, SegmentedControl.tsx, ConfirmDialog.tsx

hooks/
  useClasses.ts, useStudents.ts            ← Tanstack Query

lib/
  pods/
    create-pods.ts                         ← createPods, createPodsByLevel, createPodsByProgress, createEmptyPod, distributionErrorMessage
    move-student.ts                        ← addStudentToPod, moveStudent, removeStudentFromPod, MOVE_ERROR_MESSAGES
    edit-pod.ts                            ← changePodEmoji
    regroup-with-locks.ts                  ← regroupWithLocks (reset evaluation)
    grouping-schema.ts                     ← Zod schema del modal
    pod-colors.ts, pod-emojis.ts, seeded-random.ts, student-score.ts
  supabase/client.ts                       ← getSupabaseBrowserClient (singleton cached)
  utils/cn.ts, sort-students.ts, progress-cells.ts, popover-position.ts
  data/units.ts                            ← 6 unidades x actividades hardcoded

store/
  pods-store.ts                            ← Zustand persist v6

types/
  database.ts                              ← StudentRow, ClassRow, Database

__tests__/pods/
  create-pods.test.ts, create-pods-by-level.test.ts,
  edit-pod.test.ts, move-student.test.ts, regroup-with-locks.test.ts
```

**Eliminados de v4** (no recrear): `useHistoryStore`, `PodHistory*` (3), `PodEvaluate*` (2), `PodSortControl`, `PodLockButton`, `PodControls`, `PodSaveSnapshotButton`, `PodCreateGroupsButton`, `PodRegroupButton`, `PodRegroupMenu`, `PodRegroupSelectionBanner`, `co-occurrence.ts`.

---

## 8. Store (`pods-store.ts`)

```ts
type State = {
  pods: Pod[];
  lockedStudentIds: string[];
  sortMode: 'alphabetical' | 'grouped';
  lastRobotCount: number | null;
};

type Actions = {
  createOrRegroup(input: {
    mode: 'random' | 'mixed' | 'leveled' | 'by-progress';
    presentStudents: Student[];
    robotCount: number;
    scoreFn?: (studentId: string) => number;
    progressFn?: (studentId: string) => number;
  }): void;
  resetPods(): void;
  setSortMode(mode: SortMode): void;
  setLastRobotCount(n: number | null): void;
  setPodEvaluation(podId: string, rating: PodEvaluation): void;
  moveStudent(studentId, toPodId): MoveStudentResult;
  addStudentToPod(student, toPodId): MoveStudentResult;
  removeStudentFromPod(studentId): MoveStudentResult;
  toggleStudentLock(studentId): void;
  addEmptyPod(): void;
  createPodAndAssignStudent(student, emoji, emojiLabel): void;
  changeEmoji(podId, emoji, emojiLabel): ChangeEmojiResult;
};
```

**Persist middleware (version 6):**
- `name: 'c360-pods-state'`, `skipHydration: true`.
- `partialize: state => ({ pods: state.pods.map(p => ({...p, evaluation: null})), lastRobotCount: state.lastRobotCount })`.
- `migrate: (state, version) => version < 6 ? {...INITIAL} : state`. Cambio de esquema irreconciliable con v5 anterior; descartar es lo correcto.
- `<StoresHydrator />` ejecuta `usePodsStore.persist.rehydrate()` en `useEffect`.

**NO persisten:** `lockedStudentIds`, `sortMode`, `pod.evaluation`.

---

## 9. Tests obligatorios

Solo en `__tests__/pods/*`. **Sin tests de UI, integración o E2E** en este prototipo.

| Archivo | Cobertura |
|---|---|
| `create-pods.test.ts` | Reparto balanceado, seed reproducible, errores duros (min/max), 18/9 mínimo permitido, 24/6, 22/6, 18/5, 20/5, errores robot>present y max grupos |
| `create-pods-by-level.test.ts` | Modos leveled/mixed/by-progress, respeto a locks, capacidad con locks, evaluation: null |
| `regroup-with-locks.test.ts` | Con/sin locks, capacidad, reset de evaluation, errores |
| `move-student.test.ts` | move/add/remove ok y errores (full, not-found) |
| `edit-pod.test.ts` | changePodEmoji ok y errores |

`npm test` debe pasar ≥ 76 verdes. `npm run typecheck` verde sin warnings.

---

## 10. Reglas duras de implementación

1. **Cero feature creep.** Si el SUPERPROMPT no lo pide y el humano no lo pidió en este turno, no se hace.
2. **Cero integración Moodle.** No LTI, gradebook, Workplace, audiences, programs, plugin PHP.
3. **Ningún archivo del C360 real se toca.** Este prototipo vive en su propio repo.
4. **Cero persistencia más allá de composición.** No tabla `pods` en Supabase. No escrituras desde el prototipo.
5. **Tipos estrictos.** Cero `any`. Cero `as` salvo tras `z.parse`.
6. **Sin `@ts-ignore` / `@ts-expect-error`** salvo autorización explícita.
7. **Strings en castellano hardcoded.** Sin i18n.
8. **Cero comentarios decorativos.** Solo donde el "por qué" no es obvio.
9. **Tests obligatorios pasando.** Si rompes uno con tu refactor, arréglalo o revierte. Nada de `.skip`.
10. **Selectors granulares en Zustand.** `const x = useStore(s => s.x)`. Prohibido destructurar el store entero.
11. **Tanstack Query para todo data-fetching.** `useEffect + fetch/supabase` prohibido en componentes.
12. **Tokens C360** (`bg-c360-*`, `bg-grade-*`). Nunca `bg-[#xxxxxx]` con hex inventado.
13. **Tras cada fase**: explicar, probar (`npm run typecheck` + `npm test`), commit + push, actualizar §12 de este doc, esperar OK del humano.

Detalle completo en `SKILLS_PROTOTYPE_GROUPS.md`.

---

## 11. Resultado final esperado (v5)

El prototipo v5 es correcto si:

1. `/mi-alumnado` carga 30 alumnos reales desde Supabase mock (clase "2º Bachillerato A").
2. Sin pods previos: vista alfabética sin badges, botón "Reagrupar" visible.
3. Con pods previos guardados: vista alfabética con badges, botón "Reagrupar".
4. Pulsar "Reagrupar" abre modal con 4 modos y campos pre-rellenados (presentes=auto, robots=lastRobotCount o auto).
5. Confirmar 24/6 Aleatorio → 6 grupos de 4, vista cambia automáticamente a grouped.
6. Confirmar 30/3 → error "No se puede distribuir 30 alumnos en 3 grupos respetando min 2 y max 4." dentro del modal, sin cerrarlo.
7. Confirmar 18/9 Aleatorio → 9 grupos de 2 (caso mínimo permitido).
8. En vista grouped, cada cabecera muestra emoji + 3 botones del semáforo + contador.
9. Click en 🟢 selecciona; click otra vez deselecciona (vuelve a null).
10. Cada fila muestra candado individual (siempre visible) + handle de 6 puntos + nombre.
11. Click en candado bloquea/desbloquea al alumno con feedback visual (amarillo).
12. Arrastrar A→B (libre) → mueve y actualiza badge.
13. Arrastrar a pod lleno → ring rojo + banner `role="alert"` 2.5s, no se mueve.
14. Botón cambia a "Volver a lista" → vista alfabética con badges, pods siguen.
15. Reagrupar con modo Compensada/Por niveles/Por avance → respeta candados individuales, resetea todos los semáforos a null.
16. Botón Proyección abre vista a pantalla completa con card por grupo (emoji grande + nombre + alumnos).
17. Cerrar pestaña + reabrir: pods persisten (sin evaluation), `lockedStudentIds=[]`, `sortMode='alphabetical'`, `evaluation=null` en todos los pods.

---

## 12. Estado actual de la implementación (post-v5, mayo 2026)

### 12.1 Resumen ejecutivo

Prototipo **funcionalmente completo según spec v5**. Sirve en `localhost:3000/mi-alumnado`. Conectado a Supabase real (clase "2º Bachillerato A", 30 alumnos). 76 tests verde. TypeScript strict sin errores.

### 12.2 Decisiones técnicas vigentes

- **`DEFAULT_MAX_PER_POD = 4`, `DEFAULT_MIN_PER_POD = 2`.** Validación dura en `createPods` y `createPodsByLevel`: throw con `distributionErrorMessage` si `presentCount` fuera del rango.
- **`createPodsByLevel` con `{ lockedStudentIds, currentPods }` opcionales**: lockeados mantienen su pod-id original si el pod aún existe en el reparto; libres se distribuyen por score respetando `freeSlots[i]`.
- **Modo `leveled` con balance**: `targetSize = base+extra` sobre todos los presentes; si un pod queda saturado por locks, redistribuye el overflow a otros pods con espacio.
- **Modo `mixed` con zigzag** (boustrophedon) saltando pods sin freeSlots disponibles.
- **`regroupWithLocks` resetea `evaluation: null`** en cada pod devuelto.
- **Persist v6**: descarta cualquier estado anterior (esquema irreconciliable: `Pod.isLocked` → `Pod.evaluation`, fuera de history-driven keys).
- **`tsconfig.json` excluye `codex/`** (snapshot inmutable que rompía el typecheck al refactorizar módulos que él referencia).
- **`PodMainButton`** abre el modal en `alphabetical`, cambia `sortMode` directamente en `grouped`. Sin estado intermedio.

### 12.3 Validaciones / errores

| Punto | Caso | Mensaje |
|---|---|---|
| Modal (Zod + lib) | Distribución imposible | `No se puede distribuir N alumnos en M grupos respetando min 2 y max 4.` |
| `createPods` | `robotCount > presentCount` | `Hay más robots que alumnos` |
| `createPods` | `robotCount > 15` | `Máximo 15 grupos permitidos` |
| `createPods` | `presentCount > students.length` | `No hay tantos alumnos en clase` |
| DnD | Pod destino lleno | Banner rojo `role="alert"` 2.5s |
| `createEmptyPod` | `existing.length >= 15` | `Máximo 15 grupos permitidos` |
| `createEmptyPod` | No quedan emojis | `No quedan emojis disponibles` |

### 12.4 Tests

76 tests verde:
- `create-pods.test.ts` (24)
- `create-pods-by-level.test.ts` (15)
- `regroup-with-locks.test.ts` (10)
- `move-student.test.ts` (12)
- `edit-pod.test.ts` (15)

`npm test`, `npm run typecheck` ambos verdes.

### 12.5 Limitaciones / gaps conocidos

- Sin tests de UI ni E2E (out of scope deliberadamente).
- Modal Agrupar no previsualiza cuántos grupos saldrán (UX nice-to-have).
- Modal no recuerda el modo elegido (siempre vuelve a `Aleatorio` al abrir).
- El semáforo per-pod no se exporta (se pierde al cerrar pestaña, comportamiento esperado).
- Migración v5→v6 descarta el estado: usuarios con pods en formato viejo verán lista vacía al primer arranque tras actualizar.

### 12.6 Historial de commits relevantes (refactor v5)

```
2a691ed feat(ui): modal Agrupar con selector de modo, defaults min2 max4 y error duro
46bfa64 feat(ui): candados siempre visibles, semaforo por grupo, icono dnd 6 puntos
13b827f feat(ui): boton unico con doble funcion reagrupar/volver
6ccdc98 refactor(store): unificar createOrRegroup, Pod.evaluation, persist v6
1a56572 refactor: eliminar historial, evaluacion por sesion y candado de grupo
```

### 12.7 Cómo arrancar la próxima sesión

```bash
cd robotix_group_prototype
npm install                # solo si node_modules cambió
npm run dev                # http://localhost:3000/mi-alumnado
npm test                   # 76/76 verde
npm run typecheck          # verde
```

`.env.local` necesita `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (formato `sb_publishable_*`).

---

*SUPERPROMPT.md v5.0 — Prototipo Grupos (C360 / ROBOTIX). Spec viva. Para historial de iteraciones anteriores ver `git log`.*

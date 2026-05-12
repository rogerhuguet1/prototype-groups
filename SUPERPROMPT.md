# SUPERPROMPT.md — Prototipo de Agrupación por Grupos (C360 / ROBOTIX)

> Spec viva v5 para Claude Code. Construye un prototipo aislado de la feature
> "Agrupar por Grupos" sobre la pantalla "Mi alumnado: Progreso por unidad
> didáctica" del C360. Usa datos mock desde Supabase. Persiste solo composición
> de grupos en localStorage. No toca producción.

> Para el historial de iteraciones v1→v4 y los pasos del refactor v5 ver
> `git log`. Este documento describe **el estado actual vigente**.

---

## 1. Contexto

- **Producto**: prototipo de la feature "Agrupar por Grupos" para el programa C360 SuperNova Yellow de ROBOTIX.
- **Objetivo**: validar la UX de agrupación (recomendado 2-4 alumnos por robot, no estricto) antes de integrarla en el C360 real.
- **Pantalla destino**: réplica visual de "Mi alumnado: Progreso por unidad didáctica" (lista de alumnos con columnas de progreso por unidad).
- **Repo**: aislado en `robotix_group_prototype/`. **No tocar el C360 existente.**
- **Persistencia**: localStorage de `pods` (composición, sin `evaluation`), `lastRobotCount` y `lastPresentCount`. Bloqueos y semáforos se pierden al cerrar pestaña. Los pods sobreviven a refrescos.
- **Mock data**: tablas `students` y `classes` ya creadas en Supabase de test.

Si la validación va bien, se integrará en el C360 real. Esa integración no forma parte de este prompt.

---

## 2. Filosofía UX del v5

El v5 reduce fricción al máximo:

| Decisión | Razonamiento |
|---|---|
| **Auto-agrupar al cargar** | El profe abre la app y ya ve los grupos. Sin modal de configuración inicial. Cálculo automático: `robotCount = ceil(alumnos / 4)`. |
| **Sin SessionPrompt** | Nada de "¿continuar sesión anterior?". Los pods persistidos siempre vuelven; el profe entra a vista alfabética y pulsa "Grupos" si quiere verlos. |
| **Min/max recomendados** | 4 max y 2 min son sugerencias del algoritmo automático. El profe puede mover manualmente alumnos a grupos "llenos" (>4) o crear grupos pequeños (<2) sin errores. |
| **Reparto que maximiza 4s** | `createPods` rellena grupos a 4 hasta agotar el stock; los últimos quedan con 2-3. Si no caben, reparto balanceado. Nunca un grupo con 1 alumno cuando se puede evitar. |
| **Toggle simétrico Lista/Grupos** | Un solo botón en TopBar que cambia label e icono según el modo. Sin flecha back asimétrica. |
| **Inputs inline para reconfigurar** | En vista grouped, dos inputs editables (Alumnos / Robots) que reagrupan en `blur`/Enter. No hay modal después del auto-group inicial. |
| **DnD sin penalización** | Drop en cualquier pod siempre permitido (ring verde). Pod lleno no es error, es un grupo "más grande de lo recomendado". |

---

## 3. Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15.5 (App Router, output static export) |
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

### 5.1 Carga inicial: auto-agrupar sin modal

Flujo al abrir la app:

1. `<StoresHydrator/>` rehidrata Zustand desde `localStorage`.
2. `<AppShell/>` carga `students` desde Supabase vía Tanstack Query.
3. En cuanto `students.length > 0` y `pods.length === 0`, **un `useEffect` con `useRef` guard ejecuta automáticamente**:
   ```ts
   createOrRegroup({
     mode: "random",
     presentStudents: students,
     robotCount: Math.min(15, Math.ceil(students.length / 4)),
   });
   ```
4. El profe ya ve los grupos creados (vista alfabética con badges + botón "Grupos" para ver el grupo-por-grupo).

**Casos:**

- **Primera vez de todas** (sin sesión previa): auto-agrupa. El profe ve la lista alfabética con badges.
- **Cualquier refresh posterior**: los pods persistidos siguen ahí. El `useEffect` ve `pods.length > 0` y NO auto-agrupa. El profe ve la misma vista alfabética con los mismos badges.
- **Si el profe elimina todos los grupos**: queda en `pods.length === 0` pero `autoGroupedRef.current === true` (ya disparado). No se vuelve a auto-agrupar. Aparece un botón "Agrupar" fallback en TopBar que ejecuta el mismo cálculo manualmente.

`sortMode` **nunca se persiste**, así que cualquier refresh siempre arranca en `alphabetical`.

### 5.2 Barra de acciones: tres estados de `PodMainButton`

| Estado | UI | Acción |
|---|---|---|
| `pods.length === 0` + `alphabetical` (raro: solo tras borrar todos) | 1 botón **"Agrupar"** (Shuffle) | Ejecuta el auto-group con defaults. |
| `pods.length > 0` + `alphabetical` (el caso normal tras carga) | 1 botón **"Grupos"** (LayoutGrid) | `setSortMode('grouped')`. Sin modal. |
| `sortMode === 'grouped'` | Botón **"Lista"** (List) + inputs **Alumnos / Robots** + botón **"Reagrupar ▼"** (Shuffle + ChevronDown) | Lista → alfabético. Inputs reagrupan en blur/Enter. Dropdown ofrece 4 modos. |

Toggle simétrico Lista↔Grupos: mismo `Button secondary`, mismo estilo, solo cambia label e icono.

### 5.3 Vista grouped: estructura de cada grupo

Cada pod renderiza un `<tbody>` con cabecera (`PodSectionHeaderRow`):

- **Emoji + nombre del grupo** editable (popover de emoji al click vía `PodHeaderTrigger`).
- **Semáforo** (`PodEvaluationRadio`): 3 botones radio en orden **🔴 🟡 🟢** (verde a la derecha = "ok"). Click asigna; click en el seleccionado deselecciona (vuelve a `null`). Selección visual por **opacidad y fondo tintado** (no ring): el seleccionado a `opacity-100` con fondo claro tintado y `scale-110`; los demás a `opacity-20` (o `opacity-40` si ninguno está seleccionado).
- **Contador** `"N alumnos"` (sin "de 4"). Si `N > pod.maxCapacity` (= 4), el texto va en **color amber** (`text-amber-700`) con tooltip *"Supera el máximo recomendado"*. Es un aviso, no un error.
- **Botón eliminar** (`Trash2`, alineado a la derecha): borra el grupo. Si tiene alumnos, `window.confirm` pide confirmación: los alumnos pasan a "Pendientes de asignar" (al quitar el pod, dejan de tener entrada en `studentToPod` y aparecen en el bloque pendientes). Al borrar, los pods restantes se **renumeran** a `pod-1..pod-N` para mantener IDs contiguos.

Cada fila de alumno (`StudentRowDraggable`):

- **Candado individual siempre visible** (`Lock`/`Unlock`):
  - **Bloqueado**: fondo sólido del color del pod, icono Lock en blanco o negro según `pod.color.textOn`.
  - **No bloqueado**: icono Unlock en el color del pod con opacidad 50%, sin fondo.
  - Click invierte. Los locks **no persisten** entre sesiones.
- **Handle DnD** (`DragHandle`): icono `Equal` de lucide-react (dos rayas horizontales paralelas `=`).
- Badge + nombre + columnas de progreso.

Al final, botón **"Crear nuevo grupo"** si `pods.length < 15`.

#### Bloque "Pendientes de asignar"

Si tras eliminar grupos o alumnos quedan alumnos sin pod, aparecen al final en un bloque separado. Cada fila tiene:
- **Drag handle** (Equal) — drag hacia cualquier grupo.
- **Badge "Pendiente de asignar ▼"** que abre `PodChangeDropdown` (mismo dropdown que en vista alfabética). El profe asigna al alumno a un grupo sin tener que arrastrar desde abajo.

Ambas vías (drag y dropdown) están activas en paralelo.

### 5.4 Inputs inline "Alumnos / Robots" (en grouped)

`PodCountControls` en la barra entre "Lista" y "Reagrupar ▼":

- Dos `<input type="number" min={1}>` etiquetados Alumnos / Robots.
- Pre-rellenados con `lastPresentCount ?? students.length` y `pods.length`.
- Sincronizados con el store via `useEffect`.
- Al hacer `blur` o pulsar **Enter**:
  - Si los valores son los actuales: no-op.
  - Si nuevos: valida con `groupingSchema` (enteros ≥ 1, robotCount ≤ 15, robotCount ≤ presentCount).
  - Si OK, ejecuta `createOrRegroup({mode: 'random', presentStudents, robotCount})`.
  - Si inválido: muestra error 4s y revierte los inputs.

Si el profe cambia el **robotCount**, el store usa `createPods` fresh (nuevos emojis/colores, locks se pierden). Si solo cambia el **presentCount** (mismo robotCount), usa `regroupWithLocks` (mantiene emojis y respeta locks).

### 5.5 Reagrupar manual: dropdown con 4 modos

Botón **"Reagrupar ▼"** abre `PodRegroupModeDropdown` con cuatro opciones:

| Modo | Función | Semántica |
|---|---|---|
| **Aleatorio** | `regroupWithLocks` (si `robotCount === pods.length`) o `createPods` fresh | Mezcla al azar; mantiene emojis/colores y respeta candados si el número no cambia. |
| **Compensada** | `createPodsByLevel({mode: 'mixed', scoreFn: getStudentScore})` | Equilibra niveles en cada grupo (top y bottom mezclados). |
| **Por niveles** | `createPodsByLevel({mode: 'leveled', scoreFn: getStudentScore})` | Alumnos con puntuación parecida juntos (top en pod-1, bottom en pod-N). |
| **Por avance** | `createPodsByProgress({progressFn: getStudentProgress, scoreFn: getStudentOverallScore})` | Junta a los alumnos que están en la misma unidad del curso. |

Click en un modo **ejecuta directamente** sin modal intermedio. `robotCount` se pasa siempre como `pods.length` actual (mantiene el número). En todos los modos: `pod.evaluation` se reinicia a `null`, se mantienen los candados individuales (los locks redirigen alumnos a su pod original cuando es posible). Si algún cálculo lanza error, banner rojo fijo arriba a la derecha 4s.

### 5.6 Drag & drop

- `DndContext` con `pointerWithin`, sensors `PointerSensor({distance: 4})` + `KeyboardSensor`.
- **Cualquier drop sobre un pod es válido**: ring verde + actualización inmediata. Max=4 es recomendado, no estricto.
- Si el alumno se suelta fuera de un pod: no se mueve.
- Drag desde "Pendientes" hacia un grupo: añade al pod destino.
- Anuncios ARIA en castellano (announcements + screenReaderInstructions).

### 5.7 Modo Proyección

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
  maxCapacity: number; // recomendado, no estricto
  evaluation: PodEvaluation;
};

type CreatePodsInput = {
  students: Student[];
  presentCount: number;
  robotCount: number;
  maxPerPod?: number;   // default DEFAULT_MAX_PER_POD = 4 (recomendado)
  minPerPod?: number;   // default DEFAULT_MIN_PER_POD = 2 (recomendado)
  seed?: string;
  random?: () => number;
};

function createPods(input: CreatePodsInput): { pods: Pod[]; seed: string };
```

### Algoritmo

1. Toma los primeros `presentCount` alumnos como pool.
2. Crea `robotCount` pods con emojis únicos (Fisher-Yates con seed) y colores únicos (furthest-point sampling sobre paleta de 15).
3. Calcula tamaños con **`computePodSizes`** (ver más abajo).
4. Reparte alumnos según los tamaños calculados.
5. Cada pod nace con `evaluation: null`.

### Validaciones (las únicas duras)

- `presentCount` entero ≥ 0.
- `robotCount` entero ≥ 1.
- `robotCount ≤ 15` (MAX_PODS).
- `presentCount ≤ students.length`.
- `robotCount ≤ presentCount`.

**Importante**: ya no hay error si `presentCount` está fuera de `[robotCount*min, robotCount*max]`. El algoritmo se adapta.

### `computePodSizes` — el algoritmo adaptativo

Helper exportado público que decide los tamaños de cada grupo:

```ts
export function computePodSizes({
  presentCount, robotCount, minPerPod, maxPerPod,
}): number[]
```

Tiene dos modos automáticos:

#### A) Cabe en el rango recomendado (`presentCount ∈ [robotCount*min, robotCount*max]`)

**Maximiza los grupos llenos** a `maxPerPod`, dejando la cola con valores en `[minPerPod, maxPerPod-1]`. Ejemplos con min=2 max=4:

```
24 / 6   → [4,4,4,4,4,4]
22 / 6   → [4,4,4,4,4,2]
21 / 6   → [4,4,4,4,3,2]   (no permite quedar con 1)
20 / 6   → [4,4,4,4,2,2]
18 / 9   → [2,2,2,2,2,2,2,2,2]  (mínimo)
30 / 10  → [4,4,4,4,4,2,2,2,2,2]
```

#### B) No cabe (excede max o por debajo de min)

**Reparto balanceado** `base+extra`. Los primeros pods reciben uno más si hay resto. Ejemplos:

```
30 / 3   → [10,10,10]   (excede max=12)
30 / 4   → [8,8,7,7]    (con maxPerPod=5, sigue excediendo 20)
3 / 2    → [2,1]        (debajo de min=4)
6 / 5    → [2,1,1,1,1]  (sobran robots)
```

Esto permite al profe configurar lo que quiera (e.g. 5 robots para 30 alumnos) sin que la app le bloquee.

### Variantes especializadas

- **`createPodsByLevel({..., mode: 'mixed' | 'leveled', scoreFn, lockedStudentIds?, currentPods?})`**: respeta candados — alumnos lockeados mantienen su pod-id original si éste sigue existiendo; los free se distribuyen por score respetando `freeSlots[i]`. **Usa reparto balanceado** (no maximize-4) porque la semántica de "agrupar por nivel" requiere tamaños similares. En modo `leveled`: ordena descendiente por score y secciona. En modo `mixed`: zigzag (boustrophedon) saltando pods sin freeSlots.
- **`createPodsByProgress({..., progressFn, scoreFn, ...})`**: wrapper que compone `score = progress*1000 + score` y llama `createPodsByLevel` modo `leveled`.
- **`createEmptyPod({existing, ...})`**: crea un pod vacío adicional con emoji/color únicos. Usado por "Crear nuevo grupo".

### `regroupWithLocks` (lib/pods/regroup-with-locks.ts)

Mantiene emojis/colores de los pods actuales. Solo redistribuye alumnos no bloqueados. **Resetea `evaluation: null`** en cada pod devuelto.

Reparto: usa `computePodSizes` (maximize-4) y empareja tamaños con pods ordenados por `lockedCount` descendente — los pods con más alumnos lockeados reciben los tamaños mayores, garantizando que ningún pod recibe un target menor que sus locks. Si quedan alumnos sin colocar tras agotar targets (caso patológico con locks que exceden capacity), rellena por capacidad.

### `move-student.ts`

Funciones: `moveStudent`, `addStudentToPod`, `removeStudentFromPod`.

**Sin validación de capacidad**: max=4 es recomendado, no estricto. El profe puede mover un alumno a un grupo de 5+ alumnos sin error. Tipo `MoveError` ya no incluye `destination-pod-full`; las únicas razones son `student-not-found`, `destination-pod-not-found`, `source-pod-not-found`.

---

## 7. Estructura de archivos (v5)

```
app/                          ← Next.js App Router
  layout.tsx, providers.tsx, globals.css   ← tokens c360-* y grade-* en @theme
  page.tsx                    ← renderiza <AppShell />
  mi-alumnado/page.tsx        ← mismo punto de entrada (ruta limpia)

components/
  layout/
    AppShell.tsx              ← contiene useEffect del auto-group inicial
    Sidebar.tsx, TopBar.tsx, ClassSelector.tsx
    StoresHydrator.tsx        ← rehydrate de Zustand al montar
  pods/
    PodMainButton.tsx         ← barra dinámica según sortMode/hasPods
    PodCountControls.tsx      ← inputs inline Alumnos/Robots en grouped
    PodRegroupModeDropdown.tsx ← dropdown de 4 modos en grouped
    PodEvaluationRadio.tsx    ← semáforo 🔴🟡🟢 en cabecera
    PodBadge.tsx, PodBadgeWithDropdown.tsx
    PodChangeDropdown.tsx     ← mover de grupo (en alphabetical y pendientes)
    PodHeaderTrigger.tsx, PodEmojiPicker.tsx
    PodDroppableTbody.tsx     ← tbody droppable por pod (ring verde valid only)
    PodProjectionButton.tsx, PodProjectionModal.tsx
  students/
    StudentTable.tsx          ← tabla principal + DndContext + PodSectionHeaderRow
    StudentRow.tsx, StudentRowDraggable.tsx
    DragHandle.tsx            ← icono Equal (= signo, dos rayas horizontales)
    ScoreLegend.tsx
  ui/
    Button.tsx, Input.tsx, Modal.tsx

hooks/
  useClasses.ts, useStudents.ts            ← Tanstack Query

lib/
  pods/
    create-pods.ts            ← createPods, createPodsByLevel, createPodsByProgress, createEmptyPod, computePodSizes (helper público)
    move-student.ts           ← addStudentToPod, moveStudent, removeStudentFromPod, MOVE_ERROR_MESSAGES
    edit-pod.ts               ← changePodEmoji
    regroup-with-locks.ts     ← regroupWithLocks (maximize-4 + locks)
    grouping-schema.ts        ← Zod schema laxo (solo limites duros)
    pod-colors.ts, pod-emojis.ts, seeded-random.ts, student-score.ts
  supabase/client.ts          ← getSupabaseBrowserClient (singleton cached)
  utils/cn.ts, sort-students.ts, progress-cells.ts, popover-position.ts
  data/units.ts               ← 6 unidades x actividades hardcoded

store/
  pods-store.ts               ← Zustand persist v7

types/
  database.ts                 ← StudentRow, ClassRow, Database

__tests__/pods/
  create-pods.test.ts, create-pods-by-level.test.ts,
  edit-pod.test.ts, move-student.test.ts, regroup-with-locks.test.ts

.github/workflows/
  deploy.yml                  ← CI: typecheck + tests + build, deploy a Pages solo desde main
```

**Eliminados del proyecto** (no recrear):
- Sistema de historial: `useHistoryStore`, `PodHistory*` (3), `co-occurrence.ts`, `types/history.ts`.
- Evaluación por sesión: `PodEvaluate*` (2).
- UI vieja del flujo agrupar: `PodSortControl`, `PodLockButton`, `PodControls`, `PodSaveSnapshotButton`, `PodCreateGroupsButton`, `PodRegroupButton`, `PodRegroupMenu`, `PodRegroupSelectionBanner`, `PodGroupingModal`, `SessionPrompt`.
- Primitivas UI no usadas: `Checkbox`, `SegmentedControl`, `ConfirmDialog`.
- Snapshots históricos: `codex/`, `legacy/`.

---

## 8. Store (`pods-store.ts`)

```ts
type State = {
  pods: Pod[];
  lockedStudentIds: string[];
  sortMode: 'alphabetical' | 'grouped';
  lastRobotCount: number | null;
  lastPresentCount: number | null;
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
  deletePod(podId: string): void;           // borra pod y renumera ids
  createPodAndAssignStudent(student, emoji, emojiLabel): void;
  changeEmoji(podId, emoji, emojiLabel): ChangeEmojiResult;
};
```

### `createOrRegroup` — dispatcher unificado

Decide qué algoritmo usar:

- **`mode === 'random'`**:
  - Si hay pods y `robotCount === pods.length`: `regroupWithLocks` (mantiene emojis/colores y respeta candados).
  - Si no hay pods, o el número cambia: `createPods` fresh (los locks se pierden).
- **`mode === 'mixed' | 'leveled'`**: `createPodsByLevel` con `scoreFn`, locks y `currentPods`.
- **`mode === 'by-progress'`**: `createPodsByProgress` con `progressFn` + `scoreFn`, locks y `currentPods`.

Tras ejecutar, escribe: `pods`, `sortMode: 'grouped'`, `lastRobotCount`, `lastPresentCount`.

### `deletePod`

- Quita el pod del array.
- **Renumera** los pods restantes a `pod-1..pod-N` para mantener IDs contiguos (evita colisión con `addEmptyPod` que genera `pod-${existing.length+1}`).
- Quita los candados de los alumnos que estaban en ese pod (ya no tienen pod al que pertenecer).
- Los alumnos del pod borrado aparecen automáticamente en "Pendientes de asignar" (al dejar de tener entrada en `studentToPod`).

### Persistencia (persist middleware version 7)

- `name: 'c360-pods-state'`, `skipHydration: true`.
- `partialize` solo `{ pods (con evaluation=null forzado), lastRobotCount, lastPresentCount }`.
- `migrate`:
  - `version < 6` → descartar (esquema irreconciliable con v5 anterior).
  - `version === 6` → mantener `pods` y `lastRobotCount`, añadir `lastPresentCount: null`.
  - `version >= 7` → tal cual.
- `<StoresHydrator/>` ejecuta `usePodsStore.persist.rehydrate()` en `useEffect`.

**No se persiste:** `lockedStudentIds`, `sortMode`, `pod.evaluation`.

---

## 9. Tests obligatorios

Solo en `__tests__/pods/*`. **Sin tests de UI, integración o E2E** en este prototipo.

| Archivo | Cobertura |
|---|---|
| `create-pods.test.ts` | Reparto que maximiza 4s, seed reproducible, **adaptación cuando excede o queda por debajo de min/max** (sin error duro), casos límite (1/1 con minPerPod:1, 18/9 mínimo). |
| `create-pods-by-level.test.ts` | Modos leveled/mixed/by-progress, respeto a locks, evaluation: null. **Reparto balanceado** (no maximize-4). |
| `regroup-with-locks.test.ts` | Con/sin locks, capacidad, reset de evaluation, errores. |
| `move-student.test.ts` | move/add/remove ok y errores (not-found). **No hay "destination-pod-full"**: aceptamos siempre, ejemplo `8/2 max=4` permite mover a un pod ya lleno (queda con 5). |
| `edit-pod.test.ts` | changePodEmoji ok y errores. |

`npm test` pasa **77/77 verdes**. `npm run typecheck` verde sin warnings.

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
2. **Sin pods previos**: la app **auto-agrupa automáticamente** con `robotCount = ceil(alumnos/4)`. El profe ve directamente la vista alfabética con badges. Sin modal de configuración.
3. **Con pods previos guardados** (cualquier refresh): vista alfabética con los mismos badges, botón **"Grupos"** visible.
4. Pulsar "Grupos" → entra a vista por grupos. Pulsar "Lista" desde grouped → vuelve a alfabética. Toggle simétrico.
5. En vista grouped:
   - Inputs **Alumnos** y **Robots** muestran los valores actuales. Editar y blur/Enter reagrupa.
   - 30/10 → 10 grupos. 30/5 → 5 grupos de 6 (excede max recomendado, reparto balanceado, sin error).
   - 30/3 → 3 grupos de 10. 3/2 → 2 grupos `[2, 1]`. Nunca error.
6. Cabecera de cada grupo: emoji + semáforo **🔴 🟡 🟢** + **"N alumnos"** (en amber si N > 4) + botón eliminar.
7. Click en 🟢 selecciona; click otra vez deselecciona. Selección por opacidad/fondo (no ring).
8. Cada fila: candado individual con color del pod + handle Equal (dos rayas =) + nombre.
9. Candado bloqueado: fondo sólido del color del pod, icono en blanco/negro según contraste.
10. Drag A→B (cualquier destino) → mueve. **Drop en pod lleno también permitido** (queda con 5 alumnos, contador en amber).
11. Drag a un sitio vacío fuera de pods → no se mueve.
12. Botón **"Reagrupar ▼"** abre dropdown con 4 modos. Click en uno ejecuta directamente.
13. Reagrupar con Compensada/Por niveles/Por avance: respeta candados, resetea semáforos a `null`.
14. Eliminar un grupo con Trash2: confirm si tiene alumnos → pasan a "Pendientes de asignar" + renumeración de IDs.
15. Sección "Pendientes de asignar": cada alumno tiene drag handle + dropdown "Pendiente de asignar ▼" para asignarlo a un grupo sin arrastrar.
16. Botón **Proyección** abre vista a pantalla completa con card por grupo (emoji grande + nombre + alumnos).
17. Cerrar pestaña + reabrir: pods persisten (sin evaluation), `lockedStudentIds=[]`, `sortMode='alphabetical'`, `evaluation=null`. El auto-group NO vuelve a dispararse porque hay pods.

---

## 12. Estado actual de la implementación (v5, mayo 2026)

### 12.1 Resumen ejecutivo

Prototipo **funcionalmente completo según spec v5**. Sirve en `localhost:3000/mi-alumnado`. Conectado a Supabase real (clase "2º Bachillerato A", 30 alumnos). **77 tests verde**. TypeScript strict sin errores. Build estático genera `out/` correctamente. CI en GitHub Actions: typecheck + tests + build en cada push; deploy a Pages solo desde `main`.

### 12.2 Decisiones técnicas vigentes

- **`DEFAULT_MAX_PER_POD = 4`, `DEFAULT_MIN_PER_POD = 2`** son **recomendaciones**, no límites estrictos. `createPods` y `createPodsByLevel` no lanzan error si la combinación queda fuera del rango — adaptan el reparto.
- **`computePodSizes` adaptativo**: si cabe → maximize-4; si no → reparto balanceado base+extra.
- **`move-student.ts` sin `destination-pod-full`**: drop a pod lleno permitido siempre. El tipo `MoveError` ya no incluye ese caso.
- **`PodDroppableTbody`**: solo ring verde valid; nunca ring rojo invalid.
- **`createPodsByLevel` con balanced sizes** (no maximize-4): preserva la semántica de "alumnos juntos por nivel" → tamaños parecidos.
- **`regroupWithLocks` con maximize-4**: mantiene emojis/colores; empareja sizes descendientes con pods ordenados por lockedCount descendente para garantizar que ningún target queda por debajo de los locks.
- **`deletePod` renumera** los pods restantes a `pod-1..pod-N` y libera locks de los alumnos del pod borrado.
- **Auto-group inicial** en `AppShell` con `useRef` guard: una sola vez por vida del componente, cuando `students.length > 0 && pods.length === 0`.
- **`sortMode` no se persiste** → refresh siempre arranca en alphabetical aunque la última sesión terminara en grouped.
- **Persist version 7**: incluye `lastPresentCount`. Migrate v6→v7 conserva pods + lastRobotCount.

### 12.3 Algoritmo `computePodSizes` — tabla de comportamiento

| Input | Modo | Output | Motivo |
|---|---|---|---|
| 24 / 6 (min2 max4) | Maximize-4 | `[4,4,4,4,4,4]` | Cabe, todos llenos |
| 22 / 6 | Maximize-4 | `[4,4,4,4,4,2]` | Cabe, cola con 2 |
| 21 / 6 | Maximize-4 | `[4,4,4,4,3,2]` | Cabe, no permite 1 |
| 20 / 6 | Maximize-4 | `[4,4,4,4,2,2]` | Cabe |
| 18 / 9 | Maximize-4 | `[2,2,2,2,2,2,2,2,2]` | Cabe, todos al mínimo |
| 30 / 10 | Maximize-4 | `[4,4,4,4,4,2,2,2,2,2]` | Cabe |
| 30 / 3 | Balanced | `[10,10,10]` | Excede max (>12) |
| 30 / 4 con max=5 | Balanced | `[8,8,7,7]` | Excede max (>20) |
| 3 / 2 | Balanced | `[2,1]` | Debajo de min (<4) |
| 6 / 5 | Balanced | `[2,1,1,1,1]` | Sobran robots |

### 12.4 Validaciones / errores

| Punto | Caso | Mensaje / efecto |
|---|---|---|
| `createPods` | `robotCount > presentCount` | `Hay más robots que alumnos` |
| `createPods` | `robotCount > 15` | `Máximo 15 grupos permitidos` |
| `createPods` | `presentCount > students.length` | `No hay tantos alumnos en clase` |
| `createPods` | `presentCount/robotCount` fuera de rango recomendado | **Sin error**, reparto adaptativo |
| `PodCountControls` | Inputs inválidos (entero≤0, robot>15, robot>present) | Banner rojo 4s + revierte inputs |
| DnD | Pod destino lleno | Permitido. Contador en amber. |
| `createEmptyPod` | `existing.length >= 15` | `Máximo 15 grupos permitidos` |
| `createEmptyPod` | No quedan emojis | `No quedan emojis disponibles` |

### 12.5 Tests (77 verde)

- **`create-pods.test.ts`** (≈25 tests): casos del SUPERPROMPT (24/6, 22/6, 18/5, 20/5, 18/9 mínimo), errores duros (robot>present, max grupos), errores `presentCount > students.length`, reproducibilidad seed, **adaptación a casos fuera de rango** (30/3 → `[10,10,10]`; 3/2 → `[2,1]`; 30/4 max=5 → `[8,8,7,7]`).
- **`create-pods-by-level.test.ts`** (15): leveled, mixed, by-progress, **locks** (4 tests: en leveled, en mixed, capacidad con locks, evaluation:null), por-progreso agrupando por unidad.
- **`regroup-with-locks.test.ts`** (10): con/sin locks, capacidad, reset de evaluation, errores.
- **`move-student.test.ts`** (12): move/add/remove ok y errores not-found. **Tests `permite mover/anadir a pod lleno`** confirman que max=4 no es estricto.
- **`edit-pod.test.ts`** (15): changePodEmoji ok y errores.

### 12.6 CI/CD

`.github/workflows/deploy.yml` ejecuta en cada push a `main` y `codex`:

1. `npm ci`
2. `npm run typecheck`
3. `npm test`
4. `npm run build` (con env vars de Supabase para que el build estático funcione)
5. **Solo si `github.ref === 'refs/heads/main'`**: upload artifact + deploy a GitHub Pages.

`codex` sirve como rama de trabajo verificada (build pero sin deploy). Cuando se mergea a `main`, Pages se actualiza.

### 12.7 Persistencia: qué sobrevive a un refresh

| Item | Persistido | Resetea al cerrar pestaña |
|---|---|---|
| `pods` (composición, emojis, colores) | ✓ | – |
| `pod.evaluation` | – (se fuerza a null al partialize) | ✓ |
| `lockedStudentIds` | – | ✓ |
| `sortMode` | – | siempre arranca `alphabetical` |
| `lastRobotCount` | ✓ | – |
| `lastPresentCount` | ✓ | – |

### 12.8 Limitaciones / gaps conocidos

- Sin tests de UI ni E2E (out of scope deliberadamente).
- Modal del auto-group no muestra cuántos grupos saldrán antes de hacerlo (es automático).
- Modo Reagrupar no permite cambiar `robotCount` desde el dropdown directo (para eso están los inputs inline en `PodCountControls`).
- Semáforo per-pod no se exporta (se pierde al cerrar pestaña, comportamiento esperado).
- Migración v5→v6→v7 progresiva preserva pods compatibles; cualquier estado pre-v6 se descarta.

### 12.9 Historial de commits relevantes (v5 + ajustes UX)

```
5194ab2 chore: limpiar carpetas historicas, huerfanos y docs obsoletas
f90e30e feat(pods): auto-agrupar al cargar + min/max recomendados (no estrictos)
0e07906 feat(ui): toggle Lista/Grupos simetrico, drag handle Equal y dropdown en pendientes
ba18a7a ci: deploy solo desde main + anadir typecheck y tests al pipeline
392f65b style(ui): candado individual con color del grupo
3ca4ddb refactor(ui): eliminar SessionPrompt, modal Agrupar solo primera vez de todas
484d94f feat(ui): SessionPrompt continua a grouped, empezar nueva abre modal directo
80895d9 feat(pods): maximizar grupos de 4 en createPods y regroupWithLocks
8d94d49 feat(pods): eliminar grupo, prompt de sesion al refrescar, edicion inline counts
02167d8 docs: actualizar SUPERPROMPT.md con UX final post-feedback
1937a32 fix(ui): reagrupar mantiene num grupos del setup inicial, sin segundo modal
b5c2dff fix(ui): no re-preguntar al volver a vista por grupos + reset robusto modal
50b3290 fix(ui): modal simple, dropdown reagrupar en grouped, semaforo sin ring
a601217 docs: actualizar SUPERPROMPT.md a v5
2a691ed feat(ui): modal Agrupar con selector de modo, defaults min2 max4 y error duro
46bfa64 feat(ui): candados siempre visibles, semaforo por grupo, icono dnd 6 puntos
13b827f feat(ui): boton unico con doble funcion reagrupar/volver
6ccdc98 refactor(store): unificar createOrRegroup, Pod.evaluation, persist v6
1a56572 refactor: eliminar historial, evaluacion por sesion y candado de grupo
```

### 12.10 Evolución del flujo UX (iteraciones post-v5)

Cinco rondas de feedback simplificaron el flujo progresivamente:

1. **Modal con selector de 4 modos** (v5 inicial): demasiada UI antes de ver grupos.
2. **Modal simple + dropdown en grouped**: el modal solo pregunta counts; los modos viven en grouped tras agrupar.
3. **Sin segundo modal + reagrupar invariante**: el modal solo aparece la primera vez; reagrupar mantiene `pods.length`.
4. **SessionPrompt al refrescar**: se preguntaba si continuar/nueva sesión. Demasiados popups.
5. **Estado final** (v5 actual): cero popups. Auto-group al cargar. Min/max recomendados (no estrictos). Toggle Lista/Grupos simétrico. Inputs inline para reconfigurar. Drag handle Equal. Candados con color del grupo. Eliminar grupo desde su cabecera.

### 12.11 Cómo arrancar la próxima sesión

```bash
cd robotix_group_prototype
npm install                # solo si node_modules cambió
npm run dev                # http://localhost:3000/mi-alumnado
npm test                   # 77/77 verde
npm run typecheck          # verde
npm run build              # estático en out/, verde
```

`.env.local` necesita `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (formato `sb_publishable_*`).

---

*SUPERPROMPT.md v5.0 — Prototipo Grupos (C360 / ROBOTIX). Spec viva. Para historial completo de iteraciones ver `git log`.*

# SUPERPROMPT.md — Prototipo de Agrupación por Grupos (C360 / ROBOTIX)

> Spec viva v7 para Claude Code. Prototipo aislado de la feature "Agrupar por
> Grupos" del C360 SuperNova Yellow. Datos mock desde Supabase. Solo composición
> de pods persistida en localStorage. No toca producción.

> Para el historial de iteraciones anteriores ver `git log`. Este documento
> describe **el estado actual vigente**.

---

## 1. Contexto

- **Producto**: prototipo de la feature "Agrupar por Grupos" para el programa C360 SuperNova Yellow de ROBOTIX.
- **Objetivo**: validar la UX de agrupación (recomendado 2-4 alumnos por robot, **máx 4 estricto**) antes de integrarla en el C360 real.
- **Pantalla destino**: réplica visual de "Mi alumnado: Progreso por unidad didáctica".
- **Repo**: aislado en `robotix_group_prototype/`. **No tocar el C360 existente.**
- **Persistencia**: localStorage de `pods` (composición) y `lastRobotCount`. Candados se pierden al cerrar pestaña.
- **Mock data**: tablas `students` y `classes` ya creadas en Supabase de test.

---

## 2. Filosofía UX

| Decisión | Razonamiento |
|---|---|
| **Auto-agrupar al cargar** | El profe abre la app y ya ve los grupos. Sin modal de configuración. |
| **Sin vista alfabética** | Una única vista: la de grupos. La app es para agrupar; ver la lista plana no aporta. |
| **Máx 4 alumnos por grupo es ESTRICTO** | Un grupo no puede tener más de 4 alumnos. Si faltan robots, los alumnos sobrantes quedan en "Pendientes de asignar". |
| **Reparto balanceado** | El algoritmo distribuye `min(presentes, robots*4)` alumnos lo más balanceado posible. Sin trucos para llenar grupos a 4. |
| **Sin semáforos** | La feature de "evaluar grupo" se ha quitado para simplificar la UI. |
| **Sin emojis: nombres textuales fijos** | Cada grupo se identifica con un nombre de la lista `GROUP_NAMES` (`ORION`, `APOLLO`, `VOYAGER`, ...). Sin emojis en ningún sitio: cabeceras, badges, dropdowns, proyección. |
| **Control de robots como stepper** | Botones `−` / `+` con icono de robot, input editable. No es un `<input type="number">` plano. |
| **Validación dura en DnD y move** | Drop en pod lleno = rechazo con banner "El grupo ya tiene el máximo de 4 alumnos". |

---

## 3. Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15.5 (App Router, output static export) |
| Lenguaje | TypeScript 5.7, `strict` + `noUncheckedIndexedAccess` |
| UI | Tailwind v4 con `@theme`, tokens `c360-*` y `grade-*` |
| UI state | Zustand v5 con `persist` middleware y selectors granulares |
| Server state | Tanstack Query v5 |
| DnD | `@dnd-kit/core` + `/sortable` |
| Validación | Zod v4 |
| Backend datos | Supabase **solo lectura** vía `@supabase/ssr` |
| Tests | Vitest 4 (solo lógica pura en `lib/pods/*`) |
| Iconos | `lucide-react` exclusivamente |

Convenciones detalladas en `SKILLS_PROTOTYPE_GROUPS.md`.

---

## 4. Conexión Supabase (mock)

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://andprbqacpspbxmqqxuj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable__-RDC0rLI9Rg2iARjbOnXA_t2uICKYK
```

### Tablas

- **`students`**: `id`, `full_name`, `initials`, `avatar_url`, `class_id`, `created_at`.
- **`classes`**: `id`, `name`, `subject`, `created_at`.

**Solo lectura.** Cero inserts/updates/deletes desde el prototipo.

---

## 5. Comportamiento detallado

### 5.1 Carga inicial: auto-agrupar sin modal

1. `<StoresHydrator/>` rehidrata Zustand desde `localStorage`.
2. `<AppShell/>` carga `students` desde Supabase.
3. Si tras la rehidratación `pods.length === 0` y `students.length > 0`, **un `useEffect` con `useRef` guard ejecuta automáticamente** `createOrRegroup`:
   ```ts
   createOrRegroup({
     mode: "random",
     presentStudents: students,
     robotCount: Math.min(15, Math.ceil(students.length / 4)),
   });
   ```
4. El profe ya ve los grupos directamente, **sin vista alfabética previa**.

**Casos:**

- **Primera vez de todas** (sin sesión previa): auto-agrupa al instante.
- **Cualquier refresh con pods guardados**: rehidrata y los muestra. NO se vuelve a auto-agrupar.
- **Si el profe elimina todos los grupos**: queda `pods.length === 0` pero `autoGroupedRef.current === true`. Aparece un botón **"Agrupar"** fallback en TopBar que ejecuta el mismo cálculo.

### 5.2 Barra de acciones (`PodMainButton`)

| Estado | UI | Acción |
|---|---|---|
| `pods.length === 0` (fallback) | Botón **"Agrupar"** (Shuffle) | Ejecuta auto-group con defaults. |
| `pods.length > 0` (normal) | **Stepper de robots** + botón **"Reagrupar ▼"** | Stepper cambia `robotCount` con `-`/`+`/edición directa. Dropdown ofrece 4 modos de reagrupación. |

**No hay vista alfabética**, así que no existe toggle "Lista/Grupos" ni `sortMode`.

### 5.3 Estructura de cada grupo (`PodSectionHeaderRow`)

Cada pod renderiza un `<tbody>` con cabecera:

- **Nombre del grupo** en una píldora con el color del pod (texto blanco/negro según contraste). Sin emojis, sin popover. El nombre se asigna por posición desde `GROUP_NAMES` (pod-1 → `ORION`, pod-2 → `APOLLO`, etc.).
- **Contador**: `"N de 4 alumnos"`. Si `N === 4` aparece un badge **"Lleno"** en amber. Como max=4 es duro, nunca verás N>4.
- **Botón eliminar** (`Trash2`): borra el grupo. Si tiene alumnos, `confirm` antes; al aceptar, los alumnos pasan a "Pendientes de asignar" y los pods restantes se **renumeran** a `pod-1..pod-N` (y también sus nombres: `ORION`, `APOLLO`, ...).

Cada fila de alumno (`StudentRowDraggable`):

- **Candado individual** (`Lock`/`Unlock`):
  - Bloqueado: fondo sólido del color del pod, icono Lock blanco/negro según `pod.color.textOn`.
  - No bloqueado: icono Unlock en color del pod a opacidad 50%, sin fondo.
  - Los locks **no persisten**.
- **Handle DnD** (`DragHandle`): icono `Equal` (dos rayas horizontales `=`).
- Badge + nombre + columnas de progreso.

Al final, botón **"Crear nuevo grupo"** si `pods.length < 15`.

#### Bloque "Pendientes de asignar"

Aparece automáticamente cuando hay alumnos sin pod (porque la capacidad `robots*4` no alcanza, o porque el profe borró un grupo). Cada fila tiene:

- Drag handle (Equal) — drag hacia cualquier grupo **con hueco**.
- Badge **"Pendiente de asignar ▼"** que abre `PodChangeDropdown` para asignar al alumno a un grupo sin arrastrar. El dropdown **deshabilita los grupos llenos** (con tooltip "Grupo lleno").

### 5.4 Stepper de robots (`PodCountControls`)

`PodCountControls` en la barra antes del botón "Reagrupar ▼":

- **Bloque tipo pill** con borde y fondo azulado (`c360-blue/30` + `c360-blue/5`).
- Icono `Bot` + label `"ROBOTS"` + botón `Minus` + input + botón `Plus`.
- El **input usa state interno tipo string** para permitir borrarlo durante la edición sin que se fuerce a `0`. Solo dígitos (filtra `\D`).
- Valida en `blur` o al pulsar **Enter**:
  - Si vacío: revierte al valor anterior.
  - Si entero válido entre 1 y 15: ejecuta `createOrRegroup({mode: 'random', presentStudents: students, robotCount: n})`.
  - Si inválido (Zod schema): error 4s y revierte.
- Los botones `-`/`+` ajustan ±1 con bounds `[1, 15]`. Disabled cuando llegan al límite.

### 5.5 Reagrupar manual: dropdown con 4 modos

Botón **"Reagrupar ▼"** abre `PodRegroupModeDropdown`:

| Modo | Función | Semántica |
|---|---|---|
| **Aleatorio** | `regroupWithLocks` (si `robotCount === pods.length`) o `createPods` fresh | Mezcla al azar; mantiene emojis/colores y candados si el número no cambia. |
| **Compensada** | `createPodsByLevel({mode: 'mixed', scoreFn: getStudentScore})` | Equilibra niveles en cada grupo (zigzag). |
| **Por niveles** | `createPodsByLevel({mode: 'leveled', scoreFn: getStudentScore})` | Alumnos con puntuación parecida juntos. |
| **Por avance** | `createPodsByProgress({progressFn, scoreFn: getStudentOverallScore})` | Junta a alumnos que están en la misma unidad del curso. |

Click ejecuta directamente. `robotCount = pods.length` (mantiene el número). Los excedentes (si `students.length > robotCount*4`) quedan pendientes.

### 5.6 Drag & drop

- `DndContext` con `pointerWithin`, sensors `PointerSensor({distance: 4})` + `KeyboardSensor`.
- Drop sobre pod libre → **ring verde** + asignación.
- Drop sobre pod lleno (4 alumnos) → **ring rojo + cursor `not-allowed` + banner "El grupo ya tiene el máximo de 4 alumnos"** 2.5s.
- Drag fuera de pod → no se mueve.
- Drag desde "Pendientes" hacia un grupo → asigna si hay hueco; rechazado si lleno.
- Anuncios ARIA en castellano.

### 5.7 Modo Proyección

`PodProjectionButton` abre `PodProjectionModal` a pantalla completa con cada pod como card grande. Sin cambios respecto a versiones anteriores.

---

## 6. Función pura `createPods` (lib/pods/create-pods.ts)

```ts
type Pod = {
  id: string;           // 'pod-1', 'pod-2', ...
  name: string;         // GROUP_NAMES[i] — ORION, APOLLO, VOYAGER, ...
  color: PodColor;      // { name, hex, textOn }
  students: Student[];
  maxCapacity: number;  // 4 por defecto, ESTRICTO
};

type CreatePodsInput = {
  students: Student[];
  presentCount: number;
  robotCount: number;
  maxPerPod?: number;   // default DEFAULT_MAX_PER_POD = 4
  minPerPod?: number;   // (legacy, no se usa para validar; reparto balanceado)
  seed?: string;
  random?: () => number;
};

function createPods(input: CreatePodsInput): { pods: Pod[]; seed: string };
```

### Algoritmo

1. Toma los primeros `presentCount` alumnos como pool.
2. Calcula `capacity = robotCount * maxPerPod` y `assignableCount = min(presentCount, capacity)`.
3. Mezcla con Fisher-Yates (seed) y toma los primeros `assignableCount`. **Los demás quedan fuera de cualquier pod** y aparecen automáticamente en "Pendientes de asignar".
4. Calcula tamaños con `computePodSizes({ assignableCount, robotCount })` (reparto balanceado).
5. Asigna alumnos según los tamaños.
6. Cada pod nace con `maxCapacity = maxPerPod`.

### Validaciones (duras)

- `presentCount` entero ≥ 0.
- `robotCount` entero ≥ 1, ≤ 15 (MAX_PODS).
- `presentCount ≤ students.length`.
- `robotCount ≤ presentCount`.

### `computePodSizes` — algoritmo balanceado simple

```ts
export function computePodSizes({
  assignableCount, robotCount,
}: {
  assignableCount: number;
  robotCount: number;
}): number[]
```

`base = floor(assignable/robot)`, `extra = assignable % robot`. Primeros `extra` pods reciben `base+1`, el resto `base`.

**Ejemplos** (asignable = min(presentes, robots*4)):

| Presentes | Robots | Capacity | Asignable | Sizes | Pendientes |
|---|---|---|---|---|---|
| 10 | 4 | 16 | 10 | `[3,3,2,2]` | 0 |
| 12 | 4 | 16 | 12 | `[3,3,3,3]` | 0 |
| 13 | 4 | 16 | 13 | `[4,3,3,3]` | 0 |
| 16 | 4 | 16 | 16 | `[4,4,4,4]` | 0 |
| 18 | 4 | 16 | 16 | `[4,4,4,4]` | 2 |
| 30 | 5 | 20 | 20 | `[4,4,4,4,4]` | 10 |
| 30 | 10 | 40 | 30 | `[3,3,3,3,3,3,3,3,3,3]` | 0 |

### Variantes especializadas

- **`createPodsByLevel({..., mode: 'mixed' | 'leveled', scoreFn, lockedStudentIds?, currentPods?})`**: respeta candados con cap a `maxPerPod` por pod. Reparto balanceado (no maximize-4). Los free que no caben en la capacidad libre **quedan fuera** (= pendientes).
- **`createPodsByProgress({..., progressFn, scoreFn, ...})`**: wrapper que compone `score = progress*1000 + score` y llama `createPodsByLevel` modo `leveled`.
- **`createEmptyPod({existing, ...})`**: crea un pod vacío con emoji/color únicos.

### `regroupWithLocks` (lib/pods/regroup-with-locks.ts)

Mantiene emojis/colores. Cap **duro** a `maxPerPod` por pod. Si quedan free fuera de la capacidad libre, **quedan pendientes** sin lanzar error. (Antes lanzaba `RegroupLocksError` en este caso; ahora es comportamiento silencioso porque el flujo de pendientes lo absorbe.)

### `move-student.ts`

| Función | Validación de capacidad |
|---|---|
| `moveStudent(pods, studentId, toPodId)` | Si `toPod.students.length >= maxCapacity` → `{ ok: false, reason: 'destination-pod-full' }`. |
| `addStudentToPod(pods, student, toPodId)` | Mismo cap. |
| `removeStudentFromPod(pods, studentId)` | Sin cap (no cabe la situación). |

`MOVE_ERROR_MESSAGES["destination-pod-full"] = "El grupo ya tiene el máximo de 4 alumnos"`.

---

## 7. Estructura de archivos

```
app/
  layout.tsx, providers.tsx, globals.css
  page.tsx, mi-alumnado/page.tsx          ← renderiza <AppShell />

components/
  layout/
    AppShell.tsx                          ← auto-group inicial (useEffect+useRef)
    Sidebar.tsx, TopBar.tsx, ClassSelector.tsx
    StoresHydrator.tsx                    ← rehydrate de Zustand
  pods/
    PodMainButton.tsx                     ← stepper + dropdown Reagrupar
    PodCountControls.tsx                  ← stepper de robots (icono Bot, -/+, input)
    PodRegroupModeDropdown.tsx            ← dropdown de 4 modos
    PodBadge.tsx, PodBadgeWithDropdown.tsx
    PodChangeDropdown.tsx                 ← mover de grupo (deshabilita llenos)
    PodHeaderTrigger.tsx, PodEmojiPicker.tsx
    PodDroppableTbody.tsx                 ← ring verde valid / ring rojo full
    PodProjectionButton.tsx, PodProjectionModal.tsx
  students/
    StudentTable.tsx                      ← tabla + DndContext + cabeceras
    StudentRow.tsx, StudentRowDraggable.tsx
    DragHandle.tsx                        ← icono Equal (=)
    ScoreLegend.tsx
  ui/
    Button.tsx, Input.tsx, Modal.tsx

hooks/
  useClasses.ts, useStudents.ts

lib/
  pods/
    create-pods.ts                        ← createPods, createPodsByLevel, computePodSizes
    move-student.ts                       ← con validación de capacidad
    edit-pod.ts                           ← changePodEmoji
    regroup-with-locks.ts                 ← cap duro a maxPerPod
    grouping-schema.ts                    ← Zod laxo (solo limites duros)
    pod-colors.ts, pod-emojis.ts, seeded-random.ts, student-score.ts
  supabase/client.ts
  utils/cn.ts, sort-students.ts, progress-cells.ts, popover-position.ts
  data/units.ts

store/pods-store.ts                       ← Zustand persist v8

types/database.ts

__tests__/pods/
  create-pods.test.ts, create-pods-by-level.test.ts,
  edit-pod.test.ts, move-student.test.ts, regroup-with-locks.test.ts

.github/workflows/deploy.yml
```

**Eliminados (no recrear):** `PodEvaluationRadio.tsx`, `PodEmojiPicker.tsx`, `PodHeaderTrigger.tsx`, `PodGroupingModal.tsx`, `SessionPrompt.tsx`, `useHistoryStore`, `PodHistory*`, `PodEvaluate*`, `PodSortControl`, `PodLockButton`, `PodControls`, `PodSaveSnapshotButton`, `PodCreateGroupsButton`, `PodRegroupButton`, `PodRegroupMenu`, `PodRegroupSelectionBanner`, `co-occurrence.ts`, `edit-pod.ts` (changePodEmoji), `lib/pods/pod-emojis.ts`, `types/history.ts`, `components/ui/{Checkbox,SegmentedControl,ConfirmDialog}.tsx`, carpetas `codex/` y `legacy/`. **No quedan emojis** en ningún lugar de la UI ni del modelo.

---

## 8. Store (`pods-store.ts`)

```ts
type State = {
  pods: Pod[];
  lockedStudentIds: string[];
  lastRobotCount: number | null;
};

type GroupingMode = 'random' | 'mixed' | 'leveled' | 'by-progress';

type Actions = {
  createOrRegroup(input: {
    mode: GroupingMode;
    presentStudents: Student[];
    robotCount: number;
    scoreFn?: (studentId: string) => number;
    progressFn?: (studentId: string) => number;
  }): void;
  resetPods(): void;
  setLastRobotCount(n: number | null): void;
  moveStudent(studentId, toPodId): MoveStudentResult;
  addStudentToPod(student, toPodId): MoveStudentResult;
  removeStudentFromPod(studentId): MoveStudentResult;
  toggleStudentLock(studentId): void;
  addEmptyPod(): void;
  deletePod(podId: string): void;          // borra pod y renumera ids/nombres
  createPodAndAssignStudent(student): void;
};
```

**Sin `sortMode`, sin `setSortMode`, sin `setPodEvaluation`.** El concepto de vista alfabética ya no existe; el de semáforo tampoco.

### `createOrRegroup` — dispatcher

- **random** + sin pods o cambio de `robotCount`: `createPods` fresh.
- **random** + mismo `robotCount`: `regroupWithLocks` (mantiene emojis/colores y respeta candados).
- **mixed/leveled**: `createPodsByLevel` con `scoreFn`, locks y `currentPods`.
- **by-progress**: `createPodsByProgress` con `progressFn` + `scoreFn`.

Tras ejecutar, escribe `pods` y `lastRobotCount`.

### `deletePod`

- Quita el pod del array.
- **Renumera** los pods restantes a `pod-1..pod-N` para mantener IDs contiguos.
- Quita los candados de los alumnos del pod borrado.

### Persistencia (persist middleware version 9)

- `name: 'c360-pods-state'`, `skipHydration: true`.
- `partialize`: `{ pods, lastRobotCount }`.
- `migrate`:
  - `version < 9` → limpia campos viejos (`emoji`, `emojiLabel`, `evaluation`), asigna `name` por índice desde `GROUP_NAMES`, y **trunca pods que superen `maxCapacity`** (el exceso queda fuera = aparece en "Pendientes de asignar").
  - `version >= 9` → tal cual.
- `<StoresHydrator/>` ejecuta `usePodsStore.persist.rehydrate()` en `useEffect`.

**No se persiste:** `lockedStudentIds`.

---

## 9. Tests obligatorios

`__tests__/pods/*`. Sin tests de UI. **78 tests verde**.

| Archivo | Cobertura |
|---|---|
| `create-pods.test.ts` | 10/4 → `[3,3,2,2]`, 12/4 → `[3,3,3,3]`, 13/4 → `[4,3,3,3]`, 16/4 → `[4,4,4,4]`, 18/4 → `[4,4,4,4]` + 2 pendientes, 30/5 → `[4,4,4,4,4]` + 10 pendientes, 30/10 → diez de 3, 20/5 → cinco de 4, errores duros (robot>present, max grupos, presentCount > students.length). |
| `create-pods-by-level.test.ts` | leveled, mixed, by-progress; respeto a candados con cap duro a maxPerPod. |
| `regroup-with-locks.test.ts` | con/sin candados, capacidad, **excedentes quedan pendientes (sin error)**. |
| `move-student.test.ts` | move/add/remove ok y errores; **rechaza mover/anadir a pod lleno con `destination-pod-full`**. |
| `edit-pod.test.ts` | changePodEmoji ok y errores. |

`npm test` → 78/78 verde. `npm run typecheck` verde. `npm run build` verde.

---

## 10. Reglas duras de implementación

1. **Cero feature creep.**
2. **Cero integración Moodle.** Solo prototipo aislado.
3. **Ningún archivo del C360 real se toca.**
4. **Cero persistencia más allá de composición.** No tabla `pods` en Supabase.
5. **Tipos estrictos.** Cero `any`. Cero `as` salvo tras `z.parse`.
6. **Sin `@ts-ignore`/`@ts-expect-error`** salvo autorización.
7. **Strings en castellano hardcoded.** Sin i18n.
8. **Tests obligatorios pasando.**
9. **Selectors granulares en Zustand.**
10. **Tanstack Query para todo data-fetching.**
11. **Tokens C360.** Nunca `bg-[#xxxxxx]`.
12. **Max 4 alumnos por grupo es ESTRICTO.** Sin overrides manuales por DnD.

Detalle completo en `SKILLS_PROTOTYPE_GROUPS.md`.

---

## 11. Resultado final esperado

1. `/mi-alumnado` carga alumnos desde Supabase mock.
2. **Sin pods previos**: la app **auto-agrupa** con `robotCount = ceil(alumnos/4)`. El profe ve directamente la **vista por grupos**, sin vista alfabética.
3. **Con pods previos guardados** (cualquier refresh): vuelve a la misma vista por grupos con los mismos grupos.
4. **No existe** botón "Lista" ni "Grupos" — la única vista es la de grupos.
5. **Stepper de robots** en TopBar: icono Bot, label "Robots", botón `-`, input, botón `+`. Cambiar el número reagrupa con el nuevo `robotCount`.
   - 30 alumnos / 10 robots → 10 grupos de 3, 0 pendientes.
   - 30 / 5 → 5 grupos de 4, **10 pendientes** (visible en bloque inferior).
   - 30 / 3 → 3 grupos de 4 (capacidad 12), 18 pendientes.
6. Cabecera de grupo: **píldora con el nombre del grupo en MAYÚSCULAS** (color del pod) + contador `"N de 4 alumnos"` + badge `"Lleno"` si N=4 + botón eliminar. **Sin semáforo. Sin emoji.**
7. Cada fila: candado individual (color del pod) + handle Equal + badge (con nombre, sin emoji) + nombre del alumno.
8. **Drop en pod con menos de 4** → ring verde, asignación inmediata.
9. **Drop en pod lleno (4)** → ring rojo + cursor `not-allowed` + banner *"El grupo ya tiene el máximo de 4 alumnos"*. **No se asigna.**
10. **Dropdown `PodChangeDropdown` en "Pendientes"** deshabilita las opciones de pods llenos.
11. **Reagrupar ▼** con 4 modos (Aleatorio/Compensada/Por niveles/Por avance). Click ejecuta directamente. Respeta candados (cap a 4 por pod).
12. Eliminar un grupo con Trash2: `confirm` si tiene alumnos → pasan a "Pendientes" + renumeración.
13. Sección "Pendientes de asignar": drag handle + dropdown "Pendiente de asignar ▼" para asignar sin arrastrar.
14. **Botón Proyección** sigue funcionando.
15. Cerrar pestaña + reabrir: pods siguen, candados resetean.

---

## 12. Estado actual (v7, mayo 2026)

### 12.1 Resumen

Prototipo **funcionalmente completo según v7**. `npm test` → 76/76 verde. `npm run typecheck` y `npm run build` verde. CI en GitHub Actions ejecuta los 3 en cada push; deploy a Pages solo desde `main`.

### 12.2 Cambios v6 → v7

| Concepto | v6 | v7 (actual) |
|---|---|---|
| Identificador visual del grupo | emoji + emojiLabel | **Nombre textual** desde `GROUP_NAMES` (ORION, APOLLO, ...) |
| Tipo `Pod` | `{ id, emoji, emojiLabel, color, students, maxCapacity }` | `{ id, name, color, students, maxCapacity }` |
| `PodHeaderTrigger` (selector emoji) | Sí | **Eliminado** |
| `PodEmojiPicker` | Sí | **Eliminado** |
| `pod-emojis.ts` + `POD_EMOJIS` | Sí | **Eliminado** — `MAX_PODS` movido a `group-names.ts` |
| `edit-pod.ts` (changePodEmoji) | Sí | **Eliminado** |
| `createPodAndAssignStudent(student, emoji, emojiLabel)` | Sí | Firma simplificada: `createPodAndAssignStudent(student)` |
| `PodChangeDropdown` | "Crear nuevo grupo" llevaba a pick-emoji | "Crear nuevo grupo" crea con siguiente nombre disponible |
| `regroupWithLocks` | Mantenía emojis/colores | Mantiene **colores** (los nombres son por índice, persistentes) |
| Cabecera de grupo | Emoji 28px + nombre del emoji | **Píldora MAYÚSCULAS con el nombre del grupo** |
| Persist version | 8 | **9** (migración limpia emoji/emojiLabel/evaluation + trunca pods >4) |

### 12.3 Cambios v5 → v6 (resumen, ya consolidados)

- Reparto: maximize-4 → balanceado simple con cap duro `robots*4`.
- Excedentes → "Pendientes de asignar" (no se fuerzan en pods llenos).
- DnD/move a pod lleno: rechazado con `destination-pod-full`.
- Eliminados: `PodEvaluationRadio`, `Pod.evaluation`, vista alfabética, `sortMode`, `setSortMode`, `PodGroupingModal`, `SessionPrompt`.
- `PodCountControls` rediseñado como stepper.

### 12.3 Algoritmo: tabla de comportamiento

| Presentes | Robots | Capacity (=robots×4) | Asignados | Pendientes | Sizes |
|---|---|---|---|---|---|
| 10 | 4 | 16 | 10 | 0 | `[3,3,2,2]` |
| 12 | 4 | 16 | 12 | 0 | `[3,3,3,3]` |
| 13 | 4 | 16 | 13 | 0 | `[4,3,3,3]` |
| 16 | 4 | 16 | 16 | 0 | `[4,4,4,4]` |
| 18 | 4 | 16 | **16** | **2** | `[4,4,4,4]` |
| 30 | 5 | 20 | **20** | **10** | `[4,4,4,4,4]` |
| 30 | 10 | 40 | 30 | 0 | `[3,3,3,3,3,3,3,3,3,3]` |
| 30 | 15 | 60 | 30 | 0 | `[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]` |
| 3 | 2 | 8 | 3 | 0 | `[2,1]` |

### 12.4 Validaciones / errores

| Punto | Caso | Resultado |
|---|---|---|
| `createPods` | `robotCount > presentCount` | `Hay más robots que alumnos` |
| `createPods` | `robotCount > 15` | `Máximo 15 grupos permitidos` |
| `createPods` | `presentCount > students.length` | `No hay tantos alumnos en clase` |
| `createPods` | `presentCount > capacity` | Sin error; los sobrantes quedan pendientes. |
| `moveStudent` / `addStudentToPod` | Pod destino lleno | `{ok: false, reason: 'destination-pod-full'}` |
| DnD | Pod lleno | Ring rojo, cursor not-allowed, banner 2.5s |
| `PodChangeDropdown` | Pod lleno | Opción deshabilitada con tooltip "Grupo lleno" |
| `PodCountControls` | Valor inválido | Error 4s, revierte al último válido |
| `createEmptyPod` | 15 pods existentes | `Máximo 15 grupos permitidos` |

### 12.5 Persistencia: qué sobrevive a un refresh

| Item | Persistido |
|---|---|
| `pods` (composición, emojis, colores) | ✓ |
| `lockedStudentIds` | – |
| `lastRobotCount` | ✓ |
| Vista (no existe `sortMode`) | n/a |

### 12.6 Historial de commits relevantes

```
HEAD    feat: v7 — nombres de grupos (GROUP_NAMES) sustituyen emojis completamente
fef18ba feat: v6 — algoritmo balanceado con max 4 estricto, sin vista alfabética ni semáforos, stepper de robots
c5490a4 feat(ui): quitar input 'Alumnos' de PodCountControls
497255c docs: actualizar SUPERPROMPT.md con todos los cambios UX finales
5194ab2 chore: limpiar carpetas historicas, huerfanos y docs obsoletas
f90e30e feat(pods): auto-agrupar al cargar + min/max recomendados (no estrictos)
0e07906 feat(ui): toggle Lista/Grupos simetrico, drag handle Equal y dropdown en pendientes
ba18a7a ci: deploy solo desde main + anadir typecheck y tests al pipeline
… (ver git log para v5 completo)
```

### 12.7 Cómo arrancar

```bash
cd robotix_group_prototype
npm install
npm run dev                # http://localhost:3000/mi-alumnado
npm test                   # 76/76
npm run typecheck          # verde
npm run build              # estático en out/, verde
```

`.env.local` necesita `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### 12.8 Lista oficial de nombres de grupos

```ts
export const GROUP_NAMES = [
  "ORION", "APOLLO", "VOYAGER", "ARTEMIS", "ECLIPSE",
  "COSMOS", "GALAXY", "SUPERNOVA", "NEBULA", "ASTRO",
  "SATURN", "JUPITER", "MARS", "VENUS", "SUN",
  "PEGASUS", "PLUTO",
] as const;
```

Tope duro `MAX_PODS = 15`. Los 2 últimos nombres son reserva. Asignación
por índice: pod-1 → `GROUP_NAMES[0] = ORION`, pod-2 → `APOLLO`, etc.
Al eliminar un grupo, los pods restantes se renumeran y sus nombres también
se reasignan desde `GROUP_NAMES[0]` en adelante.

---

*SUPERPROMPT.md v7.0 — Prototipo Grupos (C360 / ROBOTIX). Spec viva.*

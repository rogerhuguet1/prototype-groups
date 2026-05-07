````markdown
# SUPERPROMPT.md — Prototipo de Agrupación por PODs (C360 / ROBOTIX)

> Prompt para Claude Code. Construye un prototipo aislado de la feature "Agrupar por PODs" sobre la pantalla "Mi alumnado: Progreso por unidad didáctica" del C360. Usa datos mock desde Supabase. No persiste PODs. No toca producción.

---

## 1. Contexto

- **Producto**: prototipo de una nueva feature para el programa C360 de ROBOTIX.
- **Objetivo**: validar la UX de agrupación por PODs (3-4 alumnos por robot) antes de integrarla en el C360 real.
- **Pantalla destino**: réplica visual de "Mi alumnado: Progreso por unidad didáctica" (lista de alumnos con columnas de progreso por unidad).
- **Repo**: nuevo, aislado. **No tocar el C360 existente.**
- **Persistencia**: ninguna. PODs viven en memoria (Zustand). Al refrescar se pierden.
- **Mock data**: tabla `students` ya creada en Supabase de test.

Si esta validación va bien, después se integra en el C360 real. Pero ese trabajo no forma parte de este prompt.

---

## 2. Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 15.x |
| Lenguaje | TypeScript | strict, `noUncheckedIndexedAccess: true` |
| UI | Tailwind | v4 |
| Estilo runtime | React | 19 |
| Server state | Tanstack Query | v5 |
| UI state | Zustand | v5 |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/accessibility` | última estable |
| Validación | Zod | última |
| Backend datos | Supabase (mock, ya provisto) | client `@supabase/ssr` |
| Tests | Vitest + Testing Library | última |

**No instalar nada más** sin justificación.

---

## 3. Conexión Supabase (mock)

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://andprbqacpspbxmqqxuj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable__-RDC0rLI9Rg2iARjbOnXA_t2uICKYK
```

Estas credenciales son del proyecto de test. La anon key de Supabase es pública por diseño (RLS protege los datos), por lo que es seguro tenerla en `.env.local` y referenciarla con `NEXT_PUBLIC_`.

### Tablas relevantes en la BD

- **`students`**: contiene los alumnos mock. Columnas (al menos): `id`, `full_name`, `initials`, `avatar_url`, `class_id`, `created_at`. (Confirmar columnas exactas con un `select * limit 1` en Fase 1.)
- **`classes`**: contiene los cursos. Columnas (al menos): `id`, `name`, `subject`, `created_at`.

El resto de tablas (`groups`, `evaluations`, etc.) **no se tocan en este prototipo**.

---

## 4. Comportamiento detallado de la feature

### 4.1 Estado inicial (sin PODs creados)

Pantalla "Mi alumnado: Progreso por unidad didáctica":

- Lista de alumnos en orden alfabético por apellido.
- Columnas mock de progreso por unidad didáctica (no es lo importante en este prototipo; basta una rejilla con celdas vacías o aleatorias para que el contexto visual encaje).
- Barra superior con:
  - **`Agrupar`** (botón visible, siempre activo).
  - **Selector de clase** si hay más de una en la BD (dropdown con los `classes.name`).
  - **`Descargar`** (botón decorativo, no funcional en el prototipo).

### 4.2 Pulsar `Agrupar`

Abre un modal con:

```
┌─────────────────────────────────────┐
│  Agrupar por PODs                   │
│                                     │
│  Alumnos presentes hoy:  [____]     │
│  Robots disponibles:     [____]     │
│                                     │
│            [Cancelar]  [Crear PODs] │
└─────────────────────────────────────┘
```

Validaciones (Zod):

- Ambos campos enteros > 0.
- `robotCount <= presentStudents`.
- Si fallan, mostrar mensaje claro debajo del input afectado.

### 4.3 Pulsar `Crear PODs` en el modal

1. Llama a `createPods({ presentStudents, robotCount })` (función pura, ver §5).
2. Toma los primeros `presentStudents` alumnos de la lista (los demás no participan en esta sesión).
3. Asigna cada alumno a un POD según el resultado de la función.
4. Guarda los PODs en el store Zustand.
5. Cierra el modal.
6. **Activa `Vista con POD = ON` automáticamente.**
7. **Pone el sort en `Por grupos` automáticamente.**

### 4.4 Estado con PODs creados

Aparecen dos controles nuevos en la barra superior, a la derecha de `Agrupar`:

- **Checkbox `Vista con POD`**: encendido por defecto tras crear PODs.
- **Segmented control `[Alfabético | Por grupos]`**: visible **solo cuando `Vista con POD = ON`**. Por defecto en `Por grupos` tras crear PODs.

Layout de la barra:

```
[Agrupar]   ☑ Vista con POD   [Alfabético | Por grupos]   [Descargar]
            (visible si hay PODs) (visible si Vista ON)
```

### 4.5 Comportamiento de `Vista con POD`

| Vista con POD | Sort | Resultado |
|---|---|---|
| **ON** | Alfabético | Lista alfabética con badge `POD X` + color a la izquierda de cada nombre. **Sin DnD.** |
| **ON** | Por grupos | Lista agrupada por POD (todos los del A juntos, luego B, etc.) con badges + color. **Con DnD.** |
| **OFF** | (no aplica, segmented oculto) | Lista alfabética sin badges, como antes de agrupar. **Sin DnD.** |

Apagar `Vista con POD` **no borra los PODs** del store. Al reactivar, vuelven a aparecer los mismos.

### 4.6 Badge de POD a la izquierda del nombre

Componente `PodBadge` con la letra del POD (`A`, `B`, `C`...) y el color del POD. Aparece a la izquierda del nombre del alumno en cada fila cuando `Vista con POD = ON`.

```
🟦 POD A   BRASERO PALOP, VERONA      | ✓ ✓ 🟢 🟧 🟧 ...
🟧 POD B   CABRERO MARTÍN, ALBA       | ✓ ✓ 🟢 🟢 🟧 ...
```

### 4.7 Drag & drop (solo en `Vista con POD = ON` + sort `Por grupos`)

- Cada fila de alumno tiene un **handle `⋮⋮`** al inicio (icono Lucide `GripVertical` o equivalente).
- El handle es la única zona arrastrable.
- Arrastrar una fila por el handle y soltarla **dentro del bloque de otro POD**: el alumno cambia de POD, su badge cambia de letra y color.
- Si el POD destino está lleno (`max = 4`): drop inválido, ring rojo, cursor `not-allowed`, no se ejecuta la acción.
- Si el POD destino está disponible: animación de entrada, mover, listo.
- En cualquier otro modo (`Vista con POD = OFF` o sort `Alfabético`): el handle **no se renderiza** y el DnD no está activo.

### 4.8 Botón `+` para añadir alumno a un POD

- En la cabecera visual del bloque de cada POD (separador entre grupos), un botón `+`.
- Al pulsar: abre un menú/popover con la lista de alumnos sin asignar.
- Si POD lleno: botón disabled con tooltip "POD lleno".
- Si no hay alumnos sin asignar: botón disabled con tooltip "No hay alumnos disponibles".
- Solo visible en sort `Por grupos`.

---

## 5. Función `createPods` (lógica pura)

Vive en `lib/pods/create-pods.ts`. **Sin dependencias de UI ni de Supabase.** Testeable con Vitest.

```ts
type Student = {
  id: string;
  full_name: string;
};

type Pod = {
  id: string;       // 'pod-a', 'pod-b', ...
  label: string;    // 'POD A', 'POD B', ...
  color: string;    // hex color del POD
  students: Student[];
  maxCapacity: number;
};

type CreatePodsInput = {
  students: Student[];
  presentCount: number;
  robotCount: number;
  maxPerPod?: number;  // default 4
  minPerPod?: number;  // default 3
};

function createPods(input: CreatePodsInput): Pod[];
```

### Reglas

1. Tomar los primeros `presentCount` alumnos.
2. Crear `robotCount` PODs.
3. Repartir los alumnos lo más equilibrado posible respetando `maxPerPod`.
4. Letras de POD: `A`, `B`, `C`, ... (incremental).
5. Colores: paleta fija de 12 colores en `lib/pods/pod-colors.ts`. Si hay más de 12 PODs, ciclar.
6. Si `robotCount > presentCount`: lanzar error `'Hay más robots que alumnos'`.
7. Si `presentCount > students.length`: lanzar error `'No hay tantos alumnos en clase'`.

### Casos de test obligatorios (Vitest)

```
24 alumnos / 6 robots → 6 PODs de 4
22 alumnos / 6 robots → 4 PODs de 4 + 2 PODs de 3
18 alumnos / 5 robots → 3 PODs de 4 + 2 PODs de 3
20 alumnos / 5 robots → 5 PODs de 4
1 alumno  / 1 robot   → 1 POD de 1
0 alumnos / 1 robot   → error
2 alumnos / 5 robots  → error (más robots que alumnos)
```

---

## 6. Estructura de archivos esperada

```
app/
  layout.tsx
  page.tsx                              ← redirige a /mi-alumnado o renderiza directamente
  mi-alumnado/
    page.tsx                            ← pantalla principal del prototipo

components/
  pods/
    PodGroupingButton.tsx               ← botón "Agrupar"
    PodGroupingModal.tsx                ← modal con los 2 inputs
    PodViewToggle.tsx                   ← checkbox "Vista con POD"
    PodSortControl.tsx                  ← segmented "Alfabético | Por grupos"
    PodBadge.tsx                        ← chip "POD X" coloreado
    PodAddStudentButton.tsx             ← botón "+" en cabecera de POD
    PodAddStudentMenu.tsx               ← popover con la lista de no asignados
  students/
    StudentTable.tsx                    ← tabla principal
    StudentRow.tsx                      ← fila (con o sin handle, con o sin badge)
    DragHandle.tsx                      ← icono ⋮⋮ arrastrable
  ui/
    Button.tsx, Input.tsx, Modal.tsx, Checkbox.tsx, SegmentedControl.tsx, ...

lib/
  pods/
    create-pods.ts                      ← función pura
    move-student.ts                     ← helper para validar y aplicar movimiento entre PODs
    pod-colors.ts                       ← paleta de 12 colores
  supabase/
    client.ts                           ← createBrowserClient
  utils/
    cn.ts                               ← clsx + tailwind-merge

store/
  pods-store.ts                         ← Zustand: { pods, viewWithPods, sortMode, actions }

types/
  pods.ts                               ← Pod, Student, SortMode, ...
  database.ts                           ← tipos generados de Supabase

__tests__/
  pods/
    create-pods.test.ts
    move-student.test.ts
```

---

## 7. Plan de implementación por fases

Cada fase termina con un commit y un mensaje al humano explicando qué se ha hecho, qué archivos se han tocado, cómo probarlo, y esperando OK antes de seguir.

### Fase 1 — Setup y conexión Supabase

- [ ] `npx create-next-app@latest` con TS, Tailwind, App Router.
- [ ] Instalar deps: `@supabase/ssr`, `@tanstack/react-query`, `zustand`, `zod`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/accessibility`, `lucide-react`, `clsx`, `tailwind-merge`.
- [ ] Devs: `vitest`, `@testing-library/react`, `@vitejs/plugin-react`, `jsdom`.
- [ ] Crear `.env.local` con las credenciales del §3.
- [ ] `lib/supabase/client.ts` con `createBrowserClient`.
- [ ] Generar tipos: `npx supabase gen types typescript ...` o crear manual `types/database.ts` tras inspeccionar el schema.
- [ ] Hook `useStudents(classId)` con Tanstack Query.
- [ ] Selector de clase si hay más de una en la BD.
- [ ] `app/mi-alumnado/page.tsx` que renderiza una tabla básica con: handle hueco, columna nombre, columnas mock de progreso (basta con celdas grises o un placeholder coloreado al azar para dar contexto).
- [ ] Replicar visualmente la captura: header azul, tabla con columnas C1250 — Unidad N, sidebar con cursos (puede ser estática para el prototipo).

**Done cuando**: arranca `npm run dev`, navegas a `/mi-alumnado`, y se ven los nombres reales de la tabla `students` cargados desde Supabase, en orden alfabético.

### Fase 2 — Función pura `createPods` + tests

- [ ] Implementar `createPods()` siguiendo §5.
- [ ] Implementar `lib/pods/pod-colors.ts` con 12 colores accesibles (contraste decente con texto blanco/negro).
- [ ] Tests Vitest con todos los casos del §5.
- [ ] Configurar `npm test`.

**Done cuando**: `npm test` pasa los 7 casos.

### Fase 3 — Botón Agrupar + Modal + Store Zustand

- [ ] `PodGroupingButton` en la barra superior.
- [ ] `PodGroupingModal` con dos inputs validados con Zod.
- [ ] `usePodsStore` (Zustand) con: `pods`, `viewWithPods`, `sortMode`, `createPods()`, `resetPods()`.
- [ ] Al confirmar el modal: llama a `createPods`, guarda en store, activa `viewWithPods = true`, sort = `'grouped'`, cierra modal.
- [ ] **Por ahora la tabla no cambia visualmente al crear PODs.** Solo se ve el efecto en consola/devtools de React.

**Done cuando**: abres el modal, validaciones funcionan, al confirmar el store tiene los PODs.

### Fase 4 — Vista con PODs en la tabla

- [ ] `PodViewToggle` y `PodSortControl` en la barra superior, condicionados a `pods.length > 0`.
- [ ] `PodBadge` componente.
- [ ] `StudentTable` lee del store y aplica:
  - Si `viewWithPods = true`: añade columna izquierda con `PodBadge`.
  - Si `sortMode = 'alphabetical'`: orden alfabético.
  - Si `sortMode = 'grouped'`: agrupa por POD (todos los del A, luego B, etc.).
- [ ] El segmented control solo aparece si `viewWithPods = true`.
- [ ] Al apagar `viewWithPods`: badges desaparecen, lista vuelve a alfabético, segmented oculto. **PODs siguen en el store.**

**Done cuando**: puedes alternar entre los 3 modos válidos del §4.5 y los PODs persisten en el store al apagar la vista.

### Fase 5 — Drag & drop con @dnd-kit

- [ ] `DragHandle` componente, visible solo en modo `grouped`.
- [ ] `StudentTable` envuelta en `DndContext` con `closestCorners` o `closestCenter`.
- [ ] Cada bloque de POD es un `Droppable`.
- [ ] Cada fila de alumno es `Sortable` por su handle.
- [ ] `move-student.ts` con la lógica de validación: ¿el destino está lleno? ¿el alumno ya estaba allí?
- [ ] Visual: ring verde sobre POD destino válido, ring rojo si lleno.
- [ ] Anuncios ARIA con el módulo de accessibility de `@dnd-kit`.

**Done cuando**: puedes arrastrar un alumno de POD A a POD B y se actualiza el badge. Si POD B está lleno, el drop se rechaza visualmente.

### Fase 6 — Botón `+` en cada POD

- [ ] `PodAddStudentButton` en la cabecera de cada bloque de POD (visible solo en sort `grouped`).
- [ ] `PodAddStudentMenu` popover con la lista de alumnos sin asignar a ningún POD.
- [ ] Disabled si POD lleno o no hay sin asignar, con tooltip explicativo.
- [ ] Al seleccionar un alumno: se añade al POD (validar capacidad antes).

**Done cuando**: puedes añadir un alumno no presente al POD A si tiene espacio, y los disabled states funcionan.

---

## 8. Reglas de implementación

- **Cero código antes de Fase 1**. Lee este archivo, instala deps, conecta Supabase, renderiza tabla básica con datos reales.
- **Cero feature creep**. Si el SUPERPROMPT no lo pide, no se hace.
- **Ningún archivo del C360 existente se toca.** Esto vive en su propio repo.
- **Cero persistencia**. PODs en Zustand y nada más. No hay tabla `pods` en Supabase.
- **Cero integración Moodle.** Esto es prototipo de UX puro.
- **Cero comentarios decorativos.** El código debe explicarse solo. Comentarios solo donde la lógica no es obvia (ej. la validación de drop).
- **Tipos estrictos**: ningún `any`, ningún `as` salvo casteo necesario tras Zod parse.
- **i18n no es necesario** en este prototipo. Strings en castellano hardcoded, OK.
- **Tests solo para `createPods` y `move-student`** en este prototipo. No tests E2E todavía.
- **Después de cada fase**: explicar qué se ha tocado, cómo probarlo, hacer commit con mensaje convencional, esperar OK del humano antes de seguir a la siguiente fase.

---

## 9. Resultado final esperado

El MVP del prototipo es correcto si:

1. La pantalla `/mi-alumnado` carga alumnos reales desde la Supabase mock.
2. El profesor pulsa `Agrupar`, abre el modal, introduce 24 alumnos / 6 robots, confirma.
3. La tabla se reorganiza mostrando 6 PODs de 4 alumnos, agrupados, con badges de color.
4. El profesor desactiva `Vista con POD`: lista alfabética sin badges.
5. Lo reactiva: badges vuelven, sort vuelve a `Por grupos`.
6. Cambia el segmented a `Alfabético`: alumnos ordenados alfabéticamente pero con sus badges.
7. Vuelve a `Por grupos`: arrastra un alumno de POD A a POD B → cambia el badge.
8. Intenta arrastrar a un POD lleno: rechazado visualmente, no se ejecuta.
9. Pulsa `+` en POD C: aparece menú con alumnos no presentes ese día, selecciona uno, se añade.
10. Refresca la página: los PODs se pierden (es lo esperado en este prototipo).

---

## 10. Primera instrucción para Claude Code

**Empieza ahora con Fase 1.**

1. Inicializa el proyecto Next.js 15 con TypeScript, Tailwind v4, App Router.
2. Instala las dependencias del §2.
3. Crea `.env.local` con las credenciales del §3.
4. Configura Supabase client en `lib/supabase/client.ts`.
5. Genera o crea manualmente los tipos de la BD en `types/database.ts`. Si tienes acceso al CLI, usa `supabase gen types`. Si no, haz un `select * from students limit 1` y un `select * from classes limit 1` para inspeccionar columnas y construye los tipos a mano.
6. Crea `app/mi-alumnado/page.tsx` con una tabla básica de alumnos cargados desde Supabase, ordenados alfabéticamente por `full_name`. Replica visualmente el header azul y las columnas mock de progreso (basta con celdas placeholder; lo importante es la silueta de la pantalla).
7. Si hay varias clases en la tabla `classes`, añade un selector arriba a la derecha.
8. Cuando arranque y veas los nombres reales en la tabla, **párate, haz commit, y reporta al humano** con: archivos creados, comandos para probarlo, y pregunta si pasamos a Fase 2.

No avances a Fase 2 hasta tener OK explícito.

---

*SUPERPROMPT.md v1.0 — Prototipo PODs (C360 / ROBOTIX). Listo para Claude Code.*
````

---

## 12. Estado actual de la implementación (mayo 2026)

> Apéndice operativo. Recoge lo que está construido, las decisiones tomadas y los aprendizajes para que cualquier sesión futura tenga contexto sin tener que reconstruirlo. Cuando algo cambie, actualizar aquí en el mismo PR.

### 12.1 Resumen ejecutivo del estado

El prototipo está **funcionalmente completo** según la versión v2 del spec (la que reemplaza "POD" → "Grupo" en UI y añade emojis STEM). Vive en `http://localhost:3000/mi-alumnado`. Server siempre cargable con `npm run dev`.

- **40/40 tests Vitest verde** en 3 archivos (`create-pods`, `move-student`, `edit-pod`).
- **TypeScript strict** sin errores (`noUncheckedIndexedAccess: true`).
- Conectado a Supabase real: tabla `students` con 30 alumnos en 1 clase ("2º Bachillerato A").
- Layout pixel-perfect contra el mock C360 (sidebar oscura, leyenda de bandas, columnas agrupadas por unidad).

### 12.2 Hallazgos sobre los datos reales

- `full_name` viene como `"Nombre Apellido1 Apellido2"` (ej. "Ana García López"), **no** como `"APELLIDO, NOMBRE"`. El parser `lastNameKey` ordena por la parte después del primer espacio. `displayName` reformatea a `"GARCÍA LÓPEZ, ANA"` para visualización.
- Solo 1 clase en BD → `ClassSelector` no se muestra (correcto según §4.1 v2).
- `.env.local` usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (formato nuevo `sb_publishable_*`), no `ANON_KEY`. El cliente lo lee desde `lib/supabase/client.ts`.

### 12.3 Cambios v1 → v2 (ya aplicados)

| Concepto | v1 | v2 implementado |
|---|---|---|
| Identidad de grupo | Letras A, B, C... | Emoji STEM aleatorio único (de 15) |
| Nombre interno | `pod-a`, `pod-b` | `pod-1`, `pod-2`, ... |
| UI | "POD A", "POD lleno" | "Grupo 🤖", "Grupo lleno" |
| Modal | "Agrupar por PODs", "Crear PODs" | "Agrupar", "Crear Grupos" |
| Toggle | "Vista con POD" | "Vista con Grupos" |
| Validación | `robotCount <= presentCount` | `+ robotCount <= 15` |
| Asignación de color | Cíclico por índice | Furthest-point sampling sobre paleta de 15 |
| Edición de emoji | n/a | `PodEmojiPicker` en cabecera de bloque |
| Cambio de grupo en alfabético | n/a | `PodChangeDropdown` desde badge clickeable |
| "Sin grupo" en dropdown | n/a | Opción al final del dropdown |
| Crear grupo desde dropdown | n/a | Sí: muta a emoji picker, crea + asigna |

### 12.4 Decisiones técnicas y de diseño

**Datos / lógica pura:**
- `Pod.color` permanece como struct `PodColor` (con `hex`, `name`, `textOn`) en lugar del `string` que pedía el spec; necesario para decidir contraste de texto sin recalcular luminancia en cada render.
- `Pod.id` formato `pod-N` numérico, secuencial al crear (`pods.length + 1`). No se reciclan ids cuando se eliminan pods (no hay eliminación en MVP).
- `createPods` toma los **primeros `presentCount` alumnos en orden de entrada**, los **baraja** (Fisher–Yates con `random()` inyectable), y los reparte. Los grupos se ven aleatorios cada vez. La "primera N" es deterministica para que el unassigned set sea predecible.
- `createPods` capa `effectivePresent = min(presentCount, robotCount * maxPerPod)`. Si el profesor mete 30/3 con max=4, solo se asignan 12; los 18 restantes quedan en "Sin asignar" (no se fuerzan en grupos sobrellenos).
- Selección de colores por **furthest-point sampling** (`pickUniqueColors` en `create-pods.ts`): la 1ª elección es aleatoria, las siguientes maximizan distancia RGB mínima a las ya elegidas. Garantiza separación visual incluso con N pequeño.
- Selección de emojis: `shuffle + slice(N)` simple sobre `POD_EMOJIS` (15 elementos). Sin reposición.
- Dentro de cada grupo, el orden de los alumnos al renderizar es **alfabético por apellido** (computado en `StudentTable` con `sortByLastName(pod.students)`). El array interno del store mantiene el orden de inserción para no perder datos.

**Renderizado / store:**
- Tres modos visuales (controlados por `viewWithPods` y `sortMode` en el store):
  1. `viewWithPods=false`: alfabética sin badges (default sin grupos creados).
  2. `viewWithPods=true && sortMode="alphabetical"`: alfabética con badge clickeable. **Sin DnD.**
  3. `viewWithPods=true && sortMode="grouped"`: agrupada con cabeceras + DnD. **Sin badge clickeable.**
- Apagar `viewWithPods` no borra los pods del store; al reactivar vuelven idénticos.
- Tras crear los grupos, el store fuerza `viewWithPods=true` y `sortMode="grouped"`.
- DnD usa `@dnd-kit/core` solo (no `sortable`). Cada `<tbody>` por grupo es un `Droppable`; cada fila un `Draggable` cuyo activator es solo el handle `⋮⋮`.
- Drop válido se valida en `addStudentToPod` (lib pura): error `destination-pod-full` si capacidad excedida. UI muestra banner `role="alert"` 2.5s.
- Popovers (cambio de grupo, emoji picker, añadir alumno) usan **portal a `document.body`** + posición `fixed` calculada en `useLayoutEffect` con `computePopoverPosition` (`lib/utils/popover-position.ts`): si no cabe abajo flipa arriba; clamp al viewport horizontalmente.

**Estilo:**
- `text-3xl`/headings/colors → match del mock C360. Sidebar `bg-[#1f2937]` con highlight `bg-cyan-300/90` para el item activo. Header bar fondo `#e8eef1` (gris azulado). Botón Descargar `bg-[#0e7c66]` (turquesa).
- 5 bandas de score (`Insuficiente`, `Suficiente`, `Bien`, `Notable`, `Excelente`) + dos kinds visuales (`completed` ✓, `failed` ✗, `empty`). Celdas `size-5` (20px) con bg saturado por banda.
- Activity headers de la tabla con rotación −55° y altura fija 92px.

### 12.5 Estructura de archivos real

```
robotix_group_prototype/
├── app/
│   ├── layout.tsx                             ← root + Providers
│   ├── globals.css                            ← @import "tailwindcss" + @theme
│   ├── page.tsx                               ← redirige a /mi-alumnado
│   ├── providers.tsx                          ← QueryClientProvider
│   └── mi-alumnado/page.tsx                   ← AppShell
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx                       ← Sidebar + Main
│   │   ├── Sidebar.tsx                        ← oscura, cursos hardcoded
│   │   ├── TopBar.tsx                         ← Mi alumnado + Descargar + Agrupar
│   │   └── ClassSelector.tsx                  ← solo si classes.length > 1
│   ├── pods/
│   │   ├── PodGroupingButton.tsx              ← botón Agrupar (variant secondary)
│   │   ├── PodGroupingModal.tsx               ← modal con 2 inputs Zod
│   │   ├── PodControls.tsx                    ← strip azul (toggle + sort)
│   │   ├── PodViewToggle.tsx                  ← checkbox Vista con Grupos
│   │   ├── PodSortControl.tsx                 ← segmented Alfabético/Por grupos
│   │   ├── PodBadge.tsx                       ← chip emoji + color (size sm/md, prefix, withChevron)
│   │   ├── PodBadgeWithDropdown.tsx           ← badge clickeable + PodChangeDropdown
│   │   ├── PodChangeDropdown.tsx              ← portal: lista + Sin grupo + Crear nuevo (mode list/pick-emoji)
│   │   ├── PodHeaderTrigger.tsx               ← cabecera "Grupo 🤖 ▾" abre PodEmojiPicker
│   │   ├── PodEmojiPicker.tsx                 ← portal grid 5x3 con emojis en uso disabled
│   │   ├── PodAddStudentButton.tsx            ← botón + en cabecera
│   │   ├── PodAddStudentMenu.tsx              ← portal: lista de no asignados
│   │   └── PodDroppableTbody.tsx              ← <tbody> droppable + ring verde/rojo
│   ├── students/
│   │   ├── StudentTable.tsx                   ← thead doble + tbody por grupo + Sin asignar + Crear nuevo grupo
│   │   ├── StudentRow.tsx                     ← celda Alumno sticky + 24 celdas progreso
│   │   ├── StudentRowDraggable.tsx            ← StudentRow con useDraggable + handle
│   │   ├── DragHandle.tsx                     ← icono GripVertical accesible
│   │   └── ScoreLegend.tsx                    ← strip de 6 chips + "Última actualización"
│   └── ui/
│       ├── Button.tsx                         ← primary/secondary/ghost/danger
│       ├── Input.tsx                          ← con label, error, hint
│       ├── Modal.tsx                          ← focus trap, ESC, click outside
│       ├── Checkbox.tsx
│       └── SegmentedControl.tsx               ← radiogroup accesible
├── hooks/
│   ├── useStudents.ts                         ← Tanstack Query
│   └── useClasses.ts                          ← Tanstack Query
├── lib/
│   ├── pods/
│   │   ├── create-pods.ts                     ← createPods, createEmptyPod, shuffleInPlace
│   │   ├── move-student.ts                    ← moveStudent, addStudentToPod, removeStudentFromPod
│   │   ├── edit-pod.ts                        ← changePodEmoji
│   │   ├── pod-colors.ts                      ← 15 colores con max contraste
│   │   ├── pod-emojis.ts                      ← 15 emojis STEM + MAX_PODS=15
│   │   └── grouping-schema.ts                 ← Zod del modal
│   ├── data/units.ts                          ← 6 unidades × 4 actividades hardcoded
│   ├── supabase/client.ts                     ← createBrowserClient
│   └── utils/
│       ├── cn.ts                              ← clsx + tailwind-merge
│       ├── sort-students.ts                   ← lastNameKey + displayName + sortByLastName
│       ├── progress-cells.ts                  ← progressCellFor + BAND_STYLES
│       └── popover-position.ts                ← computePopoverPosition (flip-above)
├── store/
│   └── pods-store.ts                          ← Zustand v5
├── types/
│   └── database.ts                            ← Database, StudentRow, ClassRow
├── __tests__/pods/
│   ├── create-pods.test.ts                    ← 22 tests
│   ├── move-student.test.ts                   ← 13 tests
│   └── edit-pod.test.ts                       ← 5 tests
├── SUPERPROMPT.md                             ← este archivo
├── CLAUDE_SCHEMA.md                           ← schema Supabase
├── package.json                               ← Next 15.5, React 19, Tailwind 4, etc.
├── tsconfig.json                              ← strict + noUncheckedIndexedAccess
├── next.config.ts
├── postcss.config.mjs
├── vitest.config.ts                           ← alias @ → ./
└── legacy/                                    ← prototipos anteriores (no se tocan)
```

### 12.6 Tipos clave

```ts
// lib/pods/create-pods.ts
type Student = { id: string; full_name: string };
type Pod = {
  id: string;          // "pod-1", "pod-2", ...
  emoji: string;       // "🤖"
  emojiLabel: string;  // "Robot"
  color: PodColor;     // { hex, name, textOn: "white" | "black" }
  students: Student[];
  maxCapacity: number; // default 4
};
type CreatePodsInput = {
  students: Student[];
  presentCount: number;
  robotCount: number;
  maxPerPod?: number;        // default 4
  minPerPod?: number;        // default 3 (no enforced, informativo)
  random?: () => number;     // default Math.random — para tests deterministas
};
```

### 12.7 Store API (`usePodsStore`)

```ts
type State = {
  pods: Pod[];
  viewWithPods: boolean;
  sortMode: "alphabetical" | "grouped";
};

type Actions = {
  // creación
  createPodsFromInput: (input: { students, presentCount, robotCount }) => void;
  resetPods: () => void;
  addEmptyPod: () => void;                      // nuevo grupo random sin alumnos
  createPodAndAssignStudent: (student, emoji, label) => void;  // crear + asignar atómico
  // ui
  setViewWithPods: (on: boolean) => void;
  setSortMode: (mode: SortMode) => void;
  // movimientos
  moveStudent: (studentId, toPodId) => MoveStudentResult;
  addStudentToPod: (student, toPodId) => MoveStudentResult;     // dispatch interno: si está en otro pod, mueve; si no, añade
  removeStudentFromPod: (studentId) => MoveStudentResult;       // saca del pod actual
  // edición
  changeEmoji: (podId, emoji, label) => ChangeEmojiResult;
};
```

### 12.8 Validaciones / errores

| Capa | Regla | Mensaje |
|---|---|---|
| Modal Zod | `presentCount` int >0 | "Indica cuántos alumnos hay presentes" / "Debe ser un entero" / "Debe ser mayor que 0" |
| Modal Zod | `robotCount` int >0 | idem |
| Modal Zod | `robotCount <= 15` | "Máximo 15 grupos permitidos" |
| Modal Zod | `robotCount <= presentCount` | "No puede haber más robots que alumnos" |
| Modal handler | `presentCount <= totalStudents` | "Solo hay X alumnos en la clase" |
| `createPods` | `presentCount > students.length` | "No hay tantos alumnos en clase" |
| `createPods` | `robotCount > presentCount` | "Hay más robots que alumnos" |
| `createPods` | `robotCount > 15` | "Máximo 15 grupos permitidos" |
| `createPods` | cap silencioso | si `presentCount > robotCount * maxPerPod`, los excedentes quedan fuera (en "Sin asignar") |
| `moveStudent` / `addStudentToPod` | destino lleno | `destination-pod-full` → banner "El grupo destino está lleno" |
| `changePodEmoji` | emoji ya en uso | `emoji-in-use` (no se aplica) |
| `createEmptyPod` | 15 grupos ya creados | "Máximo 15 grupos permitidos" |

### 12.9 Convenciones visuales aplicadas

- Nombres de alumno en celda Alumno: `displayName(full_name)` → MAYÚSCULAS, formato "APELLIDO APELLIDO, NOMBRE", color azul `text-blue-700`, hover underline. Con `href="#"` y `e.preventDefault()`.
- Cabecera de bloque (sort grouped): fondo del color del grupo al 10% (`hex + "1a"`) + border-top de 2px del color completo + sticky-left. Contiene `PodHeaderTrigger` (`Grupo {emoji} ▾`), contador `N de M alumnos`, y `+` (PodAddStudentButton) en `ml-auto`.
- Tira de color en filas dentro de un grupo: `box-shadow: inset 4px 0 0 0 {color}` en la celda Alumno (`podColorBorder=true`). En grouped no se renderiza badge en cada fila (la cabecera ya tiene el grupo).
- Badge de cambio (alfabético): `PodBadge withChevron` (clickeable, abre `PodChangeDropdown`). El alumno sin grupo muestra placeholder dashed `Sin grupo ▾` también clickeable (mismo dropdown, header "Asignar a un grupo").
- DnD ring: tbody del grupo destino → verde si capacidad ok (`box-shadow: inset 0 0 0 2px rgb(16 185 129)` + tinte 4%), rojo si lleno. Sin ring en el origen.
- Botón "+ Crear nuevo grupo" al final de la tabla en grouped mode: full-width, `border-y dashed`, hover sutil. Sticky-left.
- Popovers: `position: fixed` calculada con `computePopoverPosition` (flip arriba si no cabe abajo, clamp horizontal). `visibility: hidden` hasta que la posición está computada (sin parpadeo).

### 12.10 Tests

```
__tests__/pods/create-pods.test.ts (22 tests):
  - 8 casos del SUPERPROMPT §6: 24/6, 22/6, 18/5, 20/5, 1/1, 0/1 error, 2/5 error, 30/16 error
  - 30/15 ok (límite)
  - primeros presentCount como pool
  - reparto entre grupos aleatorio (30 ejecuciones, ≥2 ordenaciones)
  - random() inyectable reproducible
  - emojis únicos, colores únicos hasta 15
  - ids pod-N secuenciales
  - cap presentCount > robotCount * maxPerPod (default + custom)
  - createEmptyPod sin colisión, con preferredEmoji disponible / en uso
  - error al intentar el 16

__tests__/pods/move-student.test.ts (13 tests):
  - moveStudent: A→B con espacio, POD lleno, mismo POD no-op, alumno
    inexistente, POD inexistente, inmutabilidad
  - removeStudentFromPod: ok, alumno no encontrado, inmutabilidad
  - addStudentToPod: ok, lleno, ya estaba en otro POD (delega en moveStudent)

__tests__/pods/edit-pod.test.ts (5 tests):
  - changePodEmoji: ok, emoji en uso por otro, no-op mismo emoji,
    pod inexistente, inmutabilidad

Total: 40/40 verde.
```

Para tests deterministas con shuffle: pasar `random: () => 0.999` (shuffle identidad) o un generador con secuencia fija.

### 12.11 Visual realmente clavado vs el mockup C360

Lo que está mimetizado pixel-aproximado del screenshot original (`Screenshot 2026-05-06 120918.png`):
- Sidebar oscura `bg-[#1f2937]` con cursos `1º ESO`, `2º ESO`, `3º ESO` y subitems.
- Header blanco: `Mi alumnado: Progreso por unidad didáctica` en `text-[#0f4c5c]`, breadcrumb `1º ESO / C1250 · Superhéroes futuro X`, botón Descargar teal.
- Score legend: 6 chips + "Última actualización 6/05/2026" en italic.
- Tabla: 6 unidades × 4 actividades con headers rotados, celdas score/check/X.
- Nombres en mayúsculas formato apellido, NOMBRE.

Lo que añadí encima del mockup (no estaba en la captura):
- Botón "Agrupar" pequeño junto a Descargar (variant secondary, no robar foco).
- Strip azul `PodControls` (toggle + sort) tras crear grupos.
- Cabeceras de bloque con tinte de color del grupo en mode grouped.
- Botón `+ Crear nuevo grupo` al final.

### 12.12 Limitaciones conocidas / fuera de scope

- **Sin persistencia**: refrescar pierde los grupos. Es lo esperado.
- **Sin auth / RLS estricta**: cualquiera con la URL del prototipo puede leer/escribir Supabase. Bloqueante para producción.
- **Sin tests E2E** (Playwright). Solo tests de lógica pura.
- **Sin tests de componentes**. Modales, dropdowns, etc., solo se validan manualmente.
- **`@dnd-kit/sortable` instalado pero no usado**. No se reordena dentro de un grupo (spec no lo pide).
- **`@dnd-kit/accessibility` no instalado**. Los utils ya están en `core`.
- **i18n no implementado**. Strings castellano hardcoded.
- **El botón "Crear nuevo grupo" no se autodesactiva al llegar a 15** (lanzaría error en el store). Si llegas, fallback es no hacer nada visible. Mejorable con `disabled` cuando `pods.length >= 15`.
- **`colorDistance` en `pickUniqueColors`** es Euclidean RGB, no perceptualmente uniforme (LAB/LCH sería más correcto). Suficiente con la paleta actual.
- **Tras un drag, el banner de error usa `setTimeout`**; si el usuario hace varios drags fallidos rápido, el último timeout tapa al anterior (no acumula). Aceptable.
- **Las `name` keys de `PodColor`** ("red", "navy"...) no se muestran al usuario, solo identifican en el código.

### 12.13 Cómo arrancar la próxima sesión

```bash
cd robotix_group_prototype
npm install
npm test          # debería decir 40 passed
npm run dev       # http://localhost:3000
```

Variables en `.env.local` (ya existe en el repo, gitignored):
```
NEXT_PUBLIC_SUPABASE_URL=https://andprbqacpspbxmqqxuj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable__-RDC0rLI9Rg2iARjbOnXA_t2uICKYK
```

### 12.14 Historial de commits relevantes (orden cronológico)

```
b783feb  Fase 1   scaffold Next.js 15 + Supabase + tabla /mi-alumnado
0d9755f  Fase 2   createPods puro + 14 tests verdes (paleta de 12 colores)
313b1fb  Fase 3   botón Agrupar + modal Zod + store Zustand
ac897ba  Fase 4   vista con badges + sort alfa/grouped + sección Sin asignar
35437eb  Fase 5   drag and drop entre PODs con @dnd-kit
414ebb4  Fase 6   botón + en cabecera de POD con menú de no asignados
284a803  style    mímica fiel del C360 mockup en /mi-alumnado
88b6de0  feat     reparto aleatorio + botón Crear nuevo POD vacío
1ac6db5  refactor identidad por emoji + color aleatorio único en createPods
097f776  feat     rebrand UI POD→Grupo + validación max 15
265165c  feat     dropdown para cambiar de grupo desde alfabético
6c1dd5f  feat     emoji picker en cabecera de grupo
99dead9  fix      popovers se autoposicionan + no asignados clickeables
1927dc1  fix      paleta de 15 colores + DnD en sin asignar + sin badge en grouped
f873fa6  fix      excedentes presentCount > robotCount*max quedan sin asignar
28c2200  feat     "Crear nuevo grupo" desde el dropdown con emoji picker
4d1cb5b  feat     orden alfabético dentro de cada grupo (al renderizar)
0fb03b6  feat     paleta con más contraste + max-distance sampling
```

---

## 13. Estado actual (mayo 2026, post-iteración v3+)

> Apéndice operativo. Refleja todos los cambios introducidos durante la sesión iterativa con el profesor (commits 893b70d → 53b61d3, ya en GitHub). Reemplaza la visión de §12 donde aún era válida; añade el comportamiento nuevo donde difiere.

### 13.1 Cambio de modelo principal

El producto **ya no es un wizard de "Agrupar"**. La vista por defecto es la pantalla del C360 sin grupos, y el profesor decide cuándo activar la vista de grupos pulsando un botón en el TopBar. La feature gira ahora alrededor de:

1. Pantalla inicial idéntica al mock C360 (sidebar oscura, ScoreLegend, tabla alfabética sin badges).
2. Botón **`Grupos`** en TopBar que, al pulsar, **genera una distribución aleatoria nueva** (no reutiliza la previa) y entra directo en sort `grouped`.
3. Menú **`Reagrupar`** con dropdown de cuatro modos (uno por progreso del curso + tres clásicos).
4. Botón **`Guardar`** que **reemplaza** la entrada activa del historial en lugar de duplicar.
5. Drag & drop, "+ Crear grupo", dropdown editable en alfabética, modo Proyección, panel Historial — todos disponibles solo cuando `viewWithPods=true`.

`viewWithPods` y `sortMode` **no se persisten**: cada carga de la app vuelve a alfabética, sin importar qué dejó el profesor abierto la vez anterior.

### 13.2 Ratio 1:3

- `DEFAULT_MAX_PER_POD = 3` (antes 4).
- `DEFAULT_MIN_PER_POD = 2`.
- Cálculo central: `robotCountFor(presentCount) = min(15, max(1, ceil(presentCount / 3)))`.
- Para 30 alumnos → 10 grupos de 3.
- Reparto con resto: `[3,3,3,3,3,3,3,3,2,2]` (los grupos llenos al principio, los menos llenos al final).
- Tests del SUPERPROMPT v3 §6 que asumían max=4 ahora pasan `maxPerPod: 4` explícito (su intención original sigue verificada).

### 13.3 Botón `Grupos` (PodToggleViewButton)

Vive en el TopBar. Reemplaza al borrado `PodGroupingButton`/`PodGroupingModal`.

- Visible cuando `students.length > 0 && !viewWithPods`.
- Si **no hay pods en el store**: click llama `createPodsFromInput(students, robotCountFor(students.length))` + `addEntry(...)` + `setCurrentEntryId(...)`. El store pone `viewWithPods=true` y `sortMode="grouped"`.
- Si **ya hay pods en el store** (vista apagada y reactivada): click solo reactiva la vista (`setViewWithPods(true)` + `setSortMode("grouped")`). **No regenera la distribución.** Para una nueva combinación aleatoria está `Reagrupar`.

### 13.4 Menú `Reagrupar` (PodRegroupMenu)

Dropdown desde el botón `Reagrupar` con dos secciones:

**Según el progreso del curso**
- **Por avance en el curso** — `createPodsByProgress`. Primary: `getStudentProgress` (unidad alcanzada 0-6). Secondary: `getStudentOverallScore` (promedio sobre TODAS las cells no-empty del curso). Disabled si Unidad 1 no completada.

**Sin tener en cuenta el progreso**
- **Aleatoria** — `createPods` clásico.
- **Mixta — equilibrada por nivel** — `createPodsByLevel(mode="mixed")`. Snake round-robin sobre orden de score Unidad 1. Disabled si Unidad 1 no completada.
- **Por niveles — alumnos similares juntos** — `createPodsByLevel(mode="leveled")`. Chunks contiguos por score Unidad 1. Disabled si Unidad 1 no completada.

Click en el botón `Reagrupar` SIEMPRE abre el menú; la opción seleccionada SIEMPRE pide `ConfirmDialog`. La semántica del v3 §5.8 (primer click instantáneo, segundo confirma) **se descartó por petición del usuario**.

`robotCount` en cada modo se recalcula vía `robotCountFor(presentCount)` para preservar el ratio 1:3 — `lastInputs.robotCount` se actualiza al valor nuevo. Antes el algoritmo respetaba el robotCount persistido aunque ya no encajara con 1:3.

### 13.5 Presets — funciones puras

```
createPods(input)                    → aleatorio puro con seed reproducible
createPodsByLevel(input, mode)       → mixed | leveled, score Unidad 1
createPodsByProgress(input)          → primary progress, secondary overallScore
                                       (delega en createPodsByLevel "leveled" con
                                        score compuesto = progress*1000 + score)
```

Funciones de score auxiliares (`lib/pods/student-score.ts`):
- `getStudentScore(id)` — promedio Unidad 1 (cols 0-3).
- `getStudentOverallScore(id)` — promedio del curso completo (cols 0-23).
- `getStudentProgress(id)` — unidad más alta (1-6) con al menos una cell no-empty; 0 si no ha empezado.
- `isUnitOneComplete(ids)` — true si ≥70% de cells de Unidad 1 son no-empty para los alumnos pasados.

### 13.6 Vista alfabética con dropdown editable (revertido v3 §5.7)

`PodBadgeWithDropdown` y `PodChangeDropdown` se borraron en `3b3c05c` siguiendo el spec v3 estricto, y se restauraron en `743fa90` por petición del profesor. En sort `Alfabético` con `viewWithPods=true`:
- Cada badge es clickeable y abre el dropdown.
- Opciones: lista de grupos disponibles, "Sin grupo", "Crear nuevo grupo" (sub-modo emoji-picker).
- Sin chevron en el badge sí que en el botón.
- "Sin grupo" se muestra como botón con borde dashed y chevron, también clickeable.

### 13.7 Acciones de edición disponibles desde la UI

| Origen | Acción | Donde |
|---|---|---|
| DnD entre tbodies | `moveStudent` | Solo sort `grouped` |
| DnD desde "Sin asignar" | `addStudentToPod` | Solo sort `grouped` |
| Botón `+ Crear nuevo grupo` al pie | `addEmptyPod` | Solo sort `grouped` |
| Cabecera del bloque | `changeEmoji` | Solo sort `grouped` |
| Icono `UserMinus` en fila (hover) | `removeStudentFromPod` | Solo sort `grouped` (alumnos en pod) |
| Badge clickeable | `move/add/remove/createAndAssign` | Solo sort `alphabetical` |

Cualquier acción manual que modifique pods resetea `regroupConfirmNeeded` a `false` (el flag persiste pero ya no se lee).

`addEmptyPod` y `createPodAndAssignStudent` actualizan `lastInputs.robotCount = pods.length` para que el siguiente Reagrupar no descarte el grupo extra. (Si no se quisiera preservar lo manual y forzar siempre el ratio puro, basta con que `PodRegroupButton.doRegroup` ignore esa actualización — actualmente sí la ignora porque recalcula con `robotCountFor`.)

### 13.8 Botón `Guardar` (PodSaveSnapshotButton)

- Visible cuando `viewWithPods && hasPods`.
- Si `currentEntryId` apunta a una entrada existente: `replaceEntry(id, { pods, timestamp, seed, presentStudents, robotCount })`. La entrada activa se actualiza in-place y sube al top porque su timestamp se renueva.
- Si no hay `currentEntryId` válido: `addEntry(...)` + `setCurrentEntryId(nuevoId)`.
- Feedback "Guardado" durante 1.5s tras pulsar.

`currentEntryId` también se mantiene al cargar entrada del historial (`loadFromHistory(snapshot)` recibe `entryId` opcional). Eso permite que después de cargar, los `Guardar` posteriores actualicen la misma entrada.

### 13.9 Visual del historial

- Drawer lateral derecho (portal a `body`).
- Favoritas arriba, resto por timestamp desc.
- Cada entrada con: timestamp formateado en `es-ES`, contador `N grupos · M alumnos`, fila de emojis, **semáforo de valoración (verde/ámbar/rojo)**, label inline editable, ⭐ favorito, "Cargar", "Ver detalle" (expand-collapse), papelera.
- **Anillo azul** en la entrada activa (`currentEntryId === entry.id`).
- **Semáforo (`HistoryRating`)**: tres radios (`good`, `mediocre`, `bad`) opcionales. Las entradas nuevas arrancan **sin valoración**; el profe elige clicando una luz. Click en la ya seleccionada deselecciona. `setRating(id, rating | undefined)` en `history-store`. Persiste con la entrada en `localStorage`.
- Footer: "Borrar todo el historial" con `ConfirmDialog danger`.
- Cap 100 entries con FIFO; favoritas protegidas (no se descartan aunque excedan el cap).

### 13.10 Modo Proyección

Sin cambios respecto a §12 salvo dos fixes tras prueba con >6 grupos:
- Contenedor con `overflow-y-auto` + `min-h-screen` + `auto-rows-fr` (antes se cortaba a media pantalla).
- Tipografías adaptativas según N grupos:
  - ≤4 grupos: emoji `text-8xl`, título `text-3xl`, nombres `text-xl`.
  - 5–9: emoji `text-6xl`, título `text-xl`, nombres `text-lg`.
  - 10+: emoji `text-5xl`, título `text-base`, nombres `text-sm`.

### 13.11 Persistencia con migración

Ambos stores tienen `version: 1` + `migrate(persistedState, version)` en zustand `persist`. Si version < 1 (carga previa al bump), el state se descarta y arranca limpio. Esto sustituye al "vacía localStorage manualmente" tras cada cambio invasivo.

`partialize` del `pods-store` excluye explícitamente `viewWithPods` y `sortMode` para que cada carga vuelva a alfabética. El resto del state (pods, lastInputs, currentSeed, currentClassId, currentEntryId, regroupConfirmNeeded) sí se persiste.

`StoresHydrator` (en `Providers`) dispara `rehydrate()` en `useEffect` para evitar hydration mismatch con SSR.

### 13.12 Estructura de archivos real (post-iteración)

```
components/pods/
  PodToggleViewButton.tsx         ← NUEVO. Boton "Grupos" en TopBar
  PodRegroupButton.tsx            ← reescrito con dropdown de modos
  PodRegroupMenu.tsx              ← NUEVO. Portal con 4 modos en 2 secciones
  PodSaveSnapshotButton.tsx       ← NUEVO. Replace o add
  PodProjectionButton.tsx         ← NUEVO
  PodProjectionModal.tsx          ← NUEVO. Overlay grande adaptativo
  PodHistoryButton.tsx            ← NUEVO
  PodHistoryPanel.tsx             ← NUEVO. Drawer derecho
  PodHistoryEntry.tsx             ← NUEVO. Item con favorito/cargar/papelera
  PodBadge.tsx
  PodBadgeWithDropdown.tsx        ← restaurado tras borrado en fase 4
  PodChangeDropdown.tsx           ← restaurado
  PodHeaderTrigger.tsx
  PodEmojiPicker.tsx
  PodControls.tsx                 ← oculto si !viewWithPods
  PodViewToggle.tsx
  PodSortControl.tsx
  PodDroppableTbody.tsx
  (BORRADOS: PodGroupingButton, PodGroupingModal)

components/ui/
  ConfirmDialog.tsx               ← NUEVO. Genérico para Reagrupar/Borrar/etc

components/layout/
  StoresHydrator.tsx              ← NUEVO. Dispara rehydrate() en mount
  AppShell.tsx                    ← simplificado, ya no monta AutoInitialGrouping
  TopBar.tsx                      ← orden: Toggle, Reagrupar, Guardar, Proyeccion, Historial, Descargar
  Sidebar.tsx, ClassSelector.tsx

lib/pods/
  create-pods.ts                  ← + createPodsByLevel + createPodsByProgress
  seeded-random.ts                ← NUEVO. mulberry32 + hash + generateSeed
  student-score.ts                ← NUEVO. getStudentScore, getStudentOverallScore, getStudentProgress, isUnitOneComplete
  co-occurrence.ts                ← NUEVO. getCoOccurrenceMatrix puro
  move-student.ts, edit-pod.ts, pod-colors.ts, pod-emojis.ts
  (BORRADOS: grouping-schema.ts)

store/
  pods-store.ts                   ← persist v1 + migrate + skipHydration; partialize SIN viewWithPods/sortMode
  history-store.ts                ← NUEVO. persist v1, cap 100 FIFO con favoritas

types/
  history.ts                      ← NUEVO. HistoryEntry
  database.ts

__tests__/pods/
  create-pods.test.ts             ← actualizados para max=3 default + ratio 1:3
  create-pods-by-level.test.ts    ← + tests para createPodsByProgress
  co-occurrence.test.ts           ← NUEVO
  move-student.test.ts, edit-pod.test.ts
```

Total: 67/67 tests verde.

### 13.13 Diferencias respecto a la spec v3 (intencionales)

| §v3 | Comportamiento spec | Implementación actual | Razón |
|---|---|---|---|
| §5.1 | Estado inicial sin grupos creados, lista alfabética | ✅ idéntico al mock C360 | — |
| §5.2 | Modal Agrupar con presentCount/robotCount | ❌ borrado | El profesor pidió botón directo "Grupos" sin modal |
| §5.7 | Badges en alfabética solo informativos, no clickeables | ❌ revertido. Badges son botones que abren dropdown editable | Petición explícita del profesor |
| §5.8 | Reagrupar con primer click instantáneo, segundo confirma | ❌ Cada click confirma siempre | Petición explícita del profesor |
| §6.2 | Solo Agrupar/Reagrupar crean entrada en historial | ✅ + `Guardar` añade snapshot manual (no auto) | Resuelve el caso "ajusté tras Reagrupar y se perdió" |
| §6.6 | Matriz coocurrencia computable, no en UI | ✅ idéntico | — |
| §7 | Modo Proyección read-only con grid responsivo | ✅ + scroll vertical y tipografías adaptativas | Fix tras observar corte con >6 grupos |
| §8 | `createPods` con seed reproducible | ✅ + 2 variantes nuevas (byLevel, byProgress) | Presets de agrupación pedidos |

### 13.14 Cómo arrancar

```bash
cd robotix_group_prototype
npm install
npm test          # 67/67 verde
npm run dev       # http://localhost:3000
```

No hace falta vaciar localStorage manualmente: los stores tienen `version: 1` con `migrate()` que descarta cualquier state pre-v1.

### 13.15 Gaps conocidos pendientes

- **Sin cap visual del Reagrupar al ratio**: si el profesor crea grupos extra con `+`, los ve hasta el siguiente Reagrupar (que recalcula al ratio puro y descarta el extra). Si quisiera preservar lo manual, habría que respetar `lastInputs.robotCount` actualizado en lugar de recalcular.
- **`loadFromHistory` con cap silencioso**: si la entry tenía menos alumnos asignados que `presentCount` (cap), `lastInputs.students` se reconstruye solo desde el snapshot y los Reagrupar futuros parten de subset. Edge raro, no fixeado.
- **Equilibrar dentro del bloque de progreso**: `createPodsByProgress` actualmente reparte chunks contiguos (homogéneo dentro del bloque). El usuario sugirió "compensados/mixtos" dentro del bloque — pendiente de iteración. Cambiar `mode: "leveled"` por `"mixed"` en el delegate sería el cambio mínimo.
- **Botón Reiniciar / volver a alfabética**: la única forma de "ocultar grupos" es desactivar el toggle "Vista con Grupos" en el strip. No hay botón explícito en el TopBar.

### 13.16 Historial de commits relevantes (esta iteración)

```
53b61d3  feat     preset "Por avance en el curso" + menu en 2 secciones
407ee9f  fix      vista alfabetica al cargar SIEMPRE + Grupos genera nueva
5da2ad3  feat     texto grupos-de-3 + Reagrupar respeta ratio 1:3 + boton quitar
505a2f0  fix      migracion v1 invalida localStorage previo
f83598e  feat     ratio 1:3 + boton Grupos abre vista grouped directa
8eba518  fix      pantalla inicial identica al mock C360 (sin strip)
83f9568  fix      vista alfabetica al entrar + bucle infinito Reagrupar
01cdb19  fix      cuatro fallos detectados en localhost
743fa90  feat     auto-agrupado inicial + presets mixto/por nivel + dropdown editable
ccd24df  fix      boton Historial requiere ademas hasPods
3d87e6f  fix      Reagrupar siempre confirma + Guardar reemplaza entrada
909aa44  fix      tres bugs reportados tras prueba manual
b55d582  fix      "Crear nuevo grupo" disabled al llegar a 15
8af3c04  feat     modo proyeccion read-only
c2e7df3  feat     panel Historial + favoritos + revert + coocurrencia
a39a2af  feat     boton Reagrupar con confirmacion en clic consecutivo
3b3c05c  refactor badges en alfabetica solo informativos (revertido despues)
d949d2f  feat     persistencia en localStorage (pods + historial)
893b70d  feat     seed determinista en createPods + test reproducibilidad
```

(El auto-init introducido en `743fa90` quedó eliminado en `407ee9f`. El bump de versión `505a2f0` invalida cualquier state de las versiones intermedias.)

---

## 14. Estado actual (mayo 2026, post-iteración v4)

> Apéndice operativo. Refleja la implementación de las mejoras pedidas en la spec v4 (eliminar checkbox "Vista con Grupos", auto-carga al iniciar, evaluación per-grupo y bloqueos con flujo "selecciona qué mantener antes de reagrupar"). Reemplaza la visión de §13 donde haya divergencia.

### 14.1 Cambios de modelo respecto a v3+

| Concepto | v3+ | v4 (actual) |
|---|---|---|
| `viewWithPods` | Estado en store + checkbox UI | **Eliminado.** Los badges aparecen automáticamente cuando `pods.length > 0` |
| Botón "Grupos" | Toggle de vista | **Renombrado a "Agrupar"**, visible solo cuando `pods.length === 0`. Genera primera tanda |
| Botón "Última agrupación" | Existía | **Eliminado.** Redundante con auto-carga |
| Pantalla inicial con historial | Alfabética sin badges | Auto-carga última entrada y muestra alfabética con badges |
| Rating del historial | 3 caritas/colores POR ENTRADA | **Reemplazado** por `evaluations: PodEvaluation[]` POR GRUPO + modal Evaluar sesión |
| `Pod.isLocked` | n/a | Añadido al tipo. Se usa solo durante el modo selección de Reagrupar |
| `lockedStudentIds` | n/a | Añadido al store y a `HistoryEntry` |
| Reagrupar aleatorio | `createPods` directo + confirm | **Modo selección de bloqueos** (banner + candados) → `regroupWithLocks` |
| Reagrupar por nivel | Confirm + `createPodsByLevel/Progress` | Igual (no respeta bloqueos por diseño) |
| Persistencia | `pods.isLocked` y `lockedStudentIds` persistidos | **No se persisten.** `partialize` strippea `isLocked` y omite `lockedStudentIds`. Migración v4 |

### 14.2 Auto-carga al iniciar

`StoresHydrator` (en `Providers`):
1. `await usePodsStore.persist.rehydrate()`.
2. `await useHistoryStore.persist.rehydrate()`.
3. Si `pods.length === 0 && entries.length > 0` → `loadFromHistory(entries[0])`.

`loadFromHistory` y `createPodsFromInput` siempre dejan `sortMode: "alphabetical"` (los badges se ven, no se fuerza Por grupos).

### 14.3 Evaluación per-grupo

**Tipos** (`types/history.ts`):
```ts
export type PodEvaluationRating = "green" | "amber" | "red";
export type PodEvaluation = { podId: string; rating: PodEvaluationRating };
export type HistoryEntry = {
  // ... resto
  evaluations: PodEvaluation[];   // [] si no evaluada
  evaluatedAt: string | null;
  lockedStudentIds: string[];     // snapshot de los locks usados al crear/guardar
};
```

**Acción store** (`history-store`):
- `saveEvaluation(id, evaluations)`: actualiza `evaluations` + `evaluatedAt = new Date().toISOString()` (o `null` si lista vacía).
- Migración v2→v3 rellena `evaluations: []`, `evaluatedAt: null` y descarta el campo `rating` antiguo. Migración v3→v3 (no bump) ya añade `lockedStudentIds: []` retroactivamente.
- Versión actual del history-store: `3`.

**UI**:
- `PodEvaluateButton.tsx` (TopBar): visible cuando `hasPods && currentEntry` está en historial. Punto verde a la derecha del icono si la entrada activa ya está evaluada.
- `PodEvaluateModal.tsx`: una fila por grupo con `Grupo {emoji}` + 3 botones grandes 😟 / 😐 / 😀 (`red`/`amber`/`green` izq → der). Pre-rellena con `entry.evaluations`. Click en el ya seleccionado deselecciona. `Saltar` cierra sin guardar; `Guardar` solo activo si hay al menos una evaluación.
- `PodHistoryEntry`: cada emoji va seguido de un mini círculo (`size-2`) coloreado verde/ámbar/rojo si hay rating, gris si sin evaluar. En el detalle expandido el `Grupo {emoji}` también muestra un círculo `size-2.5`.

### 14.4 Bloqueos: modelo y persistencia

```ts
// lib/pods/create-pods.ts
type Pod = {
  id: string; emoji: string; emojiLabel: string; color: PodColor;
  students: Student[]; maxCapacity: number;
  isLocked: boolean;          // default false al crear
};
```

```ts
// store/pods-store.ts
type State = {
  pods: Pod[];
  lockedStudentIds: string[];
  sortMode: SortMode;
  sortModeBeforeSelection: SortMode | null;  // recordar para volver al salir
  regroupSelecting: boolean;                 // NO se persiste
  // ... resto
};
```

- `partialize` strippea `pod.isLocked` antes de guardar (todos los pods se persisten con `isLocked: false`).
- `lockedStudentIds`, `regroupSelecting` y `sortModeBeforeSelection` **no se persisten**.
- Versión actual del pods-store: `4`. La migración descarta cualquier state previo.

### 14.5 Función pura `regroupWithLocks`

`lib/pods/regroup-with-locks.ts`. Sin dependencias de UI ni store.

```ts
export type RegroupWithLocksInput = {
  currentPods: Pod[];
  lockedStudentIds: string[];
  allPresentStudents: Student[];
  seed?: string;
  random?: () => number;
};
export type RegroupWithLocksOutput = { pods: Pod[]; seed: string };

export class RegroupLocksError extends Error {
  freeCount: number;
  slotCount: number;
}

export function regroupWithLocks(input): RegroupWithLocksOutput;
```

**Algoritmo**:
1. Pods con `isLocked: true` → preservados verbatim (estudiantes, emoji, color, id).
2. Pods sin lock → conserva solo alumnos presentes ∩ `lockedStudentIds`.
3. Free students = (alumnos sueltos no bloqueados de pods no bloqueados) + (presentes sin asignar).
4. `totalSlots = Σ (maxCapacity - locked) en pods no bloqueados`.
5. Si `free.length > totalSlots` → `RegroupLocksError(free.length, totalSlots)`.
6. Shuffle (seeded) + round-robin entre los pods no bloqueados.
7. Conserva todos los emojis/colores/ids existentes.

**Tests** (`__tests__/pods/regroup-with-locks.test.ts`, 8 casos):
- Sin bloqueos preserva estructura.
- Misma seed → reparto reproducible.
- 2 grupos bloqueados → 8 fijos, 16 redistribuidos.
- 5 alumnos sueltos bloqueados → cada uno en su grupo.
- 5 grupos bloqueados (20) + 4 libres = válido.
- Todo bloqueado (0 libres, 0 plazas) → válido (no error).
- Libres > plazas → `RegroupLocksError`.
- Capacidad respetada en todos los pods.

### 14.6 `move-student` con bloqueos

Nuevos `MoveError`:
- `student-locked` — el alumno está en `lockedStudentIds`.
- `source-pod-locked` — el pod de origen tiene `isLocked: true`.
- `destination-pod-locked` — el pod destino tiene `isLocked: true`.

Las tres funciones (`moveStudent`, `addStudentToPod`, `removeStudentFromPod`) aceptan ahora un `options: { lockedStudentIds?: string[] }` opcional. El store wrapea automáticamente con `state.lockedStudentIds`.

5 tests adicionales en `move-student.test.ts` cubren todos los casos de bloqueo.

### 14.7 Flujo Reagrupar con selección de bloqueos

**Disparador**: `PodRegroupButton` con dropdown de 4 modos.
- **Aleatoria** → `enterRegroupSelection()`. NO hay confirm dialog previo.
- **Mixta / Por niveles / Por avance** → `ConfirmDialog` clásico → `createPodsByLevel/Progress`. Limpia locks. NO respetan bloqueos por diseño.

**Modo selección** (`regroupSelecting === true`):
- `enterRegroupSelection()`: limpia locks + guarda `sortModeBeforeSelection` + fuerza `sortMode = "grouped"`.
- Aparece `PodRegroupSelectionBanner` (sticky azul arriba) con resumen + botones `Cancelar` y `Reagrupar respetando N`.
- `PodSectionHeaderRow`: candado del grupo visible (clickeable).
- `StudentRowDraggable`: candado por fila visible. Si el grupo está `isLocked`, cada fila muestra un candado coloreado automático **no clickeable** (con label "bloqueado por su grupo"). Si no, candado individual clickeable.
- DnD desactivado (`useDraggable({ disabled: true })`).
- `PodControls` (segmented Alfabético/Por grupos) oculto.
- `PodRegroupButton` oculto.

**Cancelar** (`exitRegroupSelection()`): limpia locks + restaura `sortMode` + sale del modo. Sin cambios en pods.

**Confirmar** (`PodRegroupSelectionBanner.onConfirm`):
1. `regroupWithLocks({ currentPods, lockedStudentIds, allPresentStudents })`.
2. Si lanza `RegroupLocksError` → modal "No se puede reagrupar" + botón Entendido.
3. Si OK → `set({ pods: result.pods, lockedStudentIds: [], regroupSelecting: false, sortMode: previousSort, ... })`. Strippea `isLocked` de los nuevos pods (ya que la pod-lock era ephemeral).
4. `addEntry({ ..., lockedStudentIds: [...lockedAtConfirm] })` para que el historial recuerde qué se bloqueó al guardar.

### 14.8 Pre-Reagrupar UX

```
Banner azul sticky arriba:
┌────────────────────────────────────────────────────────────────┐
│ ↻ Selecciona qué grupos o alumnos quieres mantener antes de   │
│   reagrupar                                                    │
│   Se mantendrán: 1 grupo (4 alumnos) + 1 alumno suelto.        │
│                                                                │
│                              [✕ Cancelar] [Reagrupar resp. 5] │
└────────────────────────────────────────────────────────────────┘
```

- Si nada bloqueado: el botón dice "Reagrupar" y el resumen "No hay nada bloqueado: todos los alumnos rotarán."
- En la cabecera de cada grupo aparece un candado del color del pod (cerrado/abierto). Lo mismo en cada fila.
- Si el profe pulsa el candado del Grupo 🤖, todas las filas de ese grupo cambian a un candado del mismo color **no clickeable** (lo bloquea su grupo). Para excepciones: el profe puede desbloquear el grupo y bloquear individualmente.

### 14.9 Indicador de bloqueos en historial

`PodHistoryEntry` muestra junto al timestamp, si la entrada tenía bloqueos:
- Chip `🔒 N` con tooltip `"Bloqueados al guardar: X grupos + Y alumnos"`.
- Cuenta `lockedPods + lockedStudentIds.length` como total.

### 14.10 Estructura de archivos (post-v4)

```
components/pods/
  PodCreateGroupsButton.tsx       ← reemplaza PodToggleViewButton
  PodLockButton.tsx               ← NUEVO (cabecera + filas, size sm/md, coloreable)
  PodRegroupButton.tsx            ← random no muestra ConfirmDialog, entra en seleccion
  PodRegroupSelectionBanner.tsx   ← NUEVO sticky banner azul
  PodEvaluateButton.tsx           ← NUEVO (modal Evaluar sesión)
  PodEvaluateModal.tsx            ← NUEVO (1 fila por grupo + 3 botones)
  PodControls.tsx                 ← solo segmented Alfabético/Por grupos, oculto si regroupSelecting
  PodHistoryEntry.tsx             ← chip 🔒 + mini-circulos de evaluation
  PodHistoryButton.tsx            ← solo condicionado a hasPods + entries
  PodSaveSnapshotButton.tsx       ← solo condicionado a hasPods
  PodProjectionButton.tsx         ← solo condicionado a hasPods
  PodBadgeWithDropdown.tsx        ← textos "Pendiente de asignar"
  PodChangeDropdown.tsx           ← textos "Pendiente de asignar"
  (BORRADOS: PodViewToggle, PodToggleViewButton, PodLastGroupingButton,
             PodAddStudentButton, PodAddStudentMenu)

components/students/
  StudentTable.tsx                ← viewWithPods derivado, sin botón + en cabecera
  StudentRowDraggable.tsx         ← candado solo en regroupSelecting, DnD off durante seleccion
  StudentRow.tsx                  ← textos "Pendiente de asignar"
  DragHandle.tsx                  ← prop disabled

components/layout/
  AppShell.tsx                    ← monta PodRegroupSelectionBanner antes del TopBar
  TopBar.tsx                      ← orden: Agrupar, Reagrupar, Guardar, Evaluar sesión, Proyección, Historial, Descargar
  StoresHydrator.tsx              ← auto-carga última entrada si pods vacío

components/ui/
  ConfirmDialog.tsx               ← cancelLabel ahora opcional (modal con solo OK)

lib/pods/
  create-pods.ts                  ← Pod.isLocked: false en cada constructor
  move-student.ts                 ← MoveError + opciones lockedStudentIds
  regroup-with-locks.ts           ← NUEVO (RegroupLocksError exportable)

store/
  pods-store.ts                   ← v4, regroupSelecting, enter/exitRegroupSelection,
                                    togglePodLock, toggleStudentLock,
                                    sin viewWithPods/setViewWithPods
  history-store.ts                ← v3, saveEvaluation, sin setRating

types/
  history.ts                      ← PodEvaluation, PodEvaluationRating,
                                    HistoryEntry { evaluations, evaluatedAt, lockedStudentIds }

__tests__/pods/
  regroup-with-locks.test.ts      ← NUEVO 8 casos
  move-student.test.ts            ← +5 tests bloqueos
  (resto sin cambios estructurales: 80/80 verde)
```

### 14.11 Diferencias respecto a la spec v4 (intencionales)

| §v4 | Spec | Implementación actual | Razón |
|---|---|---|---|
| §5.2 | Modal Agrupar con `presentCount`/`robotCount` | ❌ borrado. Botón "Agrupar" directo (sin modal); robotCount = ceil(presentCount/3) | El profesor ya pidió en v3+ borrarlo |
| §5.7 | Badges en alfabético solo informativos | ❌ revertido. `PodBadgeWithDropdown` editable | Petición explícita del profesor (turno previo) |
| §5.8 | Candados visibles siempre en sort grouped | ❌ Solo durante `regroupSelecting` | Petición explícita del profesor: "que solo salgan los candados tras pulsar Reagrupar" |
| §5.8 | Locks persistentes en sesión | ❌ Locks ephemeral por flujo Reagrupar | Consecuencia de la decisión anterior — UX simple |
| §5.9 | Reagrupar pide confirmación | Sí para modos por nivel. Para aleatoria, el "modo selección" sustituye a la confirmación | Diferenciación por modo |
| §5.10 | Botón Evaluar sesión + modal de 3 caritas/colores | ✅ implementado | — |
| §6.4 | Cargar combinación restaura bloqueos | ⚠️ `loadFromHistory` recibe `lockedStudentIds` pero como están ephemeral, se persisten en la entrada pero no se vuelven a aplicar visualmente fuera del modo selección | Consistente con 14.4 |
| §9 | `regroupWithLocks` puro + tests | ✅ implementado con 8 tests | — |

### 14.12 Cómo arrancar

```bash
cd robotix_group_prototype
npm install
npm test          # 80/80 verde
npm run dev       # http://localhost:3000
```

No hace falta vaciar localStorage manualmente:
- pods-store v4 invalida cualquier state de versiones anteriores.
- history-store v3 mantiene entradas viejas pero migra `rating` viejo → `evaluations: []`, y rellena `lockedStudentIds: []`.

### 14.13 Tests (totales)

```
__tests__/pods/
  create-pods.test.ts            22 tests
  create-pods-by-level.test.ts   ?  tests
  co-occurrence.test.ts          ?  tests
  edit-pod.test.ts               5  tests
  move-student.test.ts           18 tests (13 antiguos + 5 nuevos de bloqueos)
  regroup-with-locks.test.ts     8  tests (NUEVO)

Total: 80/80 verde.
```

### 14.14 Gaps conocidos

- **Modos por nivel ignoran bloqueos**: `mixed`, `leveled`, `by-progress` siempre redistribuyen 100% (no usan `regroupWithLocks`). Si el profesor quiere bloquear con esos modos, necesitará una iteración futura.
- **Locks ephemeral**: cualquier lock seteado durante el modo selección desaparece tras confirmar/cancelar. La entrada del historial sí guarda el snapshot (`lockedStudentIds`), pero al cargar esa entrada los locks no se reactivan visualmente porque el modo selección no está activo.
- **Persistencia de pod.isLocked**: aunque internamente cualquier pod podría estar locked durante el modo selección, al persistir se fuerza a `false`. Si en el futuro se quisieran locks persistentes, basta con quitar el strip de `partialize`.
- **Sin tests de UI / flujos integrados**: Modal Evaluar, banner Reagrupar, modo selección — solo validación manual.

---

*SUPERPROMPT.md v4 (apéndice §14 mayo 2026, post-iteración v4) — Prototipo de Agrupación por Grupos (C360 / ROBOTIX). Estado real tras la sesión de implementación de v4.*
````

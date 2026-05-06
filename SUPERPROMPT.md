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

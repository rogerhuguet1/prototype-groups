# SKILLS_PROTOTYPE_GROUPS.md

> Instrucción permanente para Claude Code en el repositorio `robotix_group_prototype`. Este archivo se carga automáticamente vía `CLAUDE.md` y define quién eres, qué dominas, qué reglas sigues y qué nunca haces dentro de este prototipo.

---

## §1 · Rol del agente

Actúas como **super-programador senior** en este stack concreto:

- **Next.js 15** (App Router, RSC por defecto cuando aporta).
- **React 19**, **TypeScript 5** con `strict: true` y `noUncheckedIndexedAccess: true`.
- **Tailwind v4** con `@theme` directive.
- **Zustand v5** (slices con selectors granulares).
- **Tanstack Query v5** para todo data-fetching.
- **`@dnd-kit/core` + `/sortable`** para drag & drop con accesibilidad.
- **Supabase** (`@supabase/ssr`) sólo lectura mock.
- **Zod v4** para validación en límites.
- **Vitest 4** + Testing Library para lógica pura.

No te muevas a generalismos cuando la pregunta es específica. Cuando hay una decisión arquitectural tomada en SUPERPROMPT.md, no la cuestiones salvo riesgo objetivo.

---

## §2 · Contexto del producto

Prototipo aislado de la feature **Agrupar por PODs** ("Grupos" en UI) del programa **C360 SuperNova Yellow** de **ROBOTIX**. Pantalla destino: réplica visual de **"Mi alumnado: Progreso por unidad didáctica"**.

- Sirve en `localhost:3000/mi-alumnado` con `npm run dev`.
- PODs viven sólo en Zustand. **Cero persistencia.** Al refrescar se pierden.
- Mock data desde Supabase de test (tablas `students`, `classes`).
- Si se valida UX, **después** se integra en el C360 real. Esa integración **no** es parte de este repo.

Si una orden empuja a tocar Moodle, LTI, Workplace, plugin PHP, gradebook o cualquier integración externa: parar, recordar §5 y preguntar.

---

## §3 · Mapa de archivos (referencia rápida)

| Ruta | Qué vive ahí |
|---|---|
| `app/mi-alumnado/page.tsx` | Entrada de la pantalla. Renderiza `AppShell`. |
| `app/layout.tsx`, `app/providers.tsx` | Root + `QueryClientProvider`. |
| `app/globals.css` | Tokens `c360-*` y `grade-*` dentro de `@theme`. |
| `components/layout/` | Chrome: `AppShell`, `Sidebar`, `TopBar`, `ClassSelector`, `StoresHydrator`. |
| `components/pods/` | UI de grupos: badges, dropdowns, controls, regroup, history, projection. Prefijo `Pod*`. |
| `components/students/` | `StudentTable`, `StudentRow`, `StudentRowDraggable`, `DragHandle`, `ScoreLegend`. |
| `components/ui/` | Primitivas reusables: `Button`, `Input`, `Modal`, `Checkbox`, `SegmentedControl`, `ConfirmDialog`. |
| `hooks/use*.ts` | Tanstack Query hooks (`useStudents`, `useClasses`). |
| `lib/pods/` | Lógica pura (createPods, move-student, edit-pod, pod-colors, pod-emojis, regroup-with-locks, co-occurrence, student-score, seeded-random). |
| `lib/supabase/client.ts` | `getSupabaseBrowserClient()` cached singleton. |
| `lib/utils/` | `cn`, `sort-students`, `progress-cells` (con `BAND_STYLES`), `popover-position`. |
| `lib/data/units.ts` | 6 unidades × actividades hardcoded. |
| `store/pods-store.ts` | Estado Zustand: `pods`, `viewWithPods`, `sortMode`, locks, regroup, etc. |
| `store/history-store.ts` | Snapshots de sesiones. |
| `types/database.ts` | `Database`, `StudentRow`, `ClassRow`. |
| `__tests__/pods/` | Tests Vitest de lógica pura. |
| `SUPERPROMPT.md` | Spec completa + §12 estado actual. |
| `.claude/skills/c360-design-system/SKILL.md` | Design system C360 detallado (si existe). |

---

## §4 · Stack y convenciones de uso

| Capa | Tecnología | Convención obligatoria |
|---|---|---|
| Framework | Next 15.5 App Router | `"use client"` en cabecera de todo componente y hook con estado/efectos. |
| Lenguaje | TypeScript 5.7 strict | Cero `any`. Cero `as` salvo tras `z.parse`. `noUncheckedIndexedAccess` activo. |
| UI | Tailwind 4 + `@theme` | Tokens `c360-*` y `grade-*`. Composición vía `cn` desde `@/lib/utils/cn`. Nunca template literals. |
| Estado UI | Zustand 5 | **Selectors granulares siempre.** Ver §9. |
| Server state | Tanstack Query 5 | Todo data-fetching pasa por `hooks/use*.ts`. `useEffect` para fetching está prohibido. |
| Validación | Zod 4 | Schemas en `lib/pods/grouping-schema.ts`. Inferir tipos, no duplicar. |
| DnD | `@dnd-kit/core` 6.3 | Sensors `PointerSensor`(distance: 4) + `KeyboardSensor`. Anuncios ARIA en castellano. |
| Datos | Supabase mock | Sólo lectura. Cliente vía `getSupabaseBrowserClient()`. |
| Tests | Vitest 4 | Sólo lógica pura. Alias `@/` configurado. |
| Iconos | `lucide-react` | Exclusivamente. Nunca mezclar con otra librería. |
| Path alias | `@/` | Configurado en `tsconfig.json` y `vitest.config.ts`. Usar siempre, nunca rutas relativas largas. |

No añadas dependencias sin justificación. No introduzcas `redux`, `react-dnd`, `framer-motion`, MUI, Chakra, `moment`, ni `i18next`.

---

## §5 · Reglas duras del SUPERPROMPT §8 (contrato del prototipo)

Estas son las reglas firmadas con el humano. Romperlas exige autorización explícita.

1. **Cero feature creep.** Si el SUPERPROMPT no lo pide y el humano no lo pidió en este turno, no se hace.
2. **Cero integración Moodle.** No tocar LTI, gradebook, plugin PHP, Workplace, audiences, programs.
3. **Ningún archivo del C360 real se toca.** Este prototipo vive en su propio repo.
4. **Cero persistencia.** PODs en Zustand y nada más. **No** insert/update/delete a Supabase. **No** tabla `pods`.
5. **Tipos estrictos.** Cero `any`. Cero `as` salvo tras parse de Zod.
6. **Sin `// @ts-ignore` ni `// @ts-expect-error`** salvo autorización explícita.
7. **Strings en castellano hardcoded.** Sin i18n. Sin `next-intl`. Sin `t()`.
8. **Cero comentarios decorativos.** Comentarios sólo donde el *por qué* no es obvio (ej. validación de drop).
9. **Tests sólo para `lib/pods/*`** en este prototipo. No tests E2E ni de componentes todavía.
10. **Después de cada fase**: explicar, probar, commit, push, actualizar §12 del SUPERPROMPT, esperar OK antes de avanzar (ver §11).

---

## §6 · Estilo C360 (sidebar, spacing, paleta, tabla)

Inspirado en el C360 SuperNova Yellow real. Tokens definidos en `app/globals.css` dentro de `@theme`.

### Paleta de marca

| Token | Hex | Uso |
|---|---|---|
| `c360-blue` | `#1B6FB8` | Header, acción primaria, headers de tabla |
| `c360-blue-dark` | `#155A95` | Hover/pressed |
| `c360-blue-light` | `#2E86C1` | Hover de filas, links |
| `c360-bg` | `#FFFFFF` | Fondo principal |
| `c360-bg-muted` | `#F7F8FA` | Sidebar |
| `c360-divider` | `#E5E7EB` | Separadores de tabla (finos) |
| `c360-border` | `#D1D5DB` | Separadores entre unidades (visibles) |
| `c360-text` | `#1F2937` | Texto principal |
| `c360-text-muted` | `#6B7280` | Texto secundario |
| `c360-text-link` | `#1B6FB8` | Nombres de alumno clicables |

### Paleta de semáforo (sistema semántico, no se mezcla con marca)

| Token | Hex | Banda |
|---|---|---|
| `grade-fail` | `#D32F2F` | Insuficiente 0-4.9 |
| `grade-pass` | `#F57C00` | Suficiente 5-5.9 |
| `grade-good` | `#C8E6C9` | Bien 6-6.9 (texto oscuro) |
| `grade-great` | `#66BB6A` | Notable 7-8.9 |
| `grade-excellent` | `#2E7D32` | Excelente 9-10 |
| `grade-completed` | `#E5E7EB` | Completado sin calificación |
| `grade-empty` | `#F3F4F6` | Sin datos |

### Layout

- **Header azul superior**: 56px de alto (`h-14`), `bg-c360-blue`, logo izquierda + avatar derecha, full-width.
- **Sidebar**: 240px (`w-60`), `bg-c360-bg-muted`, `border-r border-c360-divider`. Item activo: texto `c360-blue` bold + bullet azul.
- **Main**: padding 32px (`px-8`), `overflow-x-auto` para la tabla.
- **Espaciado**: múltiplos de 4px. Gap entre items de leyenda: 24px. Padding del main: 32px.

### Botones

- **Primario**: píldora `rounded-full`, `bg-c360-blue`, texto blanco MAYÚSCULAS bold, `tracking-wider`, padding `px-6 py-2.5`.
- **Secundario**: misma forma, fondo blanco con borde `border-[1.5px] border-c360-blue`, texto azul. Hover invierte.
- **Sombras**: discretas. Nada de glassmorfismo ni gradientes.

### Tabla principal

- **Header nivel 1 (unidad)**: `bg-c360-blue`, texto blanco bold (`text-[13px] font-bold`), separadores `border-r-2 border-white` entre unidades.
- **Header nivel 2 (actividad)**: fondo blanco, texto rotado **perpendicular** con `writing-mode: vertical-rl` + `transform: rotate(180deg)`. Altura mínima 160px, ancho mínimo 36px sin máximo (crece con texto largo).
- **Separador entre actividades**: `border-l border-c360-divider` (fino) en TODA columna; `border-l-c360-border` (un poco más visible) en el inicio de cada unidad.
- **Primera columna "Alumno"**: `position: sticky; left: 0; z-index: 20`, fondo azul en header, fondo blanco en filas.
- **Filas**: altura ~48px, hover `bg-c360-bg-muted/60`.
- **Cuadritos de actividad**: 20-28px con `rounded` y color de la banda.

### Reglas duras de estilo

1. Sin `bg-[#xxxxxx]` con hex inventado. Usar siempre token `bg-c360-*` o `bg-grade-*`.
2. Sin gradientes, sin glassmorfismo, sin neumorfismo.
3. Mayúsculas sólo en botones primarios y nombres de alumno.
4. Iconos exclusivamente `lucide-react`, tamaño 20px por defecto, color `text-c360-text-muted`.
5. Color nunca es el único portador de información: badges incluyen texto + emoji, no solo color.

---

## §7 · Lógica de agrupación (PODs)

Toda lógica de grupos vive en `lib/pods/` como funciones puras. Tests obligatorios en `__tests__/pods/`.

### Reglas de un módulo en `lib/pods/`

1. **Cero imports de**: `react`, `next/*`, `zustand`, `@supabase/*`, `@dnd-kit/*`, `@tanstack/*`, `@/store/*`, `@/components/*`, `@/hooks/*`.
2. **Result pattern** para fallos esperables:
   ```ts
   type FooResult =
     | { ok: true; pods: Pod[] }
     | { ok: false; reason: FooError };
   ```
   Throw sólo para errores de programador (precondiciones que el caller debería garantizar).
3. **Inmutabilidad**: nunca `arr.push`, nunca `obj.prop =`. Siempre `[...arr, x]`, `pods.map(p => p.id === id ? {...p, ...} : p)`.
4. **Mensajes de error en castellano** en un `Record<ErrorCode, string>` exportado (ver `MOVE_ERROR_MESSAGES` en `move-student.ts` como referencia).
5. **Reusar tipos** desde `@/lib/pods/create-pods` (`Pod`, `Student`, `PodColor`). No redefinir.

### Decisiones aprendidas (no reinventar)

- `createPods` baraja con Fisher-Yates usando `random()` inyectable → tests deterministas.
- `effectivePresent = min(presentCount, robotCount * maxPerPod)` → los alumnos sobrantes quedan en "sin asignar".
- Colores: **furthest-point sampling** sobre la paleta de 15 → separación visual garantizada incluso con N pequeño.
- Emojis: `shuffle + slice(N)` sobre `POD_EMOJIS` (15).
- `Pod.id` formato `pod-N` numérico secuencial. No se reciclan ids.
- Orden de alumnos al renderizar: alfabético por apellido (`sortByLastName`). Array interno mantiene orden de inserción.

### Tests obligatorios

Cada función pública necesita: happy path + un test por cada rama `reason` del `Result`. Factory `makeStudents(n)` ya existe en los tests actuales — reusarla.

---

## §8 · Supabase (read-only mock)

### Reglas duras

1. **Cero escrituras.** Si una orden pide `insert/update/delete`, parar, recordar §5.4 y preguntar.
2. **Cliente**: siempre `getSupabaseBrowserClient()` desde `@/lib/supabase/client`. Nunca `createBrowserClient` directo.
3. **Tipos**: `StudentRow`, `ClassRow` desde `@/types/database`. Si añades tabla, añade el tipo aquí primero.
4. **Variables de entorno**: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (formato nuevo `sb_publishable_*`, no `ANON_KEY`).

### Patrón de hook (canónico)

```ts
// hooks/useThing.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ThingRow } from "@/types/database";

export function useThing(param: string | null | undefined) {
  return useQuery({
    queryKey: ["thing", param],
    enabled: Boolean(param),
    queryFn: async (): Promise<ThingRow[]> => {
      if (!param) return [];
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("thing")
        .select("*")
        .eq("col", param);
      if (error) throw error;
      return data ?? [];
    },
  });
}
```

Referencias canónicas: `hooks/useStudents.ts`, `hooks/useClasses.ts`.

### Lo que NO se hace

- `useEffect` + `fetch` o `await supabase` en componente.
- Cliente Supabase global compartido entre módulos sin pasar por `getSupabaseBrowserClient()`.
- `SELECT *` cuando no hace falta — pero en este prototipo es aceptable porque los rows son pequeños.

---

## §9 · React + Next.js convenciones

### Componentes

- **`"use client"`** en la primera línea de todo componente y hook que use estado, efectos, eventos o stores del navegador.
- **Named export** siempre: `export function Foo()`. Nunca `export default`.
- **Props inline**: `type Props = { ... }` justo encima del componente.
- **Composición de clases**: `cn(...)` desde `@/lib/utils/cn`. Soporta condicionales y merge de Tailwind.
- **Tamaño**: si un componente pasa de 200 líneas, dividir. Si tiene más de 5 props, repensar.
- **Estados obligatorios**: cada vista que carga datos tiene `loading` / `empty` / `error` / `success`.

### Zustand — la regla más importante

**Selectors granulares siempre.** Una llamada por slice.

```tsx
// ✅ Correcto
const pods = usePodsStore((s) => s.pods);
const sortMode = usePodsStore((s) => s.sortMode);
const setSortMode = usePodsStore((s) => s.setSortMode);

// ❌ Prohibido — re-render en cada cambio del store
const { pods, sortMode, setSortMode } = usePodsStore();
```

Referencia canónica: `components/pods/PodControls.tsx`.

Si necesitas leer múltiples slices que deben quedar coherentes en el mismo render, usa `useShallow` de `zustand/react/shallow`. Ya hay precedente en `StudentTable.tsx`.

### Decisión-tree de ubicación de un componente

| Es… | Va en |
|---|---|
| Primitiva agnóstica de feature (Button, Input, Modal) | `components/ui/` |
| Sobre grupos/PODs | `components/pods/Pod<Name>.tsx` |
| Sobre la fila o tabla de alumnos | `components/students/` |
| Chrome de la app (sidebar, topbar) | `components/layout/` |

### Portal/popover

Cuando es dropdown/popover/menú flotante:

- Render vía `createPortal(node, document.body)`.
- Posicionar con `position: fixed` + `computePopoverPosition` de `@/lib/utils/popover-position` (maneja flip-above y clamp al viewport).
- Posicionar en `useLayoutEffect` para evitar flash.
- Cerrar en Escape y click-fuera.

Referencias: `PodChangeDropdown.tsx`, `PodEmojiPicker.tsx`, `PodAddStudentMenu.tsx`.

---

## §10 · Drag & drop (`@dnd-kit`)

### Estructura

- Toda la tabla envuelta en un `<DndContext>` único en `StudentTable.tsx`.
- Cada `<tbody>` de POD es un `Droppable` vía `PodDroppableTbody`.
- Cada fila draggable usa `useDraggable`; el activator es exclusivamente el handle `⋮⋮` (`DragHandle` con icono `GripVertical`).
- `collisionDetection: pointerWithin`.
- Sensors: `PointerSensor` con `activationConstraint: { distance: 4 }` + `KeyboardSensor`.

### Validación

Toda validación de drop pasa por `addStudentToPod` (lib pura). El componente sólo aplica el resultado:
- `result.ok === true` → store actualizado, animación de entrada.
- `result.ok === false` con `reason === "destination-pod-full"` → banner `role="alert"` 2.5s con `MOVE_ERROR_MESSAGES[reason]`.

### Regla crítica (lección aprendida)

**El profesor debe poder arrastrar siempre.** No atar `disabled` a `regroupSelecting`, ni a `viewWithPods`, ni a ningún modo de UI. Si un modo necesita esconder otra acción (ej. el botón "quitar del grupo"), se esconde ese botón concreto, no el DnD.

### Accesibilidad

- `announcements` y `screenReaderInstructions` en castellano vía `accessibility` prop del `DndContext`. Ya existe precedente en `StudentTable.tsx:236-258` — reusar el patrón.

---

## §11 · Workflow por fases + commits

### Fases del SUPERPROMPT (referencia)

1. Setup + Supabase + tabla básica.
2. `createPods` puro + tests.
3. Botón Agrupar + Modal + Store.
4. Vista con PODs en tabla.
5. DnD con `@dnd-kit`.
6. Botón `+` por POD.

Las fases del MVP están **cerradas**. Cambios posteriores se documentan en el §12 del SUPERPROMPT (estado actual).

### Convención de commits

Formato convencional:

```
<tipo>(<scope>): <subject corto en castellano>

<cuerpo opcional con el porqué>
```

**Tipos válidos**: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`, `ci`.

**Scopes válidos**: `pods`, `students`, `layout`, `ui`, `store`, `hooks`, `supabase`, `tests`, `docs`, `chore`, `c360`.

**Reglas**:
- Un commit = un cambio lógico. No mezclar refactor + feat + fix en el mismo commit.
- Subject en castellano (consistencia con el log actual del repo).
- Nunca `--no-verify`. Nunca `--no-gpg-sign`. Nunca force push a `main`.
- Nunca `git add -A` ni `git add .` salvo que el diff esté limpio. Preferir añadir archivos por nombre.

### Después de cada fase o cambio grande — secuencia obligatoria

Antes de pasar a la siguiente tarea, ejecutar **en orden**:

1. **Explicar al humano** qué archivos se han tocado y cómo probarlo.
2. **Probar localmente**: `npm run typecheck` + `npm test` + `npm run dev` (si UI tocada).
3. **Actualizar `SUPERPROMPT.md`** — específicamente el §12 (estado actual):
   - Si añadiste/quitaste archivos: actualizar §12.5 (estructura).
   - Si cambió alguna decisión técnica: actualizar §12.4 (decisiones).
   - Si cambió el estilo visual: actualizar §12 con un sub-apartado nuevo o nota datada.
   - Si cambió el contrato (tipos públicos, store API): documentar el cambio.
4. **Commit** con mensaje convencional, incluyendo el cambio del SUPERPROMPT en el mismo commit. Ejemplo:
   ```
   feat(c360): aplicar design system (header azul, sidebar clara, píldoras)

   - app/globals.css: tokens c360-* y grade-* en @theme
   - components/layout/*: nuevo header azul 56px
   - components/ui/Button: variantes primaria/secundaria como píldoras UPPERCASE
   - SUPERPROMPT.md §12: actualizado state con nueva paleta
   ```
5. **Push** al remoto: `git push`.
6. **Esperar OK del humano** antes de avanzar a la siguiente tarea.

### Lo que cuenta como "cambio grande"

- Cualquier cambio que toque >3 archivos.
- Cualquier cambio en `store/`, `lib/pods/*`, o tipos públicos.
- Cualquier cambio visual notable (paleta, layout, componente nuevo).
- Cualquier cambio que rompa la coherencia con el SUPERPROMPT §12.

Bugfixes triviales en un único archivo no requieren actualización del §12 pero sí commit + push.

---

## §12 · QA / regresión — checklist antes de declarar tarea hecha

Ejecutar en orden. No saltar pasos. Si algo falla, parar y arreglar antes de seguir.

1. **`npm run typecheck`** → verde.
2. **`npm test`** → verde (todos los tests de `lib/pods/*`).
3. **Grep del diff** buscando patrones prohibidos:
   - `\bany\b` en `.ts`/`.tsx`
   - `\bas\b` casts (excepto inmediatamente después de `z.safeParse`/`z.parse`)
   - `// @ts-ignore`, `// @ts-expect-error`
   - `usePodsStore()` sin selector (re-render storm)
   - `useEffect.*supabase` o `useEffect.*fetch(` (fetching prohibido fuera de Tanstack Query)
   - `bg-\[#[0-9a-f]{6}\]` con hex no en `c360-*` ni `grade-*`
4. **Si UI tocada**: `npm run dev` y abrir `localhost:3000/mi-alumnado`. Verificar el flujo afectado de extremo a extremo.
5. **Si DnD tocado**: arrastrar A→B (drop válido), intentar drop en POD lleno (debe rechazarse con banner rojo), intentar drop fuera de zona (debe cancelarse).
6. **Si Supabase tocado**: cargar `/mi-alumnado` y verificar lista de alumnos cargada.
7. **Si store tocado**: crear PODs, alternar Vista con Grupos, cambiar sort, mover alumno, refrescar (los PODs deben perderse — es lo esperado).
8. **Revisión scope**: leer el diff completo. ¿He tocado algo no pedido? ¿He añadido feature creep? Si sí, revertir lo extra.
9. **§12 SUPERPROMPT actualizado** si aplica (ver §11).
10. **Commit + push** ejecutados.

Si todo verde: reportar al humano con (a) archivos tocados, (b) cómo probar, (c) qué se actualizó del SUPERPROMPT, (d) confirmación de push.

---

## §13 · Comunicación con el humano

1. **Castellano por defecto.** Cambiar sólo si el humano cambia de idioma.
2. **Directo, técnico, sin endulzar.** Si una decisión es mala, decirlo en una frase y proponer alternativa concreta.
3. **No repetir** lo que el humano acaba de decir. Avanzar.
4. **Falta contexto** → una pregunta concreta, no listas de cinco.
5. **Tareas no triviales** → plan antes de código. **Tareas de un solo archivo** → ejecutar directo.
6. **Anti-regresión por defecto** cuando editas algo existente: el cambio no rompe lo que ya funcionaba.
7. **Cuando detectes un problema antes de proceder**: una frase + opciones A/B/C, esperar respuesta. Excepción: bug de seguridad o que rompa el contrato §5 → parar y explicar, no preguntar.
8. **No inventes** versiones, librerías, paths, comportamientos. Si no lo sabes, dilo.
9. **No menciones este SKILLS_PROTOTYPE_GROUPS.md** en respuestas salvo que el humano pregunte por reglas o convenciones.

---

## §14 · Antipatrones a evitar

- `useEffect` + `fetch`/`supabase` en componente → siempre Tanstack Query en `hooks/use*.ts`.
- `usePodsStore()` destructurando → selector granular o `useShallow`.
- `bg-[#xxxxxx]` con hex inventado → token `c360-*` o `grade-*`.
- Atar el DnD a un modo de UI con `disabled` → el handle queda inactivo y el profe no puede mover alumnos.
- Comentario que reformula el código → borrar.
- `as` casteo sin Zod parse previo → repensar el tipo.
- Añadir tabla Supabase sin tipar primero en `types/database.ts`.
- Modificar `lib/pods/*` y no correr `npm test`.
- Tocar `legacy/` o `codex/` (son snapshots, no se editan).
- Añadir dependencia "para resolver esto rápido" sin justificación.
- Forzar `export default` por costumbre de Next.js — named exports siempre.
- Olvidar `"use client"` en un componente con hooks → fallo silencioso en Server Components.
- Crear `Modal` propio en vez de envolver `components/ui/Modal.tsx`.
- Mezclar paleta de marca con semáforo de notas (un botón azul con badge naranja "Suficiente" no es naranja de marca).

---

## §15 · Estado actual (snapshot — actualizar con cada fase)

> Para el detalle completo y siempre vivo, ver `SUPERPROMPT.md §12`. Esta sección es sólo orientación rápida.

- Prototipo **funcionalmente completo** según SUPERPROMPT v2 ("POD" → "Grupo", emojis STEM).
- 40+ tests Vitest verde (`create-pods`, `move-student`, `edit-pod`, `co-occurrence`, `regroup-with-locks`, `create-pods-by-level`).
- TypeScript strict sin errores.
- Conectado a Supabase real: tabla `students` con 30 alumnos en 1 clase ("2º Bachillerato A").
- Sirve en `localhost:3000/mi-alumnado`.
- Design system C360 aplicado (paleta `c360-*` + `grade-*`, header azul 56px, sidebar clara, botones píldora UPPERCASE, tabla con headers azules y actividades perpendiculares).
- DnD activo en todo momento, incluso durante regroup-selection.

Si la realidad diverge de este snapshot, **actualizarlo en el mismo commit** que introdujo la divergencia.

---

*SKILLS_PROTOTYPE_GROUPS.md v1.0 — Prototipo PODs (C360 / ROBOTIX). Activado vía `CLAUDE.md`.*

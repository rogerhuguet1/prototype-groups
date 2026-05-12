# Prototipo Agrupación por Grupos (C360 / ROBOTIX)

Prototipo aislado de la feature **"Agrupar por Grupos"** del programa C360
SuperNova Yellow de ROBOTIX. Réplica visual de "Mi alumnado: Progreso por
unidad didáctica" con UX de agrupación automática y reagrupación por
distintos criterios (aleatorio, compensada, por niveles, por avance).

> Esta es la iteración **v5**. La spec viva está en `SUPERPROMPT.md`. Las
> convenciones detalladas (stack, store, design system, antipatrones) en
> `SKILLS_PROTOTYPE_GROUPS.md`.

## Stack

- Next.js 15.5 (App Router, output static export)
- TypeScript strict + `noUncheckedIndexedAccess`
- Tailwind v4 con `@theme` (tokens `c360-*` y `grade-*`)
- Zustand v5 (persist con localStorage)
- Tanstack Query v5
- `@dnd-kit/core` para drag & drop
- Zod v4 para validación
- Supabase (sólo lectura) vía `@supabase/ssr`
- Vitest 4 para lógica pura

## Arrancar

```bash
npm install
cp .env.example .env.local   # rellenar credenciales de Supabase
npm run dev                  # http://localhost:3000/mi-alumnado
```

Scripts:

| Script | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Build estático en `out/`. |
| `npm run typecheck` | `tsc --noEmit` strict. |
| `npm test` | Vitest, sólo lógica pura en `lib/pods/*`. |

## Estructura

```
app/                          ← Next.js App Router
  mi-alumnado/page.tsx        ← entrada principal
  page.tsx                    ← redirige a la misma vista
  layout.tsx, providers.tsx, globals.css

components/
  layout/                     ← AppShell, Sidebar, TopBar, ClassSelector, StoresHydrator
  pods/                       ← UI de grupos (Pod*.tsx)
  students/                   ← Tabla y filas de alumnos
  ui/                         ← Primitivas reusables (Button, Input, Modal)

lib/
  pods/                       ← Lógica pura testeable
  supabase/client.ts          ← Cliente browser cached
  utils/                      ← cn, sort-students, popover-position, progress-cells
  data/units.ts               ← Unidades didácticas hardcoded

hooks/                        ← Tanstack Query (useStudents, useClasses)
store/pods-store.ts           ← Zustand con persist v7
types/database.ts             ← Tipos de Supabase
__tests__/pods/               ← Tests Vitest de lógica pura
.github/workflows/            ← CI: typecheck + tests + build, deploy a Pages desde main
```

## Convenciones

- Componentes con `"use client"` cuando usan estado/efectos.
- Selectors granulares en Zustand: `useStore((s) => s.x)`, **nunca** destructurar el store entero.
- Data-fetching siempre vía Tanstack Query (sin `useEffect + fetch`).
- Tokens de color desde `@theme` (`bg-c360-*`, `bg-grade-*`). Cero hex inventado.
- Iconos sólo de `lucide-react`.
- Tests sólo en `lib/pods/*`: cero E2E.
- Detalle exhaustivo en `SKILLS_PROTOTYPE_GROUPS.md`.

## Despliegue

CI en `.github/workflows/deploy.yml`:

- Cada push a `codex` o `main`: instala deps, typecheck, tests, build.
- Push a `main` además: deploy a GitHub Pages.

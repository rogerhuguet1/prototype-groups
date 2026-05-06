# simpler-prototype

Segunda iteración del prototipo de **VisualGroups**, conectada a Supabase
real. Construido por fases pequeñas (commits del 6 de mayo de 2026).
**Congelado como referencia** — no recibe cambios.

## Stack

- Next.js 15 (App Router, RSC)
- React 19
- TypeScript estricto (`strict`, `noUncheckedIndexedAccess`)
- Tailwind v4 (sin `tailwind.config.*`)
- `@supabase/supabase-js`
- `@dnd-kit/core`

## Qué hace

Cumple las 12 funciones de `PROTOTIPO_FUNCIONAL.md` contra Supabase real
(schema descrito en `CLAUDE_SCHEMA.md`):

1. Lista de alumnos de la clase seed.
2. Crear / renombrar / eliminar grupos (cascada manual sobre evaluations
   e individual_scores).
3. Asignar, mover y desasignar alumnos (drag & drop con `@dnd-kit` y
   teclado, sidebar como zona "sin asignar").
4. Distribuir alumnos automáticamente (round-robin respetando
   `max_group_size`).
5. Detalle del grupo seleccionado (tercera columna en xl, drawer en
   tablet/móvil).
6. Nota grupal con validación 0–10.
7. Override individual con badge "ajustada" y restaurar.
8. Estado de evaluación con transiciones permitidas (pending ↔ draft →
   published ↔ locked).
9. Guardar sesión: snapshot archivado en cascada (sesión + grupos +
   miembros + evaluaciones + scores).
10. Historial: tabla de sesiones archivadas con conteo de grupos y
    alumnos asignados.
11. Configuración de la sesión activa (nombre, tamaños min/max).
12. Toasts no bloqueantes y modales propios sustituyendo
    `prompt`/`confirm`/`alert`.

## Arrancar

```bash
cd legacy/simpler-prototype
npm install
cp ../../.env.example .env.local   # rellenar con las claves Supabase
npm run dev                         # http://localhost:3000
```

## Estructura

```
app/
  layout.tsx           ← envuelve con ToastProvider
  page.tsx             ← vista principal (3 zonas + DnD)
  configuracion/
  historial/
  dev/                 ← /dev: ping de conexión
components/
  ui/                  ← Button, Modal, ConfirmDialog, PromptDialog, Toast
  features/            ← Sidebar, GroupCard, DetailPanel, StudentChip
lib/
  constants.ts         ← CLASS_ID, SESSION_ID seed
  types.ts             ← Student, Group, GroupMember, Evaluation, ...
  supabase/
    client.ts          ← factory singleton
  data/                ← una función por tabla (students, groups,
                          group-members, sessions, evaluations,
                          individual-scores, snapshot)
```

## Limitaciones conocidas

- RLS permisiva en Supabase (anon/authenticated con acceso total). Endurecer
  antes de producción.
- `archiveSession` no es transaccional. Si falla a mitad, queda snapshot
  parcial. Migrar a Edge Function en producción.
- Sin integración Moodle. Todo el dominio vive en Supabase.
- Sin tests automatizados.

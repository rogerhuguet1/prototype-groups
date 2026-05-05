# VisualGroups — Prototipo funcional (Fase 0)

Prototipo visual e interactivo para la herramienta de creación y evaluación de grupos
**VisualGroups**, que evolucionará como plugin para **Moodle Workplace 4.5** (ROBOTIX).

> Esta fase **no** integra Moodle ni Supabase. Todo el estado vive en memoria del
> navegador con datos mock. Los nombres y la estructura ya están alineados con
> `CLAUDE.md` y `SKILLS.md` para que la migración a Next.js + Supabase + LTI sea
> incremental, no una reescritura.

## Stack

- Next.js 15 (App Router, RSC)
- React 19
- TypeScript estricto (`strict`, `noUncheckedIndexedAccess`)
- Tailwind v4 (`@theme` en CSS, sin `tailwind.config.*`)
- Zustand 5 (estado UI)
- Zod (validación de notas)
- @dnd-kit (drag & drop accesible)

## Cómo ejecutar

```bash
npm install
npm run dev
# abre http://localhost:3000
```

Otros scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # build producción
npm run start       # servir build
```

## Estructura

```
app/                 # App Router: layout, rutas grupos / historial / configuracion
components/
  layout/            # AppShell, header, tabs
  sidebar/           # Lista de alumnos sin asignar
  canvas/            # Tablero de grupos (paneles)
  detail/            # Panel de detalle del grupo seleccionado
  history/           # Historial simulado
  config/            # Configuración de la sesión
  dnd/               # Provider y alternativa accesible al DnD
  ui/                # Primitivos de UI (Button, Modal, Toast, ...)
lib/
  domain/            # types.ts, constants.ts, grading.ts
  store/             # Zustand store central
  data/              # mock-students, mock-panels, mock-history
  utils/             # distribute, initials, cx
  i18n/              # strings.ts (catalogados con la convención next-intl)
  supabase/          # client stub, NO se usa todavía
```

## Variables de entorno

Copia `.env.example` a `.env.local`. En la fase 0 las variables están vacías;
sirven sólo de plantilla para cuando se conecte Supabase. **Nunca** uses
`service_role` en el cliente.

## Documentos del proyecto

- `CLAUDE.md` — qué construir (visión y modelo de datos del producto final).
- `SKILLS.md` — cómo trabajar (rol, principios, identidad visual, antipatrones).
- `PROTOTIPO_FUNCIONAL.md` — alcance acordado de esta Fase 0.

## Funcionalidades del prototipo

- [x] Layout responsive de 3 zonas (sidebar / canvas / detalle).
- [x] Lista de alumnos sin asignar con búsqueda y contador.
- [x] Crear, renombrar y eliminar grupos; limpiar todos.
- [x] Distribuir alumnos automáticamente (round-robin).
- [x] Drag & Drop (sidebar ↔ paneles, paneles ↔ paneles) con @dnd-kit.
- [x] Alternativa accesible: menú "Asignar a…" + teclado.
- [x] Bloqueo de capacidad con feedback visual + toast de error.
- [x] Panel de detalle: nota grupal, override individual, estado de evaluación.
- [x] Validación 0–10 con Zod.
- [x] Historial simulado de sesiones.
- [x] Configuración de sesión (nombre, tamaños mín/máx).
- [x] Guardado simulado con toast.

## Fuera de alcance (Fase 0)

Integración Moodle real, conexión Supabase, LTI 1.3, Privacy API, push a gradebook,
rúbricas avanzadas, coevaluación, asistencia, modo presentación, realtime,
internacionalización completa (sólo es-ES por ahora; claves preparadas en
`lib/i18n/strings.ts`).

— *VisualGroups by ROBOTIX. Prototipo Fase 0.*

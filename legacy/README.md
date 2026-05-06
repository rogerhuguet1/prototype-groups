# legacy/

Prototipos previos de **VisualGroups**, congelados como referencia.
**No se mantienen ni se actualizan.** Sirven para no perder el trabajo
hecho mientras la nueva versión cambia de enfoque y reestructura.

## Índice

### `canvas-prototype/`
Primer prototipo (mayo 2026). Stack: Next.js 15 + React 19 + Tailwind v4
+ Zustand + @dnd-kit. **Sin Supabase ni Moodle**, datos mock en cliente.
Canvas circular con drag & drop, alternativa accesible por menú,
evaluación local con transiciones, historial y configuración mockeados.

### `simpler-prototype/`
Segundo prototipo (mayo 2026). Stack: Next.js 15 + React 19 + Tailwind v4
+ @dnd-kit + `@supabase/supabase-js`. **Conectado a Supabase real**.
Layout 3 zonas (sidebar / canvas / detail), DnD, modales y toasts
propios. Cumple las 12 funciones de `PROTOTIPO_FUNCIONAL.md`:
listar alumnos, crear/renombrar/eliminar grupo, asignar/mover/desasignar,
distribuir automáticamente, evaluación con override individual y estado,
guardar sesión (snapshot archivado), historial, configuración.

## Cómo arrancar uno

Cada subcarpeta es autocontenida (su propio `package.json`):

```bash
cd legacy/<subcarpeta>
npm install
npm run dev
```

`simpler-prototype/` necesita `.env.local` con
`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

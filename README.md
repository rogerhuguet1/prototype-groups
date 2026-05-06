# VisualGroups

Gestión visual de grupos para Moodle Workplace 4.5 — by **ROBOTIX**.

Iteración local sobre **Next.js 15 + Supabase**, construida por fases pequeñas y
verificables (ver `CLAUDE.md` y `SKILLS.md` para arquitectura y convenciones).

> El prototipo anterior (mocks en cliente, sin Supabase) está congelado en
> `legacy/` solo como referencia. La nueva implementación vive en la raíz.

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript en modo `strict` (con `noUncheckedIndexedAccess`)
- Tailwind v4 (`@theme` en CSS, sin `tailwind.config.*`)
- `@supabase/supabase-js`

## Arrancar en local

```bash
npm install
cp .env.example .env.local       # rellena con tus claves de Supabase
npm run dev
# http://localhost:3000
```

## Variables de entorno

Plantilla en `.env.example`. Copia a `.env.local` (gitignored):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`.env.local` **nunca** se sube al repo. La `service_role` jamás aquí.

## Scripts

| Comando | Hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en `:3000` |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run typecheck` | `tsc --noEmit` |

## Estado del proyecto

Construyendo por fases. Estado actual: **Fase 2 cerrada — scaffold limpio**.
Próxima fase: cliente Supabase + verificación de conexión.

## Documentación

- `CLAUDE.md` — qué construir (arquitectura, modelo, fases del producto).
- `SKILLS.md` — cómo trabajar (rol, convenciones, identidad visual).
- `PROTOTIPO_FUNCIONAL.md` — referencia funcional del prototipo.

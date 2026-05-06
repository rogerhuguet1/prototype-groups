# VisualGroups

Herramienta visual para que el profesorado cree y evalúe grupos de
alumnos — by **ROBOTIX**.

> **Estado actual: en reestructuración.** El enfoque del producto va a
> cambiar. La raíz del repo está vacía de código a propósito; las
> iteraciones anteriores y la documentación del enfoque previo se
> conservan en `legacy/`.

## Documentos en raíz

| Archivo | Para qué |
|---|---|
| `SKILLS.md` | Rol del agente, principios técnicos, identidad visual, antipatrones. **Sigue vigente.** |
| `CLAUDE_SCHEMA.md` | Schema actual de la BD Supabase activa. Útil si la nueva iteración sigue usando ese proyecto. |
| `legacy/README.md` | Índice de iteraciones y docs anteriores. |
| `legacy/CLAUDE.md` | Visión y plan del enfoque previo (Moodle Workplace + LTI). Pendiente de revisión. |
| `legacy/PROTOTIPO_FUNCIONAL.md` | Especificación funcional del prototipo previo. |

## Iteraciones anteriores

Conservadas en `legacy/`, congeladas:

- `legacy/canvas-prototype/` — primer prototipo, mocks en cliente,
  canvas circular con DnD.
- `legacy/simpler-prototype/` — segundo prototipo, conectado a Supabase
  real, cumple las 12 funciones del prototipo funcional.

Cada uno es autocontenido (`npm install` + `npm run dev` desde su
carpeta). Ver `legacy/README.md` para más detalle.

## Variables de entorno

`.env.local` (gitignored) y `.env.example` (plantilla) viven en raíz y
los reutilizan los prototipos de `legacy/` mediante ruta relativa.

## Próximos pasos

Pendiente: definir el nuevo enfoque y empezar la siguiente iteración en
la raíz desde cero. El §18 de `legacy/CLAUDE.md` recoge los aprendizajes
técnicos heredables si se quiere reciclar parte del código de
`legacy/simpler-prototype/`.

# VisualGroups

Herramienta visual para que el profesorado cree y evalúe grupos de
alumnos, embebida en **Moodle Workplace 4.5** — by **ROBOTIX**.

> **Estado actual: en reestructuración.** El enfoque del producto va a
> cambiar. La raíz del repo está vacía a propósito; el código de las
> iteraciones anteriores se conserva en `legacy/`.

## Documentos del proyecto

| Archivo | Para qué |
|---|---|
| `CLAUDE.md` | Visión, arquitectura, modelo de datos, plan por fases del producto. |
| `SKILLS.md` | Rol del agente, principios técnicos, identidad visual, antipatrones. |
| `PROTOTIPO_FUNCIONAL.md` | Especificación funcional del prototipo (12 funciones). |
| `legacy/README.md` | Índice de prototipos anteriores. |

## Iteraciones anteriores

Conservadas en `legacy/`, congeladas:

- `legacy/canvas-prototype/` — primer prototipo, mocks en cliente,
  canvas circular con DnD.
- `legacy/simpler-prototype/` — segundo prototipo, conectado a Supabase
  real, cumple las 12 funciones del prototipo funcional.

Cada uno es autocontenido (`npm install` + `npm run dev` desde su
carpeta). Ver `legacy/README.md` para más detalle.

## Próximos pasos

Pendiente: definir el nuevo enfoque y empezar la siguiente iteración en
la raíz desde cero.

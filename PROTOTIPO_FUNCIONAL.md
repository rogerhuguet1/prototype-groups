# PROTOTIPO_FUNCIONAL.md

> Documento de especificación del prototipo funcional inicial de la herramienta educativa de agrupación de alumnos pensada para evolucionar como plugin de **Moodle Workplace 4.5**.
>
> **Estado:** Fase 0 — Prototipo visual e interactivo (sin backend real, sin integración Moodle, sin Supabase).
> **Audiencia:** profesores y formadores que necesitan crear y gestionar grupos de alumnos de forma rápida y visual.

---

## 1. Objetivo del prototipo

Construir una **interfaz funcional, clara y demostrable** que permita a un profesor:

- Visualizar la lista de alumnos de una clase.
- Crear, renombrar y eliminar grupos.
- Asignar alumnos a grupos mediante **drag and drop** (con alternativa accesible).
- Ajustar notas grupales e individuales.
- Simular el guardado de una "sesión de agrupación".
- Comprender, mediante el flujo, cómo será la experiencia final dentro de **Moodle Workplace 4.5**.

El prototipo **no** persiste datos reales: todo el estado vive en memoria del navegador (estado local de React) y los datos provienen de **mocks** definidos en el repositorio.

El objetivo último es validar **flujo, ergonomía y modelo mental** antes de invertir en la versión plugin.

---

## 2. Funcionalidades incluidas

### 2.1 Pantalla principal de agrupación

- Layout en tres zonas: **alumnos sin asignar / grupos / detalle del grupo seleccionado**.
- Cabecera con nombre de la sesión, botón "Guardar" y acceso a Historial / Configuración.

### 2.2 Lista de alumnos

- Tarjeta por alumno con nombre, iniciales/avatar simple, nota o nivel.
- Buscador por nombre.
- Contador de alumnos sin asignar.
- Estado visual (asignado / sin asignar).

### 2.3 Gestión de grupos

- Crear grupo nuevo.
- Renombrar grupo.
- Eliminar grupo (los alumnos vuelven a "sin asignar").
- Limpiar todos los grupos.
- **Distribución automática simulada** (reparto equitativo de alumnos sin asignar entre los grupos existentes).

### 2.4 Drag and drop

- Arrastrar alumno desde la lista lateral a un grupo.
- Mover alumno entre grupos.
- Devolver alumno a la lista de "sin asignar".
- Bloqueo cuando un grupo alcanza su capacidad máxima.
- Feedback visual durante el arrastre (zona destino resaltada, cursor, "ghost").
- Mensaje de confirmación al soltar (toast).
- Mensaje de error si el grupo está lleno.
- **Alternativa accesible:** seleccionar alumno → seleccionar grupo destino → confirmar (vía botón / teclado).

### 2.5 Panel de detalle de grupo

- Nombre del grupo (editable).
- Lista de alumnos del grupo.
- Conteo y capacidad.
- Media de notas del grupo.
- Nota grupal editable (0 – 10).
- Estado de evaluación: `Pendiente` · `Borrador` · `Publicado` · `Bloqueado`.
- Ajuste de nota individual por alumno.
- Botón **Guardar cambios** (simulado, con toast de confirmación).

### 2.6 Evaluación básica

- Nota grupal entre 0 y 10, con validación.
- Cuatro estados de evaluación con transición controlada.
- Override individual por alumno (visible cuando difiere de la nota grupal).

### 2.7 Historial simulado

- Vista o pestaña "Historial".
- Lista de sesiones mock con: nombre, fecha, nº grupos, nº alumnos asignados, estado.
- Acción "Ver" que carga (en mock) los datos de esa sesión.

### 2.8 Configuración de la sesión

- Nombre de la sesión.
- Tamaño máximo de grupo.
- Tamaño mínimo recomendado (sólo aviso visual, no bloquea).
- Botón "Guardar sesión" (simulado).

### 2.9 Diseño y accesibilidad

- Paleta inspirada en Robotix (provisional, ver §10).
- Contraste WCAG AA en textos principales.
- Estados nunca dependen sólo del color (icono + texto).
- Navegación por teclado en lo razonable.
- Layout responsive (3 col / 2 col / apilado).

---

## 3. Funcionalidades excluidas por ahora

Quedan **fuera** de esta primera fase y se documentan sólo como evolución futura:

- Integración real con Moodle Workplace 4.5 (SSO, cursos, cohortes, gradebook).
- Persistencia real (Supabase, base de datos, API backend).
- Autenticación, roles y permisos reales.
- Rúbricas, coevaluación y autoevaluación.
- Analíticas avanzadas, dashboards, exportaciones complejas.
- Mensajería, notificaciones, comentarios.
- Adjuntos / entregas de los alumnos.
- Internacionalización completa (el prototipo va en español).
- Soporte offline / PWA.
- Accesibilidad avanzada certificada (sólo se cubre lo razonable).

---

## 4. Estructura de pantallas

```
┌─ App ────────────────────────────────────────────────────────────────┐
│ Header: logo · nombre sesión · tabs (Agrupación · Historial · Config)│
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ── Vista "Agrupación" (por defecto) ─────────────────────────────── │
│  ┌──────────────┬──────────────────────────┬──────────────────────┐ │
│  │ Sin asignar  │  Grupos                  │  Detalle del grupo   │ │
│  │ (buscador,   │  (rejilla de tarjetas    │  seleccionado        │ │
│  │  contador,   │   de grupo, botón "+"    │  (alumnos, notas,    │ │
│  │  alumnos)    │   crear grupo)           │   estado, guardar)   │ │
│  └──────────────┴──────────────────────────┴──────────────────────┘ │
│                                                                      │
│  ── Vista "Historial" ───────────────────────────────────────────── │
│  Tabla / lista de sesiones guardadas (mock)                          │
│                                                                      │
│  ── Vista "Configuración" ──────────────────────────────────────── │
│  Form: nombre sesión, tamaño máx, tamaño mín recomendado, guardar    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Responsive:**

- **Desktop (≥ 1200 px):** las tres columnas a la vez.
- **Tablet (768–1199 px):** dos columnas; el detalle se abre como panel lateral / drawer.
- **Móvil (< 768 px):** una columna; navegación por pestañas (Sin asignar / Grupos / Detalle) o secciones colapsables.

---

## 5. Componentes necesarios

Estructura de componentes propuesta (React + TypeScript):

```
src/
├── App.tsx
├── main.tsx
├── styles/                       # tokens, paleta, utilidades
├── data/
│   ├── mockStudents.ts
│   ├── mockGroups.ts
│   └── mockSessions.ts
├── types/
│   └── index.ts                  # Student, Group, Session, EvalState
├── state/
│   └── useGroupingStore.ts       # estado central (useReducer / Zustand)
├── hooks/
│   ├── useDragAndDrop.ts
│   └── useToast.ts
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── AppTabs.tsx
│   │   └── ResponsiveShell.tsx
│   ├── students/
│   │   ├── StudentList.tsx
│   │   ├── StudentCard.tsx
│   │   ├── StudentSearch.tsx
│   │   └── UnassignedCounter.tsx
│   ├── groups/
│   │   ├── GroupBoard.tsx
│   │   ├── GroupCard.tsx
│   │   ├── EmptyGroupSlot.tsx
│   │   ├── GroupCapacityBar.tsx
│   │   └── CreateGroupButton.tsx
│   ├── detail/
│   │   ├── GroupDetailPanel.tsx
│   │   ├── GradeInput.tsx
│   │   ├── EvalStateBadge.tsx
│   │   └── IndividualGradeRow.tsx
│   ├── history/
│   │   ├── HistoryView.tsx
│   │   └── SessionRow.tsx
│   ├── config/
│   │   └── SessionConfigForm.tsx
│   └── ui/                       # botones, inputs, modal, toast, badge…
└── utils/
    ├── grading.ts                # validación 0-10, media
    └── distribution.ts           # reparto automático
```

---

## 6. Flujo principal del profesor

**Caso de uso "feliz":**

1. El profesor abre la herramienta. Ve la pantalla **Agrupación** con la lista de alumnos sin asignar a la izquierda.
2. Pulsa "Crear grupo" varias veces (o usa "Distribuir automáticamente").
3. Arrastra alumnos desde la lista lateral hasta cada grupo. Si un grupo se llena, el sistema lo bloquea y avisa.
4. Selecciona un grupo: en el panel derecho ve sus alumnos y puede **renombrar el grupo**, **poner una nota grupal** y **ajustar notas individuales** si es necesario.
5. Cambia el estado de evaluación a `Borrador` mientras decide.
6. Pulsa **Guardar sesión** (simulado). Aparece toast: "Sesión guardada".
7. En la pestaña **Historial**, ve la sesión guardada como entrada nueva (o las mock preexistentes).

**Casos secundarios:**

- Mover un alumno mal asignado a otro grupo (drag entre grupos).
- Devolver un alumno a "Sin asignar" arrastrándolo fuera (o pulsando un botón en su tarjeta).
- Eliminar un grupo: aviso de confirmación, los alumnos vuelven a "Sin asignar".
- Limpiar todos los grupos: aviso de confirmación, vuelta al estado inicial.

---

## 7. Datos mock necesarios

### 7.1 `Student`

```ts
type Student = {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;        // calculado, p. ej. "M.G."
  baseGrade?: number;      // nota o nivel previo, 0-10
  level?: 'inicial' | 'medio' | 'avanzado';
  groupId: string | null;  // null = sin asignar
};
```

- Aproximadamente **24–30 alumnos mock**, con nombres realistas pero ficticios.
- Distribución variada de niveles y notas para que la UI tenga datos significativos.

### 7.2 `Group`

```ts
type Group = {
  id: string;
  name: string;            // editable, p.ej. "Equipo Robots"
  capacity: number;        // por defecto, el tamaño máx de la sesión
  studentIds: string[];
  groupGrade?: number;     // 0-10
  evalState: 'pending' | 'draft' | 'published' | 'locked';
  individualOverrides: Record<string, number>; // studentId -> nota
};
```

### 7.3 `Session`

```ts
type Session = {
  id: string;
  name: string;            // p.ej. "Proyecto Final 4ºESO - Mayo"
  date: string;            // ISO
  groupCount: number;
  assignedStudents: number;
  status: 'draft' | 'saved' | 'archived';
};
```

- 4–6 sesiones mock en el historial inicial.

### 7.4 `SessionConfig`

```ts
type SessionConfig = {
  sessionName: string;
  maxGroupSize: number;        // por defecto 5
  recommendedMinSize: number;  // por defecto 3
};
```

> ⚠️ **Sin datos personales reales.** Los nombres mock deben ser claramente ficticios y plausibles.

---

## 8. Reglas de interacción

1. Un alumno pertenece **a un único grupo o a "sin asignar"**.
2. Un grupo no puede superar su `capacity`. Si está al máximo:
   - La zona de drop se marca como bloqueada (icono + color + texto).
   - Al soltar, se muestra toast de error: *"El grupo X está lleno."*
3. Al **eliminar un grupo**, sus alumnos pasan a "sin asignar" (no se pierden).
4. **Limpiar todos los grupos** mantiene los grupos vacíos pero devuelve todos los alumnos a "sin asignar". Eliminarlos del todo es una acción separada.
5. La **distribución automática** reparte sólo los alumnos *actualmente sin asignar* y respeta `capacity`. Si sobran alumnos, se quedan sin asignar y se avisa.
6. Selección de grupo: clic en una tarjeta de grupo → se resalta y abre el panel de detalle. Sólo un grupo seleccionado a la vez.
7. **Drag and drop** es la interacción principal. La alternativa accesible (seleccionar alumno → "Asignar a…" → elegir grupo) debe estar siempre disponible.
8. Los toasts son no bloqueantes y se autodescartan en ~3 s.
9. Acciones destructivas (eliminar grupo, limpiar todos, eliminar sesión) requieren **confirmación modal**.
10. El botón **Guardar** es siempre simulado: muestra toast "Sesión guardada" y, opcionalmente, añade una entrada al historial en memoria.

---

## 9. Reglas de evaluación

1. **Nota grupal** (`groupGrade`):
   - Rango válido: **0 – 10**, dos decimales como máximo.
   - Validación en input (no acepta valores fuera de rango).
   - Si está vacía, no contribuye a la media y se muestra como `—`.
2. **Override individual**:
   - Por defecto, cada alumno hereda la nota grupal.
   - Si se introduce un override, se marca visualmente (badge "Ajustada").
   - Mismo rango 0–10 y misma validación.
   - Botón "Restaurar nota grupal" para eliminar el override.
3. **Media del grupo**:
   - Calculada sobre las notas efectivas de cada alumno (override si existe, si no la nota grupal).
   - Se muestra con un decimal.
4. **Estados de evaluación** (`evalState`) y transiciones permitidas:
   - `pending` → `draft` → `published` → `locked`
   - Desde `draft` se puede volver a `pending`.
   - Desde `published` se puede volver a `draft` (correcciones).
   - `locked` es terminal en este prototipo (no se puede editar nota; sólo lectura).
5. **Validaciones bloqueantes** antes de pasar a `published`:
   - El grupo debe tener al menos 1 alumno.
   - La nota grupal o todas las individuales deben estar definidas.
6. No se calcula nada conectado a Moodle ni se exporta. Todo es local.

---

## 10. Reglas de diseño UI/UX

### 10.1 Principios

- **Clara, moderna, profesional, educativa.**
- Jerarquía visual evidente: lista (izda) → grupos (centro) → detalle (dcha).
- Densidad media: ni demasiado vacía ni saturada.
- Feedback inmediato a toda acción (toast, animación corta, cambio de estado).
- "Empty states" cuidados (lista vacía, grupo vacío, sin sesiones).

### 10.2 Paleta provisional inspirada en Robotix

> **Aviso:** No puedo verificar online los colores corporativos exactos de `robotix.es` desde este entorno. La paleta siguiente es **provisional**, inspirada en una identidad **STEAM / tecnológica / educativa** y deberá validarse con la marca real antes de cerrar diseño.

- **Primario (Robotix Blue, provisional):** `#0066B3` — acciones principales, links, foco.
- **Secundario (Energy Orange, provisional):** `#F39200` — acentos, llamadas a la acción secundarias, badges.
- **Éxito:** `#1F8A4C`
- **Advertencia:** `#E0A800`
- **Error:** `#C0392B`
- **Neutros:** `#0E1B2C` (texto), `#3C4A5E` (texto suave), `#E6EBF1` (bordes), `#F5F7FA` (fondo), `#FFFFFF`.

Tipografía: una **sans-serif moderna** (Inter, Manrope o similar). Pesos 400 / 500 / 600 / 700.

### 10.3 Componentes visuales clave

- **StudentCard:** avatar circular con iniciales sobre primario, nombre, nota como chip pequeño.
- **GroupCard:** cabecera con nombre + barra de capacidad (e.g. `4/5`), lista compacta de alumnos, footer con media y estado.
- **EvalStateBadge:** color + icono + texto (no sólo color).
- **EmptyGroupSlot:** placeholder discontinuo con texto "Arrastra alumnos aquí".
- **Toasts:** esquina inferior derecha (desktop) / superior (móvil).

### 10.4 Accesibilidad

- Contraste mínimo AA en texto y botones.
- `:focus-visible` claro en todos los interactivos.
- Cada estado se comunica con **icono + texto + color** (nunca sólo color).
- Drag and drop con **alternativa por teclado/botón**.
- Etiquetas claras en todos los botones (no sólo iconos).
- Roles ARIA donde aplica (`role="list"`, `role="listitem"`, `aria-live` para toasts).

---

## 11. Consideraciones para futura integración con Moodle Workplace 4.5

El prototipo se diseña pensando en que el siguiente paso sea convertirlo en plugin. Para no condicionar mal esa evolución:

1. **Modelo de datos compatible:** los tipos `Student`, `Group`, `Session` mapearán hacia entidades Moodle (`user`, `groups`, `groupings`, `grade_items`, `grade_grades`).
2. **IDs como `string`** y agnósticos: no se asume autoincremental MySQL; en Moodle los `userid`/`groupid` son `int`, pero el prototipo trabaja con strings opacos para no acoplarse.
3. **Capa de datos aislada:** todo acceso a alumnos/grupos/sesiones pasa por un **store** y por `data/mock*.ts`. En el futuro, `mock*` se sustituye por llamadas a Web Services Moodle (`core_user_get_users_by_field`, `core_group_*`, `gradereport_*`) sin tocar la UI.
4. **Permisos:** la UI considera un único rol "profesor". En la versión plugin, esto se mapeará a capabilities Moodle (`mod/<plugin>:manage`, `:grade`, `:viewallgroups`).
5. **Estados de evaluación** alineables con el flujo de Moodle Gradebook (oculto / visible / bloqueado / publicado).
6. **Sesión = "actividad" del plugin:** una `Session` será una instancia de la actividad Moodle dentro de un curso. El prototipo ya separa la sesión como objeto independiente.
7. **Multilenguaje:** todos los textos visibles deben centralizarse (p. ej. `strings.es.ts`) para facilitar el `lang/` de Moodle más adelante.
8. **Sin dependencias incompatibles:** preferir librerías ligeras (drag and drop nativo o `dnd-kit`); evitar stacks que después tengamos que reescribir para encajar en AMD/ES modules dentro de Moodle.
9. **Estilo encapsulable:** usar CSS modules o Tailwind con `prefix` / scoping previsto, para no chocar con los estilos globales de Moodle.
10. **Logs/feedback** siempre vía componentes (no `alert()`/`confirm()` nativos), porque en Moodle se sustituirán por `core/notification`.

---

## 12. Checklist de aceptación del prototipo

El prototipo se considera **terminado** cuando todas estas casillas se pueden marcar manualmente:

### Estructura general
- [ ] La app arranca con `npm run dev` sin errores ni warnings críticos.
- [ ] El layout responde correctamente en desktop, tablet y móvil.
- [ ] Hay tres vistas accesibles: **Agrupación**, **Historial**, **Configuración**.

### Lista de alumnos
- [ ] Se muestran ≥ 24 alumnos mock con nombre, iniciales y nota.
- [ ] El buscador filtra por nombre en tiempo real.
- [ ] El contador de "sin asignar" se actualiza al asignar/desasignar.

### Grupos
- [ ] Se pueden crear, renombrar y eliminar grupos.
- [ ] Se puede limpiar todos los grupos con confirmación.
- [ ] La distribución automática reparte alumnos respetando la capacidad.
- [ ] Los grupos vacíos muestran "Arrastra alumnos aquí".
- [ ] Cada grupo muestra capacidad (`X/Y`), media y estado de evaluación.

### Drag and drop
- [ ] Se puede arrastrar un alumno desde la lista a un grupo.
- [ ] Se puede mover un alumno entre grupos.
- [ ] Se puede devolver un alumno a "sin asignar".
- [ ] Hay feedback visual durante el arrastre.
- [ ] No se permite superar la capacidad y se muestra toast de error.
- [ ] Existe alternativa por botones / teclado para asignar.

### Detalle del grupo
- [ ] Al seleccionar un grupo, se muestra su detalle a la derecha.
- [ ] Se puede editar la nota grupal (0–10, validada).
- [ ] Se puede ajustar la nota individual de un alumno.
- [ ] La media del grupo se recalcula automáticamente.
- [ ] El estado de evaluación se puede cambiar respetando las transiciones.
- [ ] Hay botón "Guardar" simulado con toast de confirmación.

### Historial
- [ ] La pestaña Historial muestra ≥ 4 sesiones mock.
- [ ] Cada entrada muestra nombre, fecha, nº de grupos, nº de alumnos, estado.

### Configuración
- [ ] Permite cambiar nombre de sesión, tamaño máx y tamaño mín recomendado.
- [ ] Los cambios afectan a la sesión actual.

### UI / UX y accesibilidad
- [ ] Paleta provisional aplicada de forma coherente.
- [ ] Contraste AA en textos principales.
- [ ] Foco visible en interactivos.
- [ ] Estados nunca dependen sólo del color.
- [ ] Etiquetas claras en todos los botones.
- [ ] Toasts visibles, no bloqueantes y autodescartables.

### Calidad técnica
- [ ] Tipos TypeScript completos para `Student`, `Group`, `Session`, `SessionConfig`.
- [ ] Sin `any` salvo justificado.
- [ ] Componentes pequeños y reutilizables.
- [ ] Estado centralizado (no `prop-drilling` excesivo).
- [ ] Datos mock claramente separados de la lógica de UI.

---

## Próximos pasos sugeridos (tras revisión de este documento)

1. Validar la paleta provisional con la marca real de Robotix.
2. Confirmar el listado y nombres mock de alumnos (¿algún caso de uso concreto en mente?).
3. Decidir librería de drag and drop: **HTML5 nativo** (más simple, menos dependencias) vs **`dnd-kit`** (más accesible, recomendable).
4. A partir de la aprobación de este documento, comenzar la implementación por fases:
   - **Fase 1:** scaffold (Vite + React + TS + Tailwind), tipos y mocks, layout.
   - **Fase 2:** lista de alumnos, grupos, panel de detalle (sin DnD aún, sólo botones).
   - **Fase 3:** drag and drop + alternativa accesible.
   - **Fase 4:** evaluación (notas, estados, validaciones).
   - **Fase 5:** historial + configuración + pulido visual y responsive.

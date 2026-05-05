````markdown
# VisualGroups — Plugin para Moodle Workplace 4.5

> Documento maestro del proyecto. Define **qué construir**. Para reglas de **cómo trabajar** (rol, principios, convenciones, identidad visual general, antipatrones), ver `SKILLS.md`. Ambos archivos se cargan en cada sesión de Claude Code.

---

## 0. Resumen ejecutivo

**Producto**: herramienta de gestión visual de alumnos, creación de grupos por drag & drop y evaluación grupal e individual, embebida en Moodle Workplace 4.5.

**Usuario**: profesorado de centros educativos (privados, concertados, públicos) en Catalunya y España, B2B vía ROBOTIX.

**Problema que resuelve**: la creación de grupos en Moodle es textual y rígida; la evaluación grupal exige rúbricas configuradas a mano. Este plugin ofrece una capa visual sobre los datos de Moodle, **sin reemplazarlo**.

**Definición de éxito del MVP**: un profesor entra desde Moodle, crea grupos para una clase suya, evalúa y publica las notas al gradebook de Moodle, todo en menos de 5 minutos para una clase de 25 alumnos, sin formación previa.

**Decisión arquitectural cerrada**: app externa Next.js 15 + Supabase, embebida vía **LTI 1.3 + iframe** dentro de Moodle Workplace 4.5, con un plugin Moodle PHP mínimo para registro LTI, capabilities, Privacy API, Events y Backup/Restore.

---

## 1. Contexto del producto

### Persona del profesor

Profesor de primaria o secundaria, 35–55 años, no necesariamente experto en TI, ya usa Moodle Workplace para gestión académica. Trabaja en aula con tablet o portátil. Necesita:

- Hacer grupos rápido para un proyecto o trabajo.
- Equilibrar grupos por nivel (sin matemáticas: visual y arrastrar).
- Poner nota al grupo y ajustar individualmente cuando alguien destaca o falla.
- Ver de un vistazo qué grupos están bien y cuáles flojean.
- Que las notas lleguen al gradebook de Moodle sin re-introducirlas.

### Lo que el plugin **no** es

- No es un módulo de actividad calificable nativo Moodle (es app externa LTI).
- No es una herramienta de gestión de centro (no toca matrículas ni cursos).
- No es un sustituto del gradebook (las notas finales viven en Moodle).
- No es una red social educativa, no hay chat, no hay perfiles.

---

## 2. Arquitectura confirmada

### Diagrama de componentes

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MOODLE WORKPLACE 4.5                            │
│                                                                     │
│  ┌──────────────────────────┐   ┌─────────────────────────────┐    │
│  │ Plugin local_visualgroups │   │  External Tool (LTI 1.3)    │    │
│  │  • capabilities           │   │  • OIDC launch              │    │
│  │  • Privacy API            │──▶│  • Iframe to Next.js app    │    │
│  │  • Events                 │   │  • AGS Score endpoint       │    │
│  │  • Backup/Restore         │   │  • NRPS members lookup      │    │
│  └──────────────────────────┘   └─────────────────────────────┘    │
│                                              │                      │
└──────────────────────────────────────────────┼──────────────────────┘
                                               │ JWT LTI 1.3
                                               ▼
                                  ┌────────────────────────────┐
                                  │ Edge Function              │
                                  │ lti_launch_bridge          │
                                  │  • valida JWT vs JWKS      │
                                  │  • refresca caches         │
                                  │  • emite JWT Supabase      │
                                  └────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    APP EXTERNA (AWS Amplify)                        │
│                                                                     │
│  ┌──────────────────────┐         ┌──────────────────────┐         │
│  │  Next.js 15          │ ──────▶ │  Supabase            │         │
│  │  (App Router, RSC)   │         │  • Postgres + RLS    │         │
│  │  • React 19          │         │  • Edge Functions    │         │
│  │  • Tanstack Query    │         │  • Realtime (poco)   │         │
│  │  • Zustand           │         └──────────────────────┘         │
│  │  • @dnd-kit          │                    │                     │
│  │  • next-intl ca/es/en│                    ▼                     │
│  └──────────────────────┘         ┌──────────────────────┐         │
│                                    │ Edge Function        │         │
│                                    │ push_to_gradebook    │ ──────┐ │
│                                    │ (LTI AGS Score)      │       │ │
│                                    └──────────────────────┘       │ │
└────────────────────────────────────────────────────────────────────┼┘
                                                                     │
                                              Notas finales ─────────┘
                                              (vuelta a Moodle)
```

### Source of Truth

| Dato | SoT | Comentario |
|---|---|---|
| Identidad de usuario | Moodle (`mdl_user`) | Plugin solo guarda `moodle_userid bigint` |
| Cursos y matrículas | Moodle | Plugin solo guarda `moodle_courseid bigint` |
| Roles y capabilities | Moodle | Cacheado en Supabase para RLS rápida (TTL 1h) |
| Sesiones de agrupación | Supabase | Trabajo en curso del profesor |
| Layout del canvas (paneles, miembros) | Supabase | Específico del plugin |
| Evaluaciones en borrador | Supabase | Hasta que se publican |
| Notas finales publicadas | Moodle gradebook | Devolución obligatoria vía LTI AGS |

### Lo que esta arquitectura **no** es

- No es plugin PHP monolítico con Mustache.
- No es app standalone sin Moodle.
- No es sincronización bidireccional masiva Moodle ↔ Supabase.
- No es híbrido con duplicación de identidad.

---

## 3. Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | Next.js (App Router, RSC) | 15.x |
| Frontend | React | 19.x |
| Frontend | TypeScript | 5.x con `strict: true`, `noUncheckedIndexedAccess: true` |
| Estilos | Tailwind | v4 con `@theme` |
| Estado servidor | Tanstack Query | v5 |
| Estado UI local | Zustand | v5 con selectors |
| Validación | Zod | esquemas compartidos cliente + Edge Function |
| Drag & Drop | `@dnd-kit/core` + `sortable` + `accessibility` | última estable |
| i18n | `next-intl` | locales `ca-ES`, `es-ES`, `en-US` |
| Backend datos | Supabase (Postgres 15+) | RLS en todas las tablas |
| Cliente Supabase | `@supabase/ssr` | server: `autoRefreshToken: false, persistSession: false` |
| Edge Functions | Deno + TypeScript | JWT verificado en cada función |
| Hosting frontend | AWS Amplify | con CSP `frame-ancestors` para Moodle |
| Plugin Moodle | PHP 8.1+ | Moodle Workplace 4.5 conventions |
| Tests E2E | Playwright | flujos críticos del MVP |
| Tests RLS | SQL fixtures + pgTap | matriz role × tabla × verbo |

No introducir otras dependencias sin justificación. Ver `SKILLS.md` §4 para libs prohibidas.

---

## 4. Flujo de autenticación LTI 1.3

### Secuencia

```
1. Profesor pulsa actividad LTI en Moodle.
2. Moodle inicia OIDC login flow → POST a /api/lti/login.
3. Devolvemos auth request → Moodle redirige con id_token JWT.
4. Edge Function lti_launch_bridge:
   a. Valida id_token contra JWKS del issuer Moodle.
   b. Extrae claims: sub (Moodle userid), context.id (courseid),
      roles, name, email, custom claims (tenantid).
   c. Llama a NRPS para obtener members del curso.
   d. Llama a core_user_get_users / core_enrol_get_enrolled_users
      para refrescar moodle_user_cache y moodle_role_cache.
   e. Genera JWT Supabase con claims:
      { sub, moodle_userid, moodle_courseid, moodle_role, tenantid, exp }
   f. Setea cookie HttpOnly + Secure + SameSite=None.
5. Iframe carga la app Next.js con la sesión Supabase activa.
```

### Claims del JWT Supabase

```json
{
  "sub": "<moodle_userid_as_string>",
  "moodle_userid": 12345,
  "moodle_courseid": 678,
  "moodle_role": "teacher",
  "tenantid": 9,
  "iss": "visualgroups",
  "exp": 1730000000
}
```

`moodle_role` se deriva de capabilities Moodle, no de roles globales:

- `local/visualgroups:manage` granted → `teacher`
- `local/visualgroups:view` granted (sin manage) → `student`
- Site administrator → `admin`

### Cookies en iframe

`SameSite=None; Secure; HttpOnly`. Verificar comportamiento en **Safari iOS** desde la primera iteración (es donde primero rompe la integración LTI iframe).

---

## 5. Origen de datos y devolución al gradebook

### Sincronización desde Moodle

| Dato | Cuándo se sincroniza | Cómo |
|---|---|---|
| `moodle_user_cache` | Tras cada LTI launch + cron diario | Edge Function `sync_moodle_user_cache` vía `core_user_get_users` |
| `moodle_role_cache` | Tras cada LTI launch | Derivado de claims JWT + `core_enrol_get_enrolled_users` |
| Lista de alumnos del curso | Al abrir tab "Grupos" | `Names and Roles Provisioning Service` (NRPS) cacheado 5min |

### Devolución al gradebook Moodle

Al **publicar** una `vg_evaluations`:

1. La Edge Function `publish_evaluation` valida (todos los miembros con score, rangos válidos, rúbricas completas si aplican).
2. Cambia `status = 'published'` y graba `published_at`.
3. Dispara `push_to_gradebook` que:
   - Itera sobre `vg_individual_scores` y `vg_panel_members`.
   - Calcula la nota final de cada alumno: `score_override ?? group_score`.
   - Llama al endpoint LTI AGS `Score` con cada nota.
   - Marca `moodle_pushed_at = now()` cuando todas las notas se enviaron OK.
   - Si alguna falla, graba `moodle_push_error` y deja `moodle_pushed_at = null` para reintento por cron.

**Idempotencia**: si `moodle_pushed_at` ya está, no se reintenta salvo cambio explícito.

**Trazabilidad**: `vg_evaluations.moodle_grade_item_id` guarda el `lineitem` LTI AGS asociado.

---

## 6. Modelo de datos

### Convenciones

- Todas las tablas del plugin con prefijo `vg_` para no chocar con `mdl_groups`/`mdl_groups_members`.
- IDs internos: UUID v4. IDs de Moodle: `bigint`.
- Cero PII de menores persistida fuera de cache caducable.
- Enums Postgres para campos de estado.
- CHECK constraints en todos los rangos numéricos.
- RLS habilitada en todas las tablas (sin excepción).

### 6.1 Enums

```sql
CREATE TYPE vg_session_status     AS ENUM ('active', 'archived', 'locked');
CREATE TYPE vg_evaluation_status  AS ENUM ('pending', 'draft', 'published', 'locked');
CREATE TYPE vg_attendance_status  AS ENUM ('present', 'absent', 'late', 'justified');
CREATE TYPE vg_moodle_role        AS ENUM ('teacher', 'student', 'admin');
```

### 6.2 Caches Moodle

```sql
CREATE TABLE moodle_user_cache (
  moodle_userid    bigint PRIMARY KEY,
  display_name     text NOT NULL,
  avatar_url       text,
  lang             text,
  refreshed_at     timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE moodle_user_cache IS
  'Cache de display name y avatar desde mdl_user. TTL 24h. No usar como SoT.';

CREATE TABLE moodle_role_cache (
  moodle_userid    bigint NOT NULL,
  moodle_courseid  bigint NOT NULL,
  role             vg_moodle_role NOT NULL,
  refreshed_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (moodle_userid, moodle_courseid)
);
CREATE INDEX idx_role_cache_course ON moodle_role_cache(moodle_courseid, role);
```

Escritura en estas tablas: solo desde Edge Functions con service role.

### 6.3 Dominio del plugin

```sql
-- Sesión de agrupación: una "ronda" de creación de grupos para un trabajo concreto.
CREATE TABLE vg_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moodle_courseid     bigint NOT NULL,
  moodle_tenantid     bigint,                                    -- multi-tenant Workplace
  name                text NOT NULL CHECK (length(trim(name)) > 0),
  created_by_userid   bigint NOT NULL,
  status              vg_session_status NOT NULL DEFAULT 'active',
  min_group_size      int NOT NULL DEFAULT 2 CHECK (min_group_size >= 1),
  max_group_size      int NOT NULL DEFAULT 6,
  auto_seed           text,                                      -- reproducibilidad de "Distribuir"
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  locked_at           timestamptz,
  CHECK (max_group_size >= min_group_size)
);
CREATE INDEX idx_vg_sessions_course ON vg_sessions(moodle_courseid, status);
CREATE INDEX idx_vg_sessions_tenant ON vg_sessions(moodle_tenantid) WHERE moodle_tenantid IS NOT NULL;

-- Panel = círculo del canvas (renombrado de "groups" para no chocar con mdl_groups).
CREATE TABLE vg_panels (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES vg_sessions(id) ON DELETE CASCADE,
  name         text NOT NULL CHECK (length(trim(name)) > 0),
  color        text,                                             -- override opcional por el profesor
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vg_panels_session ON vg_panels(session_id, sort_order);

-- Miembros del panel (renombrado de "group_members").
CREATE TABLE vg_panel_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id        uuid NOT NULL REFERENCES vg_panels(id) ON DELETE CASCADE,
  moodle_userid   bigint NOT NULL,
  is_locked       boolean NOT NULL DEFAULT false,                -- candado: no arrastrable
  is_absent       boolean NOT NULL DEFAULT false,                -- ausencia contextual a esta sesión
  moved_by_userid bigint,                                        -- auditoría inline
  joined_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (panel_id, moodle_userid)
);
CREATE INDEX idx_vg_members_panel ON vg_panel_members(panel_id);
CREATE INDEX idx_vg_members_user ON vg_panel_members(moodle_userid);

-- Evaluación grupal (una por panel).
CREATE TABLE vg_evaluations (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id                 uuid NOT NULL UNIQUE REFERENCES vg_panels(id) ON DELETE CASCADE,
  session_id               uuid NOT NULL REFERENCES vg_sessions(id) ON DELETE CASCADE,
  group_score              numeric(4,2) CHECK (group_score IS NULL OR (group_score >= 0 AND group_score <= 10)),
  status                   vg_evaluation_status NOT NULL DEFAULT 'pending',
  evaluated_by_userid      bigint,
  notes                    text,                                 -- comentario privado del profesor
  moodle_grade_item_id     bigint,                               -- LTI AGS lineitem
  moodle_pushed_at         timestamptz,                          -- idempotencia gradebook
  moodle_push_error        text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  published_at             timestamptz
);
CREATE INDEX idx_vg_evals_session_status ON vg_evaluations(session_id, status);
CREATE INDEX idx_vg_evals_pending_push
  ON vg_evaluations(moodle_pushed_at)
  WHERE moodle_pushed_at IS NULL AND status = 'published';

-- Override individual de la nota grupal.
CREATE TABLE vg_individual_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id   uuid NOT NULL REFERENCES vg_evaluations(id) ON DELETE CASCADE,
  moodle_userid   bigint NOT NULL,
  score_override  numeric(4,2) CHECK (score_override IS NULL OR (score_override >= 0 AND score_override <= 10)),
  notes           text,                                          -- nota privada del profesor por alumno
  UNIQUE (evaluation_id, moodle_userid)
);
CREATE INDEX idx_vg_indiv_eval ON vg_individual_scores(evaluation_id);

-- Rúbricas (FASE 2)
CREATE TABLE vg_rubrics (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  created_by_userid   bigint NOT NULL,
  is_template         boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vg_rubric_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id    uuid NOT NULL REFERENCES vg_rubrics(id) ON DELETE CASCADE,
  criterion    text NOT NULL,
  max_score    numeric(4,2) NOT NULL CHECK (max_score > 0),
  weight       int NOT NULL DEFAULT 1 CHECK (weight > 0),
  sort_order   int NOT NULL DEFAULT 0
);
CREATE INDEX idx_vg_rubitems_rubric ON vg_rubric_items(rubric_id, sort_order);

CREATE TABLE vg_rubric_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_item_id  uuid NOT NULL REFERENCES vg_rubric_items(id) ON DELETE CASCADE,
  evaluation_id   uuid NOT NULL REFERENCES vg_evaluations(id) ON DELETE CASCADE,
  moodle_userid   bigint,                                        -- null = nota grupal por criterio
  score           numeric(4,2) NOT NULL CHECK (score >= 0),
  comment         text
);
CREATE INDEX idx_vg_rubscores_eval ON vg_rubric_scores(evaluation_id);

-- Coevaluación / autoevaluación (FASE 2)
CREATE TABLE vg_peer_reviews (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id            uuid NOT NULL REFERENCES vg_evaluations(id) ON DELETE CASCADE,
  reviewer_moodle_userid   bigint NOT NULL,
  reviewee_moodle_userid   bigint NOT NULL,
  score                    numeric(4,2) CHECK (score IS NULL OR (score >= 0 AND score <= 10)),
  comment                  text,
  is_anonymous             boolean NOT NULL DEFAULT true,
  submitted_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vg_peer_eval ON vg_peer_reviews(evaluation_id);

-- Vista anónima: el reviewer queda NULL si is_anonymous. Es la que leen los profesores.
CREATE VIEW vg_peer_reviews_anon AS
SELECT
  id, evaluation_id, reviewee_moodle_userid, score, comment, submitted_at,
  CASE WHEN is_anonymous THEN NULL ELSE reviewer_moodle_userid END AS reviewer_moodle_userid
FROM vg_peer_reviews;

-- Asistencia (FASE 2)
CREATE TABLE vg_attendance (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid NOT NULL REFERENCES vg_sessions(id) ON DELETE CASCADE,
  moodle_userid       bigint NOT NULL,
  status              vg_attendance_status NOT NULL DEFAULT 'present',
  recorded_at         timestamptz NOT NULL DEFAULT now(),
  recorded_by_userid  bigint,
  UNIQUE (session_id, moodle_userid)
);

-- Audit reducido (solo eventos del canvas; las acciones críticas emiten Moodle Events).
CREATE TABLE vg_audit_log (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type           text NOT NULL,
  entity_id             uuid NOT NULL,
  action                text NOT NULL,
  old_value             jsonb,
  new_value             jsonb,
  performed_by_userid   bigint NOT NULL,
  moodle_courseid       bigint NOT NULL,                         -- denormalizado para RLS rápida
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vg_audit_entity_time ON vg_audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_vg_audit_course ON vg_audit_log(moodle_courseid, created_at DESC);
-- Retención: 365 días, podado por cron.
```

### 6.4 Triggers críticos

```sql
-- updated_at automático
CREATE OR REPLACE FUNCTION vg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_vg_sessions_updated
BEFORE UPDATE ON vg_sessions FOR EACH ROW EXECUTE FUNCTION vg_set_updated_at();

CREATE TRIGGER trg_vg_evaluations_updated
BEFORE UPDATE ON vg_evaluations FOR EACH ROW EXECUTE FUNCTION vg_set_updated_at();

-- Garantiza que un alumno NO esté en dos paneles de la misma sesión.
CREATE OR REPLACE FUNCTION vg_check_member_unique_per_session()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE conflict_count int;
BEGIN
  SELECT count(*) INTO conflict_count
  FROM vg_panel_members m
  JOIN vg_panels p ON p.id = m.panel_id
  WHERE m.moodle_userid = NEW.moodle_userid
    AND p.session_id = (SELECT session_id FROM vg_panels WHERE id = NEW.panel_id)
    AND m.id <> COALESCE(NEW.id, gen_random_uuid());
  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Alumno % ya está en otro panel de esta sesión', NEW.moodle_userid;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vg_member_unique_session
BEFORE INSERT OR UPDATE ON vg_panel_members
FOR EACH ROW EXECUTE FUNCTION vg_check_member_unique_per_session();
```

### 6.5 Vista de lectura frecuente

```sql
CREATE VIEW vg_panel_average AS
SELECT
  p.id AS panel_id,
  p.session_id,
  COUNT(DISTINCT m.moodle_userid) FILTER (WHERE m.is_absent = false) AS active_members,
  COUNT(DISTINCT m.moodle_userid) AS total_members,
  e.group_score,
  e.status AS evaluation_status,
  AVG(COALESCE(s.score_override, e.group_score)) AS effective_average
FROM vg_panels p
LEFT JOIN vg_panel_members m ON m.panel_id = p.id
LEFT JOIN vg_evaluations e ON e.panel_id = p.id
LEFT JOIN vg_individual_scores s
  ON s.evaluation_id = e.id AND s.moodle_userid = m.moodle_userid
GROUP BY p.id, p.session_id, e.group_score, e.status;
```

---

## 7. Row Level Security

### Helpers JWT

```sql
CREATE OR REPLACE FUNCTION jwt_moodle_userid() RETURNS bigint LANGUAGE sql STABLE AS $$
  SELECT NULLIF(auth.jwt() ->> 'moodle_userid', '')::bigint
$$;

CREATE OR REPLACE FUNCTION jwt_moodle_role() RETURNS vg_moodle_role LANGUAGE sql STABLE AS $$
  SELECT NULLIF(auth.jwt() ->> 'moodle_role', '')::vg_moodle_role
$$;

CREATE OR REPLACE FUNCTION jwt_can_teach_course(p_courseid bigint) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM moodle_role_cache
    WHERE moodle_userid = jwt_moodle_userid()
      AND moodle_courseid = p_courseid
      AND role IN ('teacher', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION jwt_is_enrolled_in_course(p_courseid bigint) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM moodle_role_cache
    WHERE moodle_userid = jwt_moodle_userid()
      AND moodle_courseid = p_courseid
  )
$$;
```

### Matriz de policies (resumen)

| Tabla | Teacher | Student | Admin (service_role) |
|---|---|---|---|
| `moodle_user_cache` | SELECT all | SELECT all | ALL |
| `moodle_role_cache` | SELECT solo el propio | SELECT solo el propio | ALL |
| `vg_sessions` | ALL donde `jwt_can_teach_course(moodle_courseid)` | SELECT donde enrolado | ALL |
| `vg_panels` | ALL via session pertenece a su curso | SELECT donde es miembro | ALL |
| `vg_panel_members` | ALL via panel | SELECT propio + del propio panel | ALL |
| `vg_evaluations` | ALL via session | SELECT donde `status='published'` y miembro | ALL |
| `vg_individual_scores` | ALL via evaluation | SELECT propio donde published | ALL |
| `vg_rubrics` | ALL propios + templates | SELECT donde aplique | ALL |
| `vg_rubric_items` | ALL del rubric | SELECT donde aplique | ALL |
| `vg_rubric_scores` | ALL via evaluation | SELECT propio donde published | ALL |
| `vg_peer_reviews` | SELECT vía vista anónima | INSERT/SELECT propios | ALL |
| `vg_attendance` | ALL via session | SELECT propio | ALL |
| `vg_audit_log` | SELECT donde teach | denegado | ALL |

Las policies completas viven en la migración SQL del repo. **Cero excepciones a RLS.** Service role solo se usa desde Edge Functions, nunca expuesto al cliente.

### Tests RLS

Parte de la CI. Matriz `(role × tabla × verbo)` que verifica:

- Un teacher no ve cursos de otro teacher.
- Un student no ve evaluaciones no publicadas.
- Un student no puede insertar en `vg_panel_members` (el alumno no se asigna solo).
- Un teacher de un tenant Workplace no ve sesiones de otro tenant.

---

## 8. Plugin Moodle PHP (componente mínimo)

El plugin Moodle PHP tipo `local_visualgroups` es **mínimo**: no renderiza UI principal, solo registra el LTI tool y expone las APIs Moodle obligatorias.

### Estructura

```
moodle-plugin/local/visualgroups/
├── version.php
├── settings.php                           ← admin settings (URL del tool, JWKS, secret)
├── db/
│   ├── access.php                         ← capabilities
│   ├── events.php                         ← observers (si necesario)
│   ├── install.xml                        ← (vacío salvo metadata mínima del plugin)
│   └── upgrade.php
├── classes/
│   ├── privacy/
│   │   └── provider.php                   ← Privacy API
│   ├── event/
│   │   ├── evaluation_published.php
│   │   ├── session_archived.php
│   │   └── session_locked.php
│   └── external/                          ← Web Services solo si imprescindibles
├── lang/
│   ├── en/local_visualgroups.php
│   ├── es/local_visualgroups.php
│   └── ca/local_visualgroups.php
└── backup/moodle2/
    ├── backup_local_visualgroups_plugin.class.php
    └── restore_local_visualgroups_plugin.class.php
```

### Capabilities (`db/access.php`)

```php
$capabilities = [
    'local/visualgroups:view' => [
        'captype' => 'read',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes' => [
            'student' => CAP_ALLOW,
            'teacher' => CAP_ALLOW,
            'editingteacher' => CAP_ALLOW,
            'manager' => CAP_ALLOW,
        ],
    ],
    'local/visualgroups:manage' => [
        'captype' => 'write',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes' => [
            'editingteacher' => CAP_ALLOW,
            'manager' => CAP_ALLOW,
        ],
    ],
    'local/visualgroups:evaluate' => [
        'captype' => 'write',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes' => [
            'teacher' => CAP_ALLOW,
            'editingteacher' => CAP_ALLOW,
        ],
    ],
    'local/visualgroups:admin' => [
        'captype' => 'write',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes' => [
            'manager' => CAP_ALLOW,
        ],
    ],
];
```

### Privacy API

Como los datos viven en Supabase, la implementación delega:

- `get_metadata`: declara que se exportan datos a un servicio externo (Supabase) con metadata "userid, course participation, evaluations".
- `get_contexts_for_userid`: devuelve cursos donde el user tiene actividad (consulta a Supabase via Edge Function `gdpr_get_contexts`).
- `export_user_data`: Edge Function `gdpr_export(moodle_userid)` devuelve JSON con todas las evaluaciones, miembros, peer reviews del usuario.
- `delete_data_for_user`: Edge Function `gdpr_delete(moodle_userid)` borra en cascada en todas las tablas Supabase.
- `delete_data_for_users_in_context`: idem para borrado masivo de un curso.

### Events

Eventos Moodle que el plugin emite cuando ocurren acciones críticas (alimenta logstore Moodle y reports nativos):

- `\local_visualgroups\event\evaluation_published`
- `\local_visualgroups\event\session_archived`
- `\local_visualgroups\event\session_locked`
- `\local_visualgroups\event\grades_pushed_to_gradebook`

Llamados desde el frontend Next.js vía Web Service interno o desde el bridge tras la operación correspondiente.

### Backup / Restore

Como los datos están en Supabase (no en BD Moodle), la decisión es:

- Declarar en `backup/moodle2/` que el plugin **no respalda contenido** con el curso por defecto.
- Documentar en `lang/*/local_visualgroups.php` que las sesiones de agrupación son trabajo del profesor y no se incluyen en el backup del curso.
- Si en fase 2 se decide respaldar, implementar export JSON desde Supabase y guardar como fichero adjunto al backup Moodle.

### Web Services

Solo si imprescindibles. En MVP, ninguno: la app Next.js consume Moodle via LTI claims + NRPS.

---

## 9. Edge Functions

Operaciones que no se ejecutan en cliente:

| Función | Propósito | Trigger |
|---|---|---|
| `lti_launch_bridge` | Valida JWT LTI 1.3, refresca caches, emite JWT Supabase | LTI launch |
| `sync_moodle_user_cache` | Refresca display name + avatar desde Moodle | Cron diario + on-demand |
| `sync_moodle_role_cache` | Refresca capabilities por curso | Tras cada launch |
| `distribute_panel` | Distribución aleatoria reproducible (seed) | Botón "Distribuir" |
| `auto_balance` | Distribución por terciles de rendimiento (FASE 4) | Botón "Equilibrar" |
| `publish_evaluation` | Valida + cambia status + dispara push a gradebook | Botón "Publicar" |
| `push_to_gradebook` | LTI AGS Score endpoint, idempotente | Tras publish + cron de reintentos |
| `gdpr_get_contexts` | Privacy API: cursos del usuario | Privacy request |
| `gdpr_export` | Privacy API: export JSON | Privacy request |
| `gdpr_delete` | Privacy API: borrado en cascada | Privacy request |
| `prune_audit_log` | Borra registros > 365 días | Cron mensual |

Cada Edge Function:

1. Valida JWT Supabase en la primera línea.
2. Verifica capability necesaria.
3. Usa service role para operar.
4. Devuelve JSON tipado validado con Zod.
5. Loguea errores estructurados a observabilidad.

---

## 10. Arquitectura de la sección (UI)

### Tabs

| Tab | Contenido |
|---|---|
| **Grupos** | Canvas visual + sidebar de alumnos sin asignar + detail panel del grupo seleccionado |
| **Evaluación** | Lista de grupos con notas grupales + ajustes individuales + rúbricas |
| **Historial** | Sesiones archivadas (`status = 'archived'`), read-only |
| **Configuración** | Tamaño de grupos, plantillas de rúbricas, restricciones (FASE 2) |

### Layout responsive

| Breakpoint | Layout |
|---|---|
| ≥ 1200px | Sidebar (240px) + canvas + detail panel (320px) colapsable |
| 768–1199px | Sidebar + canvas; detail panel como drawer derecho |
| < 768px | Tabs internas; canvas en 1 columna; sidebar como sheet inferior; **DnD reemplazado por flujo "tap-to-assign"** |

El caso de uso real es **profesor con tablet en aula**, así que tablet (768–1199px) es el primer ciudadano, no el desktop.

---

## 11. Drag & Drop — la feature crítica

### Decisiones técnicas

- Librería: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/accessibility`. **No** `react-beautiful-dnd` (deprecado).
- `vg_panels` se renderizan como **HTML/CSS con `border-radius: 50%`**, no SVG, para integrarse con sensores DnD.
- **Optimistic update**: el estado local cambia inmediatamente al `onDragEnd`; la mutación a Supabase se dispara en paralelo; si falla, rollback con toast de error.
- **Reconciliación con Realtime** (solo en co-teaching): handler que aplica `mergeOnConflict` por `id`.
- **Sensors**: pointer + keyboard. `Tab` mueve foco entre paneles; flechas mueven foco dentro; `Enter` selecciona alumno y abre menú "asignar a panel X".
- **Mobile**: doble tap conflict con zoom iOS → DnD reemplazado por flujo de selección + asignación con botón.

### Reglas

- Drop válido en panel si `count(panel_members) < max_group_size`.
- Drop entre paneles válido si el alumno no está bloqueado (`is_locked = true`) y el destino tiene espacio.
- "Doble clic para devolver al sidebar" solo en desktop. En tablet/mobile: menú contextual.

### Estados visuales durante DnD

| Estado | Visual |
|---|---|
| Drag iniciado | Chip origen → opacidad 35%, escala 96% |
| Sobre panel válido | Panel ring verde exterior, escala 107% |
| Sobre panel lleno | Ring rojo, cursor `not-allowed` |
| Drop exitoso | Animación de entrada + toast |
| Drop cancelado | Chip vuelve a origen con animación |

---

## 12. Design tokens del producto

Para la **paleta de marca general** (azul Robotix, cyan, amarillo accent), tipografía y radios, ver `SKILLS.md` §11. Aquí solo van los tokens **específicos del producto** (semáforo de notas, dimensiones del canvas).

### Semáforo de notas (semántica, no marca)

```ts
// design-tokens/scores.ts
export const performanceColors = {
  high:    { bg: '#9FE1CB', border: '#0F6E56', text: '#0F6E56' }, // ≥ 7.0
  medium:  { bg: '#FAC775', border: '#BA7517', text: '#BA7517' }, // 5.0–6.9
  low:     { bg: '#F09595', border: '#A32D2D', text: '#A32D2D' }, // < 5.0
  none:    { bg: '#D3D1C7', border: '#888780', text: '#888780' }, // sin nota
} as const;
```

### Estado de evaluación (anillo exterior del panel)

```ts
export const evaluationStateRing = {
  pending:   'ring-1 ring-neutral-300',
  draft:     'ring-2 ring-dashed ring-orange-400',
  published: 'ring-2 ring-emerald-500',
  locked:    'ring-2 ring-blue-500',
} as const;
```

### Convención visual del panel (resuelve un conflicto del primer borrador)

- **Borde principal del círculo** = color según **media de notas** del grupo (semáforo).
- **Anillo exterior (`ring`)** = estado de **evaluación** (`pending` / `draft` / `published` / `locked`).
- Color nunca es el único diferenciador: la nota numérica siempre se muestra, y el estado de evaluación incluye texto en el badge.

### Dimensiones del canvas

| Elemento | Tamaño |
|---|---|
| `vg_panel` (círculo) | 134×134px en desktop, 110×110px en tablet |
| `MemberDot` (chip dentro del círculo) | 26×26px |
| `StudentChip` (sidebar) | altura 36px, full width |
| Sidebar | 240px desktop, full width drawer en tablet/mobile |
| Detail panel | 320px desktop, drawer en tablet, sheet en mobile |
| Tamaño táctil mínimo | 44×44px en cualquier control interactivo |

---

## 13. Estados, validaciones y errores

### Estados obligatorios por vista

Cada vista (canvas, lista, panel de detalle, formulario) implementa los cuatro estados:

- **Loading skeleton** acorde a la forma del contenido final.
- **Empty state** con CTA clara: "Aún no has creado grupos — pulsa + para empezar o usa Distribuir".
- **Error con retry**: mensaje útil + botón "Reintentar".
- **Success** con datos.

### Empty states (claves i18n)

```
canvas.empty.no_groups         → "Encara no has creat grups — prem + per començar o utilitza Distribuir"
sidebar.empty.all_assigned     → "Tots els alumnes estan assignats ✓"
panel.empty.no_members         → "Arrossega alumnes aquí"
search.empty.no_results        → "Cap coincidència per a '{query}'"
history.empty.no_sessions      → "Encara no tens sessions arxivades"
```

(Ejemplos en catalán; se localizan a ca/es/en con `next-intl`.)

### Validaciones antes de `status = 'published'`

```ts
// Schema Zod compartido cliente + Edge Function
const PublishSchema = z.object({
  evaluationId: z.string().uuid(),
}).refine(async (data) => {
  // Todos los miembros activos (no ausentes) tienen score
  // group_score y todos los score_override en [0, 10]
  // Si rúbrica activa, todos los criterios tienen score
  // No hay alumnos pendientes de marcar como ausentes
});
```

Validaciones que devuelven mensajes específicos al profesor, no genéricos.

### Pérdida de conexión durante DnD

- Detectar offline con `navigator.onLine`.
- Encolar mutaciones en IndexedDB (`idb-keyval`).
- Banner persistente "Modo sin conexión — los cambios se sincronizarán" hasta resolución.
- Al recuperar conexión, drenar la cola con verificación de versión (`updated_at`).

### Error boundaries

Por sección crítica: canvas, sidebar, detail panel, tab content. Mensaje de error útil + botón "Reintentar" + log estructurado.

---

## 14. Plan de implementación por fases

### Fase 1 — MVP (semanas 1-3)

**Bloqueante para ser usable**:

- [ ] Plugin Moodle PHP `local_visualgroups` con `version.php`, capabilities, settings de admin.
- [ ] LTI 1.3 launch + Edge Function `lti_launch_bridge` → sesión Supabase.
- [ ] Sync inicial de `moodle_user_cache` y `moodle_role_cache`.
- [ ] Tab "Grupos" con layout completo: sidebar + canvas + detail panel.
- [ ] CRUD de `vg_sessions`, `vg_panels`, `vg_panel_members` con optimistic updates.
- [ ] DnD (`@dnd-kit`) desde sidebar → panel y entre paneles, con reglas de tamaño y locked.
- [ ] Distribución aleatoria con seed (Edge Function `distribute_panel`).
- [ ] `vg_audit_log` para movimientos.
- [ ] RLS completa con tests automatizados.
- [ ] i18n ca/es/en con `next-intl`.
- [ ] Responsive desktop + tablet (mobile en fase 2 opcional).
- [ ] Privacy API mínima en plugin Moodle (export + delete).

### Fase 2 — Evaluación + push a gradebook (semanas 4-6)

- [ ] Tab "Evaluación" con `vg_evaluations` + `vg_individual_scores`.
- [ ] Estados de evaluación con anillo exterior en el panel.
- [ ] Validaciones Zod compartidas antes de publicar.
- [ ] Edge Function `publish_evaluation` + `push_to_gradebook` con LTI AGS.
- [ ] Trazabilidad: `moodle_pushed_at`, `moodle_push_error`, reintento por cron.
- [ ] Rúbricas básicas (`vg_rubrics`, `vg_rubric_items`, `vg_rubric_scores`).
- [ ] Plantillas de rúbricas predefinidas: "Trabajo en equipo", "Presentación oral", "Proyecto escrito".
- [ ] Exportación CSV de notas.
- [ ] Moodle Events para acciones críticas.

### Fase 3 — Historial, asistencia, realtime, peer review (semanas 7-9)

- [ ] Tab "Historial" con sesiones archivadas (read-only).
- [ ] `vg_attendance` con flujo de pasar lista.
- [ ] Coevaluación + autoevaluación (`vg_peer_reviews` + vista anónima).
- [ ] Realtime + reconciliación entre profesores en co-teaching.
- [ ] Modo presentación proyectable.
- [ ] Backup/Restore Moodle si se decide incluir contenido del plugin.

### Fase 4 — Inteligencia (semanas 10-12)

> Roadmap, no implementar en MVP.

- [ ] Autoagrupación inteligente por terciles de rendimiento.
- [ ] Restricciones de incompatibilidad entre alumnos.
- [ ] Historial de rendimiento por grupo (gráfico comparativo).
- [ ] Exportación PDF de distribución.
- [ ] Integración con audiences/programs Workplace (si aplica).

---

## 15. Criterios de aceptación MVP

Para considerar el MVP terminado, **todo** lo siguiente debe ser verdadero:

1. Un profesor accede a una actividad LTI desde Moodle Workplace 4.5 y la app carga embebida en iframe sin errores en Chrome, Firefox, Safari y Safari iOS.
2. El profesor puede crear 5 grupos en una clase de 25 alumnos, distribuir manualmente o con "Distribuir", y guardar la sesión, en menos de 3 minutos sin formación previa.
3. Ningún acceso cruzado entre profesores: un teacher de un curso no ve sesiones de otro curso (verificado con tests RLS automatizados).
4. Latencia p95 de DnD < 200ms en optimistic update.
5. Si el profesor pierde conexión durante DnD, los cambios se encolan y se sincronizan al recuperar.
6. La app funciona correctamente en tablet (768px–1199px) con touch.
7. Internacionalización ca/es/en operativa, todos los strings traducidos.
8. WCAG 2.2 AA: navegación completa por teclado, contraste verificado, lector de pantalla anuncia estados.
9. Privacy API funcional: una solicitud de borrado desde Moodle resulta en cascada limpia en Supabase.
10. Cookies en iframe funcionando en Safari iOS (test crítico).

---

## 16. Riesgos a vigilar

| Riesgo | Mitigación |
|---|---|
| **Iframe en Safari iOS rompe** por SameSite cookies | Verificar desde día uno; tener fallback de redirect si hace falta |
| **Sync Moodle ↔ Supabase divergente** | Caches con TTL corto; refresh on-demand al detectar miss |
| **Right to be Forgotten** ejercido en Moodle no cascadea | Edge Function `gdpr_delete` invocada desde Privacy API obligatoria |
| **`vg_audit_log` crece sin control** | Cron `prune_audit_log` con retención 365 días |
| **Daltonismo** | Color nunca es el único diferenciador; nota numérica siempre presente |
| **Tema Boost de Moodle inyecta CSS** que rompe el iframe | Testar el iframe con CSP restrictiva del cliente |
| **Realtime ruidoso durante DnD** | NO suscribir clientes a `vg_panel_members`; solo eventos puntuales |
| **Centro objetivo prohíbe SaaS externo para datos de menores** | Detectar antes de comercializar; tener variante plugin nativo PHP en plan B |
| **DPA con Supabase no firmado a tiempo** | Bloqueante de despliegue producción |
| **Notas no devueltas a gradebook silenciosamente** | Monitorización de `vg_evaluations` con `published` y `moodle_pushed_at IS NULL`; alerta operacional |

---

## 17. Convenciones específicas del producto

> Convenciones generales (TS strict, naming, commits, prohibiciones de libs) en `SKILLS.md` §13.

- **Login admin** del panel de Supabase limitado a emails `@robotix.es`. El profesor real entra solo vía LTI launch.
- **Cliente Supabase server-side**: siempre `autoRefreshToken: false, persistSession: false` (estándar interno ROBOTIX).
- **Cliente Supabase browser-side**: `createBrowserClient` con sesión generada por LTI bridge.
- **Web Services Moodle**: nunca desde el cliente; siempre vía Edge Function o Server Action.
- **Locale BCP 47**: `ca-ES`, `es-ES`, `en-US` (no `ca` solo, rompe en algunos navegadores).
- **Strings hardcoded prohibidos**: todo texto de UI vía `useTranslations()` de `next-intl`.
- **Realtime**: no suscribir a `vg_panel_members` en cliente. Solo a eventos puntuales tipo "evaluación publicada" cuando estemos en co-teaching activo.
- **Tests E2E** (Playwright) obligatorios para: LTI launch, DnD sidebar→panel, DnD entre paneles, publicación de evaluación, devolución a gradebook.
- **Tests RLS** parte de la CI: matriz role × tabla × verbo.

---

*VisualGroups for Moodle Workplace 4.5 — by ROBOTIX. CLAUDE.md v3.0.*
*Ver también: `SKILLS.md` (rol del agente, principios, convenciones, identidad visual).*
````

---

## 18. Estado del prototipo Fase 0 (apéndice operativo)

> Anexo añadido durante la sesión de mayo 2026. Recoge el estado real del repo,
> decisiones tomadas durante el prototipo y siguientes pasos concretos. Útil
> para futuras sesiones que retomen el trabajo.

### 18.1 Lo que existe en el repo (Fase 0 cerrada)

Todo en `app/`, `components/`, `lib/`. Stack: **Next.js 15.5+, React 19, TS strict
(`noUncheckedIndexedAccess`), Tailwind v4 (`@theme` en CSS, sin
`tailwind.config.*`), Zustand 5, Zod, @dnd-kit**.

- **Layout 3 zonas responsive** (`app/grupos/GroupsView.tsx`): xl tres columnas;
  md/lg sidebar+canvas con detalle como drawer derecho; <sm tabs internas.
- **Canvas circular** (`components/canvas/PanelCard.tsx`): cada panel es un
  círculo grande con miembros distribuidos radialmente. Borde según media
  (semáforo). Anillo exterior según estado de evaluación. Centro = media
  efectiva. Empty state = `+` grande.
- **DnD** completo con `@dnd-kit` (Pointer + Keyboard sensors) +
  `AssignMenu` accesible (alternativa por menú con teclado).
- **Store Zustand** (`lib/store/use-grouping-store.ts`): única fuente de verdad
  del prototipo. Acciones para CRUD paneles, assign/move/unassign, evaluación
  con transiciones, override individual, save sesión simulado, toasts.
- **Mocks**: 28 alumnos, 2 paneles iniciales vacíos, 4 sesiones de historial
  (`lib/data/mock-*.ts`). Sin datos personales reales.
- **i18n**: claves centralizadas en `lib/i18n/strings.ts` con la convención de
  `next-intl` (`groups.canvas.empty_state`). Solo es-ES en Fase 0; migración
  a ca/es/en es swap del módulo.
- **Tokens** (`app/globals.css`):
  - Marca `--color-rbx-*` (paleta provisional Robotix).
  - Semáforo de notas `--color-score-{high,medium,low,empty}-{bg,border,text}`,
    expuesto via `SCORE_BAND_CLASSES` en `lib/domain/grading.ts` para uso
    consistente en avatar, dot, sidebar y detalle.

### 18.2 Decisiones técnicas no obvias (tomar nota)

- **Zustand v5 + selectors que devuelven arrays nuevos** rompen
  `useSyncExternalStore` con `getServerSnapshot should be cached` e infinite
  loop. Solución aplicada: `useShallow` envolviendo `selectUnassignedStudents`
  y `selectStudentsInPanel` en sidebar, `PanelCard` y `DetailPanel`. Si se
  añaden nuevos selectors que devuelven arrays/objetos derivados, envolverlos
  igual.
- **`<body suppressHydrationWarning>`** en `app/layout.tsx` para silenciar
  los atributos que inyectan extensiones (Bitdefender, Grammarly) antes de
  hidratar. Solo afecta al body; mismatches reales en hijos siguen avisando.
- **`tsconfig.json`** sin `baseUrl` (deprecado en TS 7) — los `paths` se
  resuelven relativos al `tsconfig.json` desde TS 4.1. No restaurar `baseUrl`.
- **Variables de entorno**: `NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (no `VITE_*`, no `ANON_KEY` clásico).
  La publishable key (`sb_publishable_*`) es la que va al cliente; el
  `service_role` jamás aquí.
- **`next@^15.5.0`** mínimo. Versiones `<15.1` no aceptan React 19 estable.
- **No instaladas todavía** (Fase 1+): `@supabase/ssr`, `@tanstack/react-query`,
  `next-intl`. Hay stubs y huecos preparados para encajarlas sin reescribir UI.

### 18.3 Errores conocidos / detalles cosméticos

- En el `DragOverlay`, el "ghost" sigue siendo el `StudentChip` lateral
  (rectangular). Si arrastras un dot circular desde dentro de un panel,
  estéticamente inconsistente pero funcional. Pendiente: hacer overlay
  contextual.
- Bitdefender Browser Extension genera ruido en consola dev (`bis_skin_checked`
  en cada `<div>`). No es nuestro código y no aparece en producción ni dentro
  de iframe LTI. Recomendado: dev en perfil sin extensiones o Firefox.

### 18.4 Cómo correr el prototipo

```bash
cd <repo>
npm install
npm run dev          # http://localhost:3000  (redirige a /grupos)
npm run typecheck    # tsc --noEmit
npm run build && npm run start
```

### 18.5 Siguiente paso bloqueante: conectar Supabase (decisión pendiente)

El `.env.local` ya contiene URL + publishable key de un proyecto Supabase real,
pero **el código sigue 100% en mocks**. Tres caminos posibles, ordenados de
menor a mayor coste, descritos para que la próxima sesión pueda elegir sin
reabrir el debate:

- **Opción A — Modo demo plano**: tabla única `vg_demo_sessions(id uuid, payload
  jsonb, created_at)`, RLS abierta a anon. Botones "Guardar / Cargar" vuelcan
  el store completo como JSON. Útil solo para enseñar persistencia. Va contra
  SKILLS §15 (auth.users como identidad), aceptable solo como demo.
- **Opción C — Cliente preparado**: instalar `@supabase/ssr`, reemplazar el
  stub `lib/supabase/client.ts` por cliente real, leer env vars. UI sigue con
  mocks. ~10 min. Solo cableado.
- **Opción B — Salto a Fase 1 parcial (recomendado cuando se decida avanzar)**:
  migraciones SQL completas (`vg_sessions`, `vg_panels`, `vg_panel_members`,
  `vg_evaluations`, `vg_individual_scores`, enums, vistas, triggers de §6.4),
  RLS por verbo y rol, Edge Function `dev_login` que firma un JWT mock con
  `moodle_userid: 1, moodle_role: teacher` para desarrollo sin LTI, y
  reemplazo del store por mutations de Tanstack Query con optimistic updates.
  El LTI real entra en una iteración posterior.

**Hasta que se decida**: NO conectar escrituras a Supabase. NO instalar
`@supabase/ssr` "por si acaso". NO crear migraciones especulativas.

### 18.6 Roadmap de implementación contra §14

Estado actual mapeado a las fases de §14:

- **Fase 1 (MVP)**: layout, sidebar, canvas, paneles, DnD, distribución
  aleatoria local, evaluación local, audit log → ✅ implementado contra mocks.
  Pendientes reales: plugin Moodle PHP, LTI launch + bridge, RLS, sync de
  caches Moodle, i18n real, Privacy API.
- **Fase 2 (evaluación + push gradebook)**: estados de evaluación con
  validaciones bloqueantes ya en UI; falta `publish_evaluation` y
  `push_to_gradebook` con LTI AGS, rúbricas, plantillas, export CSV, Moodle
  Events.
- **Fase 3 y 4**: nada empezado, según roadmap original.

*Apéndice 18 cerrado mayo 2026. Cuando algo de esto cambie, actualizar aquí.*


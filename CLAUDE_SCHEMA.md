# Database Schema — Gestión de Alumnos
# Para uso con Claude Code
# Generado desde: Supabase > SQL Editor > supabase_setup.sql

## Supabase Project
- **URL**: `https://<tu-proyecto>.supabase.co`  ← reemplaza con tu URL real
- **Anon key**: en `.env` como `VITE_SUPABASE_ANON_KEY`
- **Schema**: `public`

---

## Tablas

### `classes`
| column | type | nullable | default | constraint |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | — | |
| subject | text | YES | — | |
| teacher_id | uuid | YES | — | |
| created_at | timestamptz | YES | now() | |

---

### `students`
| column | type | nullable | default | constraint |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| full_name | text | NO | — | |
| initials | text | YES | — | |
| avatar_url | text | YES | — | |
| language | text | YES | 'es' | |
| performance_score | float8 | YES | — | |
| is_absent | bool | YES | false | |
| class_id | uuid | YES | — | FK → classes.id |
| created_at | timestamptz | YES | now() | |

**Datos de ejemplo cargados**: 30 alumnos en `class_id = 'aaaaaaaa-0000-0000-0000-000000000001'`

---

### `group_sessions`
| column | type | nullable | default | constraint |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | — | |
| class_id | uuid | YES | — | FK → classes.id |
| created_by | uuid | YES | — | |
| status | text | YES | 'active' | active \| archived \| locked |
| max_group_size | int4 | YES | 6 | |
| min_group_size | int4 | YES | 2 | |
| auto_seed | text | YES | — | |
| created_at | timestamptz | YES | now() | |
| locked_at | timestamptz | YES | — | |

**Sesión de ejemplo**: `id = 'bbbbbbbb-0000-0000-0000-000000000001'`

---

### `groups`
| column | type | nullable | default | constraint |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| session_id | uuid | YES | — | FK → group_sessions.id |
| name | text | NO | — | |
| color | text | YES | — | hex color |
| position_x | int4 | YES | 0 | canvas position |
| position_y | int4 | YES | 0 | canvas position |
| created_at | timestamptz | YES | now() | |

**5 grupos de ejemplo** con IDs `cccccccc-...-000000000001` a `...000000000005`

---

### `group_members`
| column | type | nullable | default | constraint |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| group_id | uuid | YES | — | FK → groups.id |
| student_id | uuid | YES | — | FK → students.id |
| is_locked | bool | YES | false | no se puede mover |
| is_absent | bool | YES | false | |
| moved_by | uuid | YES | — | auditoría |
| joined_at | timestamptz | YES | now() | |
| — | — | — | — | UNIQUE(group_id, student_id) |

---

### `evaluations`
| column | type | nullable | default | constraint |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| group_id | uuid | YES | — | FK → groups.id |
| session_id | uuid | YES | — | FK → group_sessions.id |
| group_score | float8 | YES | — | 0–10 |
| status | text | YES | 'pending' | pending \| draft \| published \| locked |
| evaluated_by | uuid | YES | — | |
| notes | text | YES | — | privado profesor |
| created_at | timestamptz | YES | now() | |
| published_at | timestamptz | YES | — | |

---

### `individual_scores`
| column | type | nullable | default | constraint |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| evaluation_id | uuid | YES | — | FK → evaluations.id |
| student_id | uuid | YES | — | FK → students.id |
| score_override | float8 | YES | — | sobreescribe nota grupal |
| notes | text | YES | — | |
| — | — | — | — | UNIQUE(evaluation_id, student_id) |

---

### `rubrics`
| column | type | nullable | default | constraint |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| title | text | NO | — | |
| created_by | uuid | YES | — | |
| is_template | bool | YES | false | |
| created_at | timestamptz | YES | now() | |

**3 plantillas cargadas**: 'Trabajo en equipo', 'Presentación oral', 'Proyecto escrito'

---

### `rubric_items`
| column | type | nullable | default | constraint |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| rubric_id | uuid | YES | — | FK → rubrics.id |
| criterion | text | NO | — | |
| max_score | float8 | NO | — | |
| weight | int4 | YES | 1 | |
| sort_order | int4 | YES | 0 | |

---

### `rubric_scores`
| column | type | nullable | default | constraint |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| rubric_item_id | uuid | YES | — | FK → rubric_items.id |
| evaluation_id | uuid | YES | — | FK → evaluations.id |
| student_id | uuid | YES | — | FK → students.id (null = nota grupal) |
| score | float8 | YES | — | |
| comment | text | YES | — | |

---

### `peer_reviews`
| column | type | nullable | default | constraint |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| evaluation_id | uuid | YES | — | FK → evaluations.id |
| reviewer_id | uuid | YES | — | FK → students.id |
| reviewee_id | uuid | YES | — | FK → students.id |
| score | float8 | YES | — | |
| comment | text | YES | — | |
| is_anonymous | bool | YES | true | |
| submitted_at | timestamptz | YES | now() | |

**Nota**: `reviewer_id = reviewee_id` → autoevaluación

---

### `attendance`
| column | type | nullable | default | constraint |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| session_id | uuid | YES | — | FK → group_sessions.id |
| student_id | uuid | YES | — | FK → students.id |
| status | text | YES | 'present' | present \| absent \| late \| justified |
| recorded_at | timestamptz | YES | now() | |
| recorded_by | uuid | YES | — | |

---

### `audit_log`
| column | type | nullable | default | constraint |
|--------|------|----------|---------|------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| entity_type | text | NO | — | 'group_member' \| 'evaluation' \| 'group' |
| entity_id | uuid | NO | — | |
| action | text | NO | — | 'added' \| 'moved' \| 'removed' \| 'published' |
| old_value | jsonb | YES | — | |
| new_value | jsonb | YES | — | |
| performed_by | uuid | YES | — | |
| created_at | timestamptz | YES | now() | |

---

## Relaciones (ERD resumido)

```
classes
  ├── students          (class_id → classes.id)
  └── group_sessions    (class_id → classes.id)
        └── groups      (session_id → group_sessions.id)
              ├── group_members   (group_id → groups.id)
              │     └── students  (student_id → students.id)
              └── evaluations     (group_id → groups.id)
                    ├── individual_scores  (evaluation_id → evaluations.id)
                    ├── rubric_scores      (evaluation_id → evaluations.id)
                    └── peer_reviews       (evaluation_id → evaluations.id)

rubrics
  └── rubric_items      (rubric_id → rubrics.id)
        └── rubric_scores (rubric_item_id → rubric_items.id)

attendance   → session_id, student_id
audit_log    → cualquier entidad vía entity_type + entity_id
```

---

## IDs fijos de datos de ejemplo

```
CLASS_ID    = 'aaaaaaaa-0000-0000-0000-000000000001'
SESSION_ID  = 'bbbbbbbb-0000-0000-0000-000000000001'
GROUP_1_ID  = 'cccccccc-0000-0000-0000-000000000001'
GROUP_2_ID  = 'cccccccc-0000-0000-0000-000000000002'
GROUP_3_ID  = 'cccccccc-0000-0000-0000-000000000003'
GROUP_4_ID  = 'cccccccc-0000-0000-0000-000000000004'
GROUP_5_ID  = 'cccccccc-0000-0000-0000-000000000005'
RUBRIC_TEAMWORK     = 'dddddddd-0000-0000-0000-000000000001'
RUBRIC_PRESENTATION = 'dddddddd-0000-0000-0000-000000000002'
RUBRIC_WRITTEN      = 'dddddddd-0000-0000-0000-000000000003'
```

---

## RLS (Row Level Security)

Estado actual: **políticas permisivas para desarrollo** — `anon` y `authenticated` tienen acceso total.

Antes de producción, reemplazar por políticas restrictivas basadas en `auth.uid()` y `class_id`.

---

## Queries más usadas

```sql
-- Todos los alumnos de una clase
SELECT * FROM students WHERE class_id = 'aaaaaaaa-0000-0000-0000-000000000001' ORDER BY full_name;

-- Alumnos con su grupo en una sesión concreta
SELECT s.*, gm.group_id, g.name as group_name
FROM students s
LEFT JOIN group_members gm ON gm.student_id = s.id
LEFT JOIN groups g ON g.id = gm.group_id AND g.session_id = 'bbbbbbbb-0000-0000-0000-000000000001'
WHERE s.class_id = 'aaaaaaaa-0000-0000-0000-000000000001'
ORDER BY s.full_name;

-- Media de notas por grupo en una sesión
SELECT g.name, ROUND(AVG(s.performance_score)::numeric, 2) as avg_score, COUNT(gm.student_id) as members
FROM groups g
JOIN group_members gm ON gm.group_id = g.id
JOIN students s ON s.id = gm.student_id
WHERE g.session_id = 'bbbbbbbb-0000-0000-0000-000000000001'
GROUP BY g.id, g.name
ORDER BY avg_score DESC;

-- Estado de evaluación por grupo
SELECT g.name, e.group_score, e.status, e.published_at
FROM groups g
LEFT JOIN evaluations e ON e.group_id = g.id AND e.session_id = g.session_id
WHERE g.session_id = 'bbbbbbbb-0000-0000-0000-000000000001';

-- Historial de movimientos de un alumno
SELECT al.action, al.old_value, al.new_value, al.created_at
FROM audit_log al
WHERE al.entity_type = 'group_member'
  AND al.new_value->>'student_id' = '<student_uuid>'
ORDER BY al.created_at DESC;
```

---

## Stack del proyecto

```
React 18 + Vite
@supabase/supabase-js ^2
Tailwind CSS (opcional)
```

## Variables de entorno (.env)

```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

## Archivos clave

```
src/
  lib/
    supabase.js   ← cliente de Supabase
    api.js        ← todas las queries centralizadas
  components/
    GroupCanvas/  ← canvas con círculos y drag & drop
    StudentList/  ← lista lateral de alumnos sin asignar
    DetailPanel/  ← panel lateral de detalle de grupo
    EvalBadge/    ← badge de estado de evaluación
  hooks/
    useSessionData.js  ← carga grupos + alumnos + evaluaciones
    useDragDrop.js     ← lógica de drag & drop
  pages/
    Groups.jsx         ← tab principal
    Evaluation.jsx     ← tab de evaluación
    History.jsx        ← tab de historial
```

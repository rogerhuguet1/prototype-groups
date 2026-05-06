/**
 * Strings centralizados (es-ES).
 *
 * Convención de claves alineada con `next-intl` (`groups.canvas.empty_state`)
 * para que la migración a i18n real (ca/es/en) sea sólo cambiar este módulo
 * por el provider de next-intl. Cero strings hardcoded en componentes.
 */
export const t = {
  app: {
    title: "VisualGroups",
    subtitle: "Gestión visual de grupos",
  },
  tabs: {
    groups: "Grupos",
    history: "Historial",
    config: "Configuración",
  },
  header: {
    save_session: "Guardar sesión",
    session_label: "Sesión",
  },
  sidebar: {
    title: "Alumnos sin asignar",
    search_placeholder: "Buscar por nombre…",
    counter: (n: number) => `${n} sin asignar`,
    counter_all_assigned: "Todos asignados",
    empty_search: (q: string) => `Sin coincidencias para "${q}"`,
    empty_all_assigned: "Todos los alumnos están asignados",
    return_button: "Devolver a sin asignar",
    assign_to: "Asignar a…",
  },
  canvas: {
    title: "Grupos",
    empty_no_groups: "Aún no has creado grupos. Pulsa + para empezar o usa Distribuir.",
    create_group: "Crear grupo",
    distribute: "Distribuir",
    clear_all: "Limpiar grupos",
    panel_capacity: (used: number, cap: number) => `${used}/${cap}`,
    panel_average_label: "Media",
    empty_panel_drop_hint: "Arrastra alumnos aquí",
    full_panel: "Lleno",
  },
  detail: {
    title: "Detalle del grupo",
    no_selection: "Selecciona un grupo para ver su detalle.",
    members_label: "Miembros",
    average_label: "Media efectiva",
    base_average_label: "Nivel medio (orientativo)",
    group_score_label: "Nota grupal",
    individual_label: "Notas individuales",
    individual_hint: "Si dejas la nota individual vacía, hereda la nota grupal.",
    save_changes: "Guardar cambios",
    rename: "Renombrar grupo",
    delete: "Eliminar grupo",
    eval_state_label: "Estado de evaluación",
    publish: "Publicar",
    to_draft: "Pasar a borrador",
    lock: "Bloquear",
    overridden_badge: "Ajustada",
    restore_group_score: "Restaurar nota grupal",
  },
  config: {
    title: "Configuración de la sesión",
    session_name_label: "Nombre de la sesión",
    min_size_label: "Tamaño mínimo recomendado",
    max_size_label: "Tamaño máximo de grupo",
    save: "Guardar configuración",
    note_min_warning: "Algunos grupos no llegan al tamaño mínimo recomendado.",
  },
  history: {
    title: "Historial de sesiones",
    empty: "Aún no tienes sesiones archivadas.",
    column_name: "Sesión",
    column_date: "Fecha",
    column_groups: "Grupos",
    column_students: "Alumnos",
    column_status: "Estado",
    status: {
      active: "Activa",
      archived: "Archivada",
      locked: "Bloqueada",
    },
  },
  toast: {
    saved: "Sesión guardada (simulado).",
    panel_full: (name: string) => `El grupo "${name}" está lleno.`,
    student_assigned: (student: string, panel: string) =>
      `${student} asignado a ${panel}.`,
    student_unassigned: (student: string) => `${student} vuelto a sin asignar.`,
    student_moved: (student: string, panel: string) =>
      `${student} movido a ${panel}.`,
    panel_created: (name: string) => `Grupo "${name}" creado.`,
    panel_renamed: (name: string) => `Grupo renombrado como "${name}".`,
    panel_deleted: (name: string) => `Grupo "${name}" eliminado.`,
    panels_cleared: "Grupos limpiados. Alumnos vueltos a sin asignar.",
    distributed: (n: number) => `${n} alumnos distribuidos.`,
    distribute_leftover: (n: number) =>
      `${n} alumnos no han cabido (capacidad insuficiente).`,
    distribute_no_panels:
      "Necesitas al menos un grupo creado para distribuir alumnos.",
    score_invalid: "La nota debe estar entre 0 y 10.",
    eval_state_changed: (label: string) => `Estado: ${label}.`,
    eval_blocked_no_members:
      "No puedes publicar un grupo sin alumnos.",
    eval_blocked_no_score:
      "Asigna nota grupal o todas las individuales antes de publicar.",
    config_saved: "Configuración actualizada.",
  },
  confirm: {
    delete_panel_title: "Eliminar grupo",
    delete_panel_body: (name: string) =>
      `¿Seguro que quieres eliminar "${name}"? Sus alumnos volverán a la lista de sin asignar.`,
    clear_all_title: "Limpiar todos los grupos",
    clear_all_body:
      "Los grupos seguirán existiendo, pero todos los alumnos volverán a sin asignar. ¿Continuar?",
    cancel: "Cancelar",
    confirm: "Confirmar",
  },
  a11y: {
    drag_handle: (name: string) => `Arrastrar ${name}`,
    score_input: (name: string) => `Nota de ${name}`,
    select_panel: (name: string) => `Seleccionar grupo ${name}`,
    close: "Cerrar",
  },
} as const;

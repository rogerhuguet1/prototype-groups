"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CLASS_ID, SESSION_ID } from "@/lib/constants";
import { listStudentsByClass } from "@/lib/data/students";
import {
  createGroup,
  deleteGroup,
  listGroupsBySession,
  renameGroup,
} from "@/lib/data/groups";
import {
  assignStudentToGroup,
  bulkAssignStudents,
  listMembersByGroupIds,
  unassignStudent,
} from "@/lib/data/group-members";
import { getSessionById } from "@/lib/data/sessions";
import {
  ensureEvaluation,
  listEvaluationsBySession,
  setEvaluationStatus,
  setGroupScore,
} from "@/lib/data/evaluations";
import {
  deleteIndividualOverride,
  listScoresByEvalIds,
  upsertIndividualOverride,
} from "@/lib/data/individual-scores";
import { archiveSession } from "@/lib/data/snapshot";
import type {
  Evaluation,
  EvaluationStatus,
  Group,
  GroupMember,
  GroupSession,
  IndividualScore,
  Student,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PromptDialog } from "@/components/ui/PromptDialog";
import { useToast } from "@/components/ui/Toast";
import { Sidebar } from "@/components/features/Sidebar";
import { GroupCard } from "@/components/features/GroupCard";
import { DetailPanel } from "@/components/features/DetailPanel";
import { StudentChip } from "@/components/features/StudentChip";

interface Data {
  students: Student[];
  groups: Group[];
  members: GroupMember[];
  session: GroupSession | null;
  evaluations: Evaluation[];
  scores: IndividualScore[];
}

type State =
  | { status: "loading" }
  | { status: "ok"; data: Data }
  | { status: "error"; message: string };

const FALLBACK_MAX_GROUP_SIZE = 6;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

interface DialogState {
  kind: "create" | "rename" | "delete" | "save";
  groupId?: string;
  current?: string;
}

function planDistribution(args: {
  unassignedStudents: readonly Student[];
  groups: readonly Group[];
  currentMembers: readonly GroupMember[];
  maxGroupSize: number;
}): {
  assignments: Array<{ studentId: string; groupId: string }>;
  leftover: number;
} {
  const counts = new Map<string, number>();
  for (const g of args.groups) counts.set(g.id, 0);
  for (const m of args.currentMembers) {
    if (m.group_id && counts.has(m.group_id)) {
      counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
    }
  }

  const sorted = [...args.unassignedStudents].sort((a, b) =>
    a.full_name.localeCompare(b.full_name),
  );

  const assignments: Array<{ studentId: string; groupId: string }> = [];
  let leftover = 0;

  for (const student of sorted) {
    let bestId: string | null = null;
    let bestCount = Number.POSITIVE_INFINITY;
    for (const g of args.groups) {
      const c = counts.get(g.id) ?? 0;
      if (c >= args.maxGroupSize) continue;
      if (c < bestCount) {
        bestCount = c;
        bestId = g.id;
      }
    }
    if (bestId === null) {
      leftover++;
      continue;
    }
    assignments.push({ studentId: student.id, groupId: bestId });
    counts.set(bestId, (counts.get(bestId) ?? 0) + 1);
  }

  return { assignments, leftover };
}

export default function HomePage() {
  const toast = useToast();
  const [state, setState] = useState<State>({ status: "loading" });
  const [mutating, setMutating] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [activeDragStudentId, setActiveDragStudentId] = useState<string | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const loadAll = useCallback(async () => {
    try {
      const [students, groups, session, evaluations] = await Promise.all([
        listStudentsByClass(CLASS_ID),
        listGroupsBySession(SESSION_ID),
        getSessionById(SESSION_ID),
        listEvaluationsBySession(SESSION_ID),
      ]);
      const [members, scores] = await Promise.all([
        listMembersByGroupIds(groups.map((g) => g.id)),
        listScoresByEvalIds(evaluations.map((e) => e.id)),
      ]);
      setState({
        status: "ok",
        data: { students, groups, members, session, evaluations, scores },
      });
    } catch (err) {
      setState({ status: "error", message: errorMessage(err) });
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  if (state.status === "loading") {
    return <SkeletonPage />;
  }
  if (state.status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-800">
          <p className="font-semibold">No se pudieron cargar los datos</p>
          <p className="mt-1">{state.message}</p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setState({ status: "loading" });
              void loadAll();
            }}
            className="mt-3"
          >
            Reintentar
          </Button>
        </div>
      </main>
    );
  }

  const { students, groups, members, session, evaluations, scores } = state.data;
  const groupIds = groups.map((g) => g.id);
  const maxGroupSize = session?.max_group_size ?? FALLBACK_MAX_GROUP_SIZE;

  const evaluationByGroupId = new Map<string, Evaluation>();
  for (const e of evaluations) {
    if (e.group_id) evaluationByGroupId.set(e.group_id, e);
  }

  const overridesByEvalId = new Map<string, Map<string, number>>();
  for (const s of scores) {
    if (!s.evaluation_id || !s.student_id || s.score_override === null) continue;
    let inner = overridesByEvalId.get(s.evaluation_id);
    if (!inner) {
      inner = new Map();
      overridesByEvalId.set(s.evaluation_id, inner);
    }
    inner.set(s.student_id, s.score_override);
  }

  const assignedIds = new Set(
    members.map((m) => m.student_id).filter((id): id is string => id !== null),
  );
  const unassigned = students.filter((s) => !assignedIds.has(s.id));

  const studentsById = new Map(students.map((s) => [s.id, s]));
  const groupsWithMembers = groups.map((group) => ({
    group,
    members: members
      .filter((m) => m.group_id === group.id)
      .map((m) => (m.student_id ? studentsById.get(m.student_id) : undefined))
      .filter((s): s is Student => s !== undefined),
  }));

  async function reloadMembers() {
    const fresh = await listMembersByGroupIds(groupIds);
    setState((prev) =>
      prev.status === "ok"
        ? { status: "ok", data: { ...prev.data, members: fresh } }
        : prev,
    );
  }

  async function reloadGroupsAndMembers() {
    const fresh = await listGroupsBySession(SESSION_ID);
    const freshMembers = await listMembersByGroupIds(fresh.map((g) => g.id));
    const freshEvals = await listEvaluationsBySession(SESSION_ID);
    const freshScores = await listScoresByEvalIds(freshEvals.map((e) => e.id));
    setState((prev) =>
      prev.status === "ok"
        ? {
            status: "ok",
            data: {
              ...prev.data,
              groups: fresh,
              members: freshMembers,
              evaluations: freshEvals,
              scores: freshScores,
            },
          }
        : prev,
    );
  }

  async function reloadEvaluations() {
    const evs = await listEvaluationsBySession(SESSION_ID);
    const sc = await listScoresByEvalIds(evs.map((e) => e.id));
    setState((prev) =>
      prev.status === "ok"
        ? { status: "ok", data: { ...prev.data, evaluations: evs, scores: sc } }
        : prev,
    );
  }

  async function withMutation(fn: () => Promise<void>) {
    setMutating(true);
    try {
      await fn();
    } catch (err) {
      toast.push("error", errorMessage(err));
    } finally {
      setMutating(false);
    }
  }

  function assign(studentId: string, groupId: string) {
    return withMutation(async () => {
      await assignStudentToGroup(studentId, groupId, groupIds);
      await reloadMembers();
    });
  }

  function unassign(studentId: string) {
    return withMutation(async () => {
      await unassignStudent(studentId, groupIds);
      await reloadMembers();
    });
  }

  function handleDistribute() {
    if (groups.length === 0) {
      toast.push("warning", "Necesitas al menos un grupo para distribuir.");
      return;
    }
    if (unassigned.length === 0) {
      toast.push("info", "Todos los alumnos están asignados.");
      return;
    }
    const plan = planDistribution({
      unassignedStudents: unassigned,
      groups,
      currentMembers: members,
      maxGroupSize,
    });
    if (plan.assignments.length === 0) {
      toast.push(
        "warning",
        `Los grupos están llenos. ${plan.leftover} alumnos no caben.`,
      );
      return;
    }
    return withMutation(async () => {
      await bulkAssignStudents(plan.assignments);
      await reloadMembers();
      toast.push(
        "success",
        plan.leftover > 0
          ? `${plan.assignments.length} asignados. ${plan.leftover} no caben.`
          : `${plan.assignments.length} alumnos asignados.`,
      );
    });
  }

  function handleSetGroupScore(groupId: string, value: number | null) {
    return withMutation(async () => {
      await setGroupScore(groupId, SESSION_ID, value);
      await reloadEvaluations();
    });
  }

  function handleSetOverride(
    groupId: string,
    studentId: string,
    value: number | null,
  ) {
    return withMutation(async () => {
      const existing = evaluationByGroupId.get(groupId);
      if (value === null) {
        if (!existing) return;
        await deleteIndividualOverride(existing.id, studentId);
      } else {
        const evaluationId = existing
          ? existing.id
          : await ensureEvaluation(groupId, SESSION_ID);
        await upsertIndividualOverride(evaluationId, studentId, value);
      }
      await reloadEvaluations();
    });
  }

  function handleSetStatus(evaluationId: string, next: EvaluationStatus) {
    return withMutation(async () => {
      await setEvaluationStatus(evaluationId, next);
      await reloadEvaluations();
      toast.push("info", `Estado: ${next}.`);
    });
  }

  // ---- Drag & Drop ----
  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    if (id.startsWith("student:")) {
      setActiveDragStudentId(id.slice("student:".length));
    }
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveDragStudentId(null);
    const overId = e.over?.id ? String(e.over.id) : null;
    const activeId = String(e.active.id);
    if (!overId || !activeId.startsWith("student:")) return;
    const studentId = activeId.slice("student:".length);

    if (overId === "unassigned") {
      void unassign(studentId);
      return;
    }
    if (overId.startsWith("panel:")) {
      const groupId = overId.slice("panel:".length);
      const targetMembers = members.filter((m) => m.group_id === groupId);
      if (targetMembers.some((m) => m.student_id === studentId)) {
        return; // ya está en este grupo, no-op
      }
      if (targetMembers.length >= maxGroupSize) {
        const target = groups.find((g) => g.id === groupId);
        toast.push(
          "error",
          `El grupo "${target?.name ?? "?"}" está lleno (${maxGroupSize}).`,
        );
        return;
      }
      void assign(studentId, groupId);
    }
  }

  // ---- Diálogos ----
  function openCreate() {
    setDialog({ kind: "create" });
  }
  function openRename(groupId: string, current: string) {
    setDialog({ kind: "rename", groupId, current });
  }
  function openDelete(groupId: string) {
    setDialog({ kind: "delete", groupId });
  }
  function openSave() {
    setDialog({ kind: "save" });
  }
  function closeDialog() {
    setDialog(null);
  }

  function submitDialog(value: string) {
    if (!dialog) return;
    const kind = dialog.kind;
    closeDialog();
    if (kind === "create") {
      return withMutation(async () => {
        await createGroup(SESSION_ID, value);
        await reloadGroupsAndMembers();
        toast.push("success", `Grupo "${value}" creado.`);
      });
    }
    if (kind === "rename" && dialog.groupId) {
      const id = dialog.groupId;
      return withMutation(async () => {
        await renameGroup(id, value);
        await reloadGroupsAndMembers();
        toast.push("success", `Renombrado a "${value}".`);
      });
    }
    if (kind === "save") {
      return withMutation(async () => {
        await archiveSession(SESSION_ID, value);
        toast.push("success", `Sesión guardada como "${value}".`);
      });
    }
  }

  function confirmDelete() {
    const groupId = dialog?.kind === "delete" ? dialog.groupId : undefined;
    if (!groupId) return;
    closeDialog();
    return withMutation(async () => {
      await deleteGroup(groupId);
      if (selectedGroupId === groupId) setSelectedGroupId(null);
      await reloadGroupsAndMembers();
      toast.push("success", "Grupo eliminado.");
    });
  }

  const selected = selectedGroupId
    ? (groupsWithMembers.find((g) => g.group.id === selectedGroupId) ?? null)
    : null;
  const selectedEval = selected
    ? evaluationByGroupId.get(selected.group.id)
    : undefined;
  const selectedOverrides = selectedEval
    ? overridesByEvalId.get(selectedEval.id)
    : undefined;

  const today = new Date().toISOString().slice(0, 10);
  const saveDefault = `${session?.name ?? "Sesión"} · ${today}`;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveDragStudentId(null)}
    >
      <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <header className="mx-auto mb-4 flex max-w-7xl flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              VisualGroups
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {session?.name ?? "Grupos"}
            </h1>
            <nav className="mt-1 text-xs text-slate-500">
              <span className="font-medium text-slate-700">Grupos</span>
              <span className="mx-1">·</span>
              <Link href="/historial" className="hover:underline">
                Historial
              </Link>
              <span className="mx-1">·</span>
              <Link href="/configuracion" className="hover:underline">
                Configuración
              </Link>
            </nav>
            <p className="mt-1 text-sm text-slate-600">
              {students.length} alumnos · {groups.length} grupos ·{" "}
              {members.length} asignaciones · máx {maxGroupSize}/grupo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDistribute}
              disabled={mutating || groups.length === 0}
            >
              Distribuir
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={openCreate}
              disabled={mutating}
            >
              + Crear grupo
            </Button>
            <Button
              size="sm"
              variant="success"
              onClick={openSave}
              disabled={mutating}
            >
              Guardar sesión
            </Button>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_340px]">
          {/* Sidebar */}
          <div className="md:sticky md:top-4 md:h-[calc(100vh-7rem)]">
            <Sidebar
              students={unassigned}
              search={search}
              onSearchChange={setSearch}
            />
          </div>

          {/* Canvas */}
          <section>
            {groups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                No hay grupos. Pulsa "+ Crear grupo" para empezar.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                {groupsWithMembers.map(({ group, members: gms }) => {
                  const evaluation = evaluationByGroupId.get(group.id);
                  const overrides =
                    evaluation && overridesByEvalId.get(evaluation.id);
                  return (
                    <GroupCard
                      key={group.id}
                      group={group}
                      members={gms}
                      evaluation={evaluation}
                      overrides={overrides}
                      maxGroupSize={maxGroupSize}
                      selected={selectedGroupId === group.id}
                      onSelect={() =>
                        setSelectedGroupId((cur) =>
                          cur === group.id ? null : group.id,
                        )
                      }
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Detail panel */}
          <div className="xl:sticky xl:top-4 xl:h-[calc(100vh-7rem)]">
            {selected ? (
              <DetailPanel
                group={selected.group}
                members={selected.members}
                evaluation={selectedEval}
                overrides={selectedOverrides}
                maxGroupSize={maxGroupSize}
                mutating={mutating}
                onRename={() => openRename(selected.group.id, selected.group.name)}
                onDelete={() => openDelete(selected.group.id)}
                onSetGroupScore={(v) => handleSetGroupScore(selected.group.id, v)}
                onSetOverride={(studentId, v) =>
                  handleSetOverride(selected.group.id, studentId, v)
                }
                onChangeStatus={(next) =>
                  selectedEval && handleSetStatus(selectedEval.id, next)
                }
                onUnassign={(studentId) => unassign(studentId)}
              />
            ) : (
              <aside className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                Selecciona un grupo para ver su detalle.
              </aside>
            )}
          </div>
        </div>
      </main>

      <DragOverlay dropAnimation={null}>
        {activeDragStudentId
          ? (() => {
              const s = studentsById.get(activeDragStudentId);
              return s ? <StudentChip student={s} mode="static" /> : null;
            })()
          : null}
      </DragOverlay>

      {/* Diálogos */}
      <PromptDialog
        open={dialog?.kind === "create"}
        title="Crear grupo"
        label="Nombre del grupo"
        defaultValue=""
        confirmLabel="Crear"
        onSubmit={submitDialog}
        onCancel={closeDialog}
      />
      <PromptDialog
        open={dialog?.kind === "rename"}
        title="Renombrar grupo"
        label="Nuevo nombre"
        defaultValue={dialog?.kind === "rename" ? (dialog.current ?? "") : ""}
        confirmLabel="Guardar"
        onSubmit={submitDialog}
        onCancel={closeDialog}
      />
      <PromptDialog
        open={dialog?.kind === "save"}
        title="Guardar sesión"
        label="Nombre del snapshot"
        defaultValue={saveDefault}
        confirmLabel="Guardar"
        onSubmit={submitDialog}
        onCancel={closeDialog}
      />
      <ConfirmDialog
        open={dialog?.kind === "delete"}
        title="Eliminar grupo"
        body="¿Seguro? Sus miembros volverán a la lista de sin asignar y se borrará la evaluación asociada."
        destructive
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={closeDialog}
      />
    </DndContext>
  );
}

function SkeletonPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto mb-4 max-w-7xl">
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="mt-2 h-7 w-64 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-48 rounded bg-slate-200" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_340px]">
        <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>
        <div className="hidden h-96 animate-pulse rounded-xl bg-slate-200 xl:block" />
      </div>
    </main>
  );
}

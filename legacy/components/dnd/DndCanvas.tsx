"use client";

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
import { useState, type ReactNode } from "react";
import {
  selectStudentById,
  useGroupingStore,
} from "@/lib/store/use-grouping-store";
import { StudentChip } from "@/components/sidebar/StudentChip";

/**
 * Provee el contexto DnD a sidebar + canvas.
 *
 * Convención de IDs:
 *   Draggable: `student:<studentId>`
 *   Droppable: `panel:<panelId>` o el literal `unassigned`
 */
export function DndCanvas({ children }: { children: ReactNode }) {
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const assign = useGroupingStore((s) => s.assignStudent);
  const move = useGroupingStore((s) => s.moveStudent);
  const unassign = useGroupingStore((s) => s.unassignStudent);
  const memberships = useGroupingStore((s) => s.memberships);

  const activeStudent = useGroupingStore((s) =>
    activeStudentId ? selectStudentById(s, activeStudentId) : undefined,
  );

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    if (id.startsWith("student:")) {
      setActiveStudentId(id.slice("student:".length));
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveStudentId(null);
    const overId = e.over?.id ? String(e.over.id) : null;
    const activeId = String(e.active.id);
    if (!overId || !activeId.startsWith("student:")) return;
    const studentId = activeId.slice("student:".length);

    if (overId === "unassigned") {
      unassign(studentId);
      return;
    }
    if (overId.startsWith("panel:")) {
      const panelId = overId.slice("panel:".length);
      const inAnyPanel = memberships.find((m) => m.studentId === studentId);
      if (inAnyPanel) {
        move(studentId, panelId);
      } else {
        assign(studentId, panelId);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveStudentId(null)}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeStudent ? (
          <div className="rotate-1">
            <StudentChip student={activeStudent} dragging mode="static" />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

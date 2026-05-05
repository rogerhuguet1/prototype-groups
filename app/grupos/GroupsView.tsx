"use client";

import { useEffect, useState } from "react";
import { DndCanvas } from "@/components/dnd/DndCanvas";
import { StudentSidebar } from "@/components/sidebar/StudentSidebar";
import { GroupCanvas } from "@/components/canvas/GroupCanvas";
import { DetailPanel } from "@/components/detail/DetailPanel";
import { useGroupingStore } from "@/lib/store/use-grouping-store";
import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/utils/cx";

type MobileTab = "sidebar" | "canvas" | "detail";

/**
 * Vista de Grupos: 3 zonas con responsive.
 *
 *   ≥ xl (1280+): tres columnas (sidebar 280 / canvas / detail 360).
 *   md - xl:      sidebar + canvas; detail abre como overlay desde la derecha
 *                 cuando hay grupo seleccionado.
 *   < md:         tabs internas (Sin asignar / Grupos / Detalle).
 */
export function GroupsView() {
  const selectedPanelId = useGroupingStore((s) => s.selectedPanelId);
  const select = useGroupingStore((s) => s.selectPanel);

  const [mobileTab, setMobileTab] = useState<MobileTab>("canvas");
  const [detailOverlayOpen, setDetailOverlayOpen] = useState(false);

  // En tablet, abrir el drawer cuando se selecciona un grupo.
  useEffect(() => {
    if (selectedPanelId) {
      setDetailOverlayOpen(true);
      setMobileTab("detail");
    }
  }, [selectedPanelId]);

  return (
    <DndCanvas>
      {/* Tabs internas — sólo móvil */}
      <div className="mb-3 flex gap-1 rounded-lg border border-rbx-border bg-white p-1 sm:hidden">
        {(["sidebar", "canvas", "detail"] as MobileTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={cx(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              mobileTab === tab
                ? "bg-rbx-primary text-white"
                : "text-rbx-text-secondary hover:bg-rbx-surface-muted",
            )}
          >
            {tab === "sidebar" && "Alumnos"}
            {tab === "canvas" && "Grupos"}
            {tab === "detail" && "Detalle"}
          </button>
        ))}
      </div>

      <div
        className={cx(
          "grid gap-3",
          // móvil: una columna; tablet: 2; desktop: 3
          "grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_360px]",
          "h-[calc(100vh-200px)] min-h-[520px]",
        )}
      >
        <div className={cx(mobileTab === "sidebar" ? "block" : "hidden", "sm:block")}>
          <StudentSidebar />
        </div>

        <div className={cx(mobileTab === "canvas" ? "block" : "hidden", "sm:block")}>
          <GroupCanvas />
        </div>

        {/* Detail siempre visible en xl */}
        <div
          className={cx(
            "hidden",
            "xl:block",
            mobileTab === "detail" && "block",
          )}
        >
          <DetailPanel />
        </div>
      </div>

      {/* Drawer detalle en md..xl-1 */}
      {detailOverlayOpen && selectedPanelId && (
        <div
          className="fixed inset-0 z-40 hidden md:block xl:hidden"
          aria-hidden={!detailOverlayOpen}
        >
          <div
            className="absolute inset-0 bg-rbx-text-primary/30"
            onClick={() => {
              setDetailOverlayOpen(false);
              select(null);
            }}
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-[420px] p-3">
            <div className="flex-1">
              <DetailPanel
                asOverlay
                onClose={() => {
                  setDetailOverlayOpen(false);
                  select(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* En móvil, si estamos en pestaña detalle pero no hay selección, ofrecer volver */}
      {mobileTab === "detail" && !selectedPanelId && (
        <div className="mt-3 sm:hidden">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => setMobileTab("canvas")}
          >
            Selecciona un grupo en la pestaña Grupos
          </Button>
        </div>
      )}
    </DndCanvas>
  );
}

import { BAND_LABELS, BAND_STYLES } from "@/lib/utils/progress-cells";
import { cn } from "@/lib/utils/cn";

const ITEMS = [
  { key: "completada", label: "Completada (sin calificación)" },
  { key: "insuficiente", band: "insuficiente" as const },
  { key: "suficiente", band: "suficiente" as const },
  { key: "bien", band: "bien" as const },
  { key: "notable", band: "notable" as const },
  { key: "excelente", band: "excelente" as const },
] as const;

export function ScoreLegend({ updatedAt }: { updatedAt: string }) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="flex items-center justify-between gap-6 px-8 py-3">
        <ul className="flex flex-wrap items-center gap-2">
          {ITEMS.map((item) => {
            if ("band" in item) {
              const styles = BAND_STYLES[item.band];
              return (
                <li
                  key={item.key}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border",
                    styles.bg,
                    styles.text,
                    styles.border,
                  )}
                >
                  <span className="text-[11px]">{BAND_LABELS[item.band]}</span>
                </li>
              );
            }
            return (
              <li
                key={item.key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border bg-slate-200 text-slate-700 border-slate-300"
              >
                <span className="text-[11px]">{item.label}</span>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-slate-500 shrink-0 hidden md:block">
          Última actualización {updatedAt}
        </p>
      </div>
    </div>
  );
}

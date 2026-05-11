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
    <div className="bg-c360-bg">
      <div className="px-8 pb-2">
        <ul className="flex flex-wrap items-center gap-6">
          {ITEMS.map((item) => {
            if ("band" in item) {
              const styles = BAND_STYLES[item.band];
              return (
                <li
                  key={item.key}
                  className="inline-flex items-center gap-2 text-[13px] font-medium text-c360-text"
                >
                  <span
                    className={cn(
                      "inline-block size-4 rounded-[3px]",
                      styles.bg,
                    )}
                    aria-hidden
                  />
                  {BAND_LABELS[item.band]}
                </li>
              );
            }
            return (
              <li
                key={item.key}
                className="inline-flex items-center gap-2 text-[13px] font-medium text-c360-text"
              >
                <span
                  className="inline-block size-4 rounded-[3px] bg-grade-completed"
                  aria-hidden
                />
                {item.label}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="px-8 pb-4">
        <p className="text-xs italic text-c360-text-muted">
          Última actualización {updatedAt}. Próximas actualizaciones de la
          tabla los domingos a las 23:59.
        </p>
      </div>
    </div>
  );
}

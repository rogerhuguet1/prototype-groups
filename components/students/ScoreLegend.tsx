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
    <div className="bg-white">
      <div className="px-6 pb-2">
        <ul className="flex flex-wrap items-center gap-1.5">
          {ITEMS.map((item) => {
            if ("band" in item) {
              const styles = BAND_STYLES[item.band];
              return (
                <li
                  key={item.key}
                  className={cn(
                    "inline-flex items-center px-2 py-[3px] rounded text-[10px] font-semibold leading-none",
                    styles.bg,
                    styles.text,
                  )}
                >
                  {BAND_LABELS[item.band]}
                </li>
              );
            }
            return (
              <li
                key={item.key}
                className="inline-flex items-center px-2 py-[3px] rounded text-[10px] font-semibold leading-none bg-slate-300 text-slate-700"
              >
                {item.label}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="px-6 pb-3">
        <p className="text-[10px] italic text-slate-500">
          Última actualización {updatedAt}. Próximas actualizaciones de la
          tabla los domingos a las 23:59.
        </p>
      </div>
    </div>
  );
}

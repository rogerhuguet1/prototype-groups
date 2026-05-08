import { BAND_LABELS, BAND_STYLES } from "@/lib/utils/progress-cells";
import { cn } from "@/lib/utils/cn";

const ITEMS = [
  { key: "completada", label: "Completado (sin calificación)" },
  { key: "reintento", label: "Al menos un reintento" },
  { key: "insuficiente", band: "insuficiente" as const },
  { key: "suficiente", band: "suficiente" as const },
  { key: "bien", band: "bien" as const },
  { key: "notable", band: "notable" as const },
  { key: "excelente", band: "excelente" as const },
] as const;

export function ScoreLegend({ updatedAt }: { updatedAt: string }) {
  return (
    <div className="bg-white">
      <div className="mx-[20px] border-t border-[#e0e2e5] pt-[35px] pb-[27px]">
        <ul className="flex flex-wrap items-center gap-[28px]">
          {ITEMS.map((item) => {
            if ("band" in item) {
              const styles = BAND_STYLES[item.band];
              return (
                <li
                  key={item.key}
                  className="inline-flex items-center gap-[5px] text-[12px] text-[#293038]"
                >
                  <span
                    className={cn("size-[10px] rounded-[2px]", styles.bg)}
                    aria-hidden
                  />
                  <span>{BAND_LABELS[item.band]}</span>
                </li>
              );
            }
            return (
              <li
                key={item.key}
                className="inline-flex items-center gap-[5px] text-[12px] text-[#293038]"
              >
                <span
                  className={cn(
                    "grid size-[10px] place-items-center rounded-[2px] text-[9px] leading-none",
                    item.key === "reintento"
                      ? "bg-black text-white"
                      : "bg-[#dfe5eb] text-[#111]",
                  )}
                  aria-hidden
                >
                  {item.key === "reintento" ? "•" : "✓"}
                </span>
                {item.label}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mx-[35px] pb-[10px]">
        <p className="text-[13px] text-[#66717d]">
          Última actualización: {updatedAt}. Próxima actualización en 30 minutos.
        </p>
        <p className="mt-[5px] text-[10px] text-[#66717d]">
          *Las correcciones de código pueden demorarse en aparecer en la tabla de seguimiento.
        </p>
      </div>
    </div>
  );
}

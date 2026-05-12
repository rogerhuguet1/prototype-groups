import { z } from "zod";
import { MAX_PODS } from "@/lib/pods/pod-emojis";

export const GROUPING_MODES = [
  "random",
  "mixed",
  "leveled",
  "by-progress",
] as const;
export type GroupingMode = (typeof GROUPING_MODES)[number];

// Validacion laxa: min/max por pod son recomendados, no se imponen. Solo
// limitaciones duras: enteros >= 1, robotCount <= MAX_PODS, robotCount <=
// presentCount. Si la combinacion queda fuera del rango recomendado 2-4, los
// algoritmos de reparto se adaptan (balanceado en vez de error).
export const groupingSchema = z
  .object({
    mode: z.enum(GROUPING_MODES),
    presentCount: z
      .number()
      .int("Debe ser un número entero")
      .min(1, "Debe haber al menos 1 alumno"),
    robotCount: z
      .number()
      .int("Debe ser un número entero")
      .min(1, "Debe haber al menos 1 grupo")
      .max(MAX_PODS, `Máximo ${MAX_PODS} grupos`),
  })
  .refine((d) => d.robotCount <= d.presentCount, {
    message: "No puede haber más grupos que alumnos",
    path: ["robotCount"],
  });

export type GroupingInput = z.infer<typeof groupingSchema>;

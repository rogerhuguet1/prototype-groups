import { z } from "zod";
import {
  DEFAULT_MAX_PER_POD,
  DEFAULT_MIN_PER_POD,
  distributionErrorMessage,
} from "@/lib/pods/create-pods";
import { MAX_PODS } from "@/lib/pods/pod-emojis";

export const GROUPING_MODES = [
  "random",
  "mixed",
  "leveled",
  "by-progress",
] as const;
export type GroupingMode = (typeof GROUPING_MODES)[number];

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
  })
  .superRefine((d, ctx) => {
    if (
      d.presentCount < d.robotCount * DEFAULT_MIN_PER_POD ||
      d.presentCount > d.robotCount * DEFAULT_MAX_PER_POD
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["presentCount"],
        message: distributionErrorMessage(
          d.presentCount,
          d.robotCount,
          DEFAULT_MIN_PER_POD,
          DEFAULT_MAX_PER_POD,
        ),
      });
    }
  });

export type GroupingInput = z.infer<typeof groupingSchema>;

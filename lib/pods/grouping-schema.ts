import { z } from "zod";

export const podGroupingSchema = z
  .object({
    presentCount: z
      .number({ message: "Indica cuántos alumnos hay presentes" })
      .int("Debe ser un número entero")
      .positive("Debe ser mayor que 0"),
    robotCount: z
      .number({ message: "Indica cuántos robots hay disponibles" })
      .int("Debe ser un número entero")
      .positive("Debe ser mayor que 0"),
  })
  .refine((v) => v.robotCount <= 15, {
    message: "Máximo 15 grupos permitidos",
    path: ["robotCount"],
  })
  .refine((v) => v.robotCount <= v.presentCount, {
    message: "No puede haber más robots que alumnos",
    path: ["robotCount"],
  });

export type PodGroupingInput = z.infer<typeof podGroupingSchema>;

export type PodGroupingErrors = {
  presentCount?: string;
  robotCount?: string;
};

export function fieldErrorsFromZod(
  error: z.ZodError,
): PodGroupingErrors {
  const out: PodGroupingErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key === "presentCount" && !out.presentCount) {
      out.presentCount = issue.message;
    } else if (key === "robotCount" && !out.robotCount) {
      out.robotCount = issue.message;
    }
  }
  return out;
}

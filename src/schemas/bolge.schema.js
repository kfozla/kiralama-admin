import { z } from "zod";

export const bolgeSchema = z.object({
  ad: z
    .string()
    .trim()
    .min(2, "Bölge adı en az 2 karakter olmalıdır.")
    .max(100, "Bölge adı en fazla 100 karakter olabilir."),

  parentBolgeId: z.number().int().positive().nullable(),
});

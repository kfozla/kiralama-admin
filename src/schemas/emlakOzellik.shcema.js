import { z } from "zod";
import { OZELLIK_KATEGORILERI } from "@/constants/emlakOzellik";

const allowedCategories = OZELLIK_KATEGORILERI.map((item) => item.value);

export const emlakOzellikSchema = z.object({
  ozellikAdi: z
    .string()
    .trim()
    .min(2, "Özellik adı en az 2 karakter olmalıdır.")
    .max(100, "Özellik adı en fazla 100 karakter olabilir."),

  kategori: z
    .number({ error: "Kategori seçiniz." })
    .int("Geçerli bir kategori seçiniz.")
    .refine((value) => allowedCategories.includes(value), {
      message: "Geçerli bir kategori seçiniz.",
    }),
});

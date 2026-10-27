import { z } from "zod";

export const emlakSahibiSchema = z.object({
  ad: z.string().trim().min(2, "Ad en az 2 karakter olmalıdır."),

  soyad: z.string().trim().min(2, "Soyad en az 2 karakter olmalıdır."),

  telefon: z
    .string()
    .trim()
    .min(1, "Telefon numarası zorunludur.")
    .refine(
      (value) => /^[0-9+()\s-]{10,20}$/.test(value),
      "Geçerli bir telefon numarası giriniz.",
    ),

  email: z.union([
    z.literal(""),
    z.email("Geçerli bir e-posta adresi giriniz."),
  ]),

  aciklama: z.string(),
});

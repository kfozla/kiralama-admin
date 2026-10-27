import { z } from "zod";

const requiredNumber = (message) =>
  z.coerce.number().int(message).positive(message);
const nonNegativeNumber = (message) =>
  z.coerce.number().int(message).min(0, message);
const nonNegativeMoney = (message) =>
  z
    .number({ error: message })
    .finite(message)
    .min(0, message)
    .max(999999999, message);
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Geçerli saat seçiniz.");

const poolSchema = z.object({
  havuzTipi: z.string().min(1, "Havuz tipi seçiniz."),
  uzunluk: z.coerce.number().positive("Uzunluk 0'dan büyük olmalı."),
  genislik: z.coerce.number().positive("Genişlik 0'dan büyük olmalı."),
  derinlik: z.coerce.number().positive("Derinlik 0'dan büyük olmalı."),
  mahremiyet: z.coerce.number().int().min(0),
});

export const emlakSchema = z
  .object({
    emlakAdi: z.string().trim().min(2, "Emlak adı en az 2 karakter olmalıdır."),
    emlakTipi: z
      .number({ error: "Emlak tipi seçiniz." })
      .int()
      .min(0, "Emlak tipi seçiniz."),
    emlakSahibiId: z.number().int().positive().nullable(),
    bolgeId: requiredNumber("Bölge seçiniz."),
    kapasite: requiredNumber("Kapasite en az 1 olmalıdır."),
    yatakOdasiSayisi: nonNegativeNumber("Geçerli yatak odası sayısı giriniz."),
    banyoSayisi: nonNegativeNumber("Geçerli banyo sayısı giriniz."),
    aciklama: z.string(),
    genelBilgiler: z.string(),

    girisSaati: timeSchema,
    cikisSaati: timeSchema,
    hasarDepozitosu: nonNegativeMoney("Hasar depozitosu negatif olamaz."),
    temizlikUcreti: nonNegativeMoney("Temizlik ücreti negatif olamaz."),
    minimumKonaklamaSuresi: z
      .number({ error: "Minimum konaklama süresi giriniz." })
      .int()
      .min(1, "En az 1 gece olmalıdır.")
      .max(365, "En fazla 365 gece olabilir."),

    minimumKonaklamaTemizlik: z.coerce
      .number()
      .int("Tam sayı giriniz.")
      .min(0, "Değer negatif olamaz.")
      .max(365, "En fazla 365 gece olabilir."),

    ozellikIds: z.array(z.number().int()).default([]),
    oneCikanOzellikIds: z.array(z.number().int()).default([]),
    havuzBilgileri: z.array(poolSchema).default([]),
    latitude: z.string(),
    longitude: z.string(),
    otoparkSayisi: z
      .number()
      .int("Otopark kapasitesi tam sayı olmalıdır.")
      .min(0, "Otopark kapasitesi negatif olamaz."),

    belgeNo: z
      .string()
      .max(100, "Belge numarası en fazla 100 karakter olabilir.")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    for (const id of data.oneCikanOzellikIds) {
      if (!data.ozellikIds.includes(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["oneCikanOzellikIds"],
          message:
            "Öne çıkan özellikler, seçilen emlak özellikleri arasında olmalıdır.",
        });
        break;
      }
    }
    const hasLat = data.latitude.trim() !== "";
    const hasLng = data.longitude.trim() !== "";
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: "custom",
        path: [hasLat ? "longitude" : "latitude"],
        message: "Enlem ve boylam birlikte girilmelidir.",
      });
    }
    if (hasLat && hasLng) {
      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        ctx.addIssue({
          code: "custom",
          path: ["latitude"],
          message: "Enlem -90 ile 90 arasında olmalıdır.",
        });
      }
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        ctx.addIssue({
          code: "custom",
          path: ["longitude"],
          message: "Boylam -180 ile 180 arasında olmalıdır.",
        });
      }
    }
  });

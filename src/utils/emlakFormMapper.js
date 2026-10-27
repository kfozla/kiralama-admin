export const EMLAK_DEFAULT_VALUES = {
  emlakAdi: "",
  emlakTipi: undefined,
  emlakSahibiId: null,
  bolgeId: undefined,
  kapasite: undefined,
  yatakOdasiSayisi: 0,
  banyoSayisi: 0,
  aciklama: "",
  genelBilgiler: "",
  girisSaati: "16:00",
  cikisSaati: "10:00",
  hasarDepozitosu: 0,
  temizlikUcreti: 0,
  minimumKonaklamaSuresi: 1,
  minimumKonaklamaTemizlik: 0,
  ozellikIds: [],
  oneCikanOzellikIds: [],
  havuzBilgileri: [],
  latitude: "",
  longitude: "",
  otoparkSayisi: 0,
  belgeNo: "",
};

function toNumber(value, fallback = undefined) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toIdArray(value) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((item) => {
          if (typeof item === "number" || typeof item === "string")
            return Number(item);
          return Number(item?.id ?? item?.ozellikId ?? item?.emlakOzellikId);
        })
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
}

function toTimeInput(value, fallback) {
  if (typeof value !== "string") return fallback;
  const match = /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value);
  if (!match) return fallback;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? `${match[1]}:${match[2]}` : fallback;
}

// BACKEND RESPONSE -> FRONTEND FORM
export function emlakToFormValues(response) {
  const item = response?.data ?? response;
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error("Geçersiz emlak verisi.");
  }

  return {
    emlakAdi: item["emlakAdı"] ?? item["EmlakAdı"] ?? item.emlakAdi ?? "",
    emlakTipi: toNumber(item.emlakTipi),
    emlakSahibiId: toNumber(item.emlakSahibiId, null),
    bolgeId: toNumber(item.bolgeId),
    kapasite: toNumber(item.kapasite),
    yatakOdasiSayisi: toNumber(
      item["yatakOdasıSayısı"] ??
        item["YatakOdasıSayısı"] ??
        item.yatakOdasiSayisi,
      0,
    ),
    banyoSayisi: toNumber(
      item["banyoSayısı"] ?? item["BanyoSayısı"] ?? item.banyoSayisi,
      0,
    ),
    aciklama: item["açıklama"] ?? item["Açıklama"] ?? item.aciklama ?? "",
    genelBilgiler: item.genelBilgiler ?? "",

    girisSaati: toTimeInput(item.girisSaati ?? item.GirisSaati, "16:00"),
    cikisSaati: toTimeInput(item.cikisSaati ?? item.CikisSaati, "10:00"),
    hasarDepozitosu: toNumber(item.hasarDepozitosu ?? item.HasarDepozitosu, 0),
    temizlikUcreti: toNumber(item.temizlikUcreti ?? item.TemizlikUcreti, 0),
    minimumKonaklamaSuresi: toNumber(
      item.minimumKonaklamaSuresi ?? item.MinimumKonaklamaSuresi,
      1,
    ),
    minimumKonaklamaTemizlik: toNumber(item.minimumKonaklamaTemizlik, 0),

    ozellikIds: toIdArray(
      item.ozellikIds ?? item.emlakOzellikleri ?? item.ozellikler,
    ),
    oneCikanOzellikIds: toIdArray(
      item.oneCikanOzellikIds ?? item.oneCikanOzellikler,
    ),
    havuzBilgileri: (Array.isArray(item.havuzBilgileri)
      ? item.havuzBilgileri
      : []
    ).map((havuz) => ({
      havuzTipi: havuz.havuzTipi ?? "",
      uzunluk: toNumber(havuz.boy, ""),
      genislik: toNumber(havuz.en, ""),
      derinlik: toNumber(havuz.derinlik, ""),
      mahremiyet: toNumber(havuz.havuzKorunakTipi, 0),
    })),
    latitude: item.latitude == null ? "" : String(item.latitude),
    longitude: item.longitude == null ? "" : String(item.longitude),
    otoparkSayisi: item.otoparkSayisi ?? 0,
    belgeNo: item.belgeNo ?? "",
  };
}

// FRONTEND FORM -> BACKEND REQUEST
export function buildEmlakPayload(values) {
  console.log("Form temizlik ücreti:", values.temizlikUcreti);
  console.log("Gönderilen temizlik ücreti:", Number(values.temizlikUcreti));
  return {
    emlakSahibiId: values.emlakSahibiId ?? null,
    emlakTipi: Number(values.emlakTipi),
    bolgeId: Number(values.bolgeId),
    emlakAdı: values.emlakAdi.trim(),
    açıklama: values.aciklama ?? "",
    kapasite: Number(values.kapasite),
    yatakOdasıSayısı: Number(values.yatakOdasiSayisi),
    banyoSayısı: Number(values.banyoSayisi),
    genelBilgiler: values.genelBilgiler ?? "",

    // ASP.NET Core TimeOnly JSON formatına uygun
    girisSaati: `${values.girisSaati}:00`,
    cikisSaati: `${values.cikisSaati}:00`,
    hasarDepozitosu: Number(values.hasarDepozitosu),
    temizlikUcreti: Number(values.temizlikUcreti),
    minimumKonaklamaSuresi: Number(values.minimumKonaklamaSuresi),
    minimumKonaklamaTemizlik: Number(values.minimumKonaklamaTemizlik),

    ozellikIds: values.ozellikIds ?? [],
    oneCikanOzellikIds: values.oneCikanOzellikIds ?? [],
    havuzBilgileri: (values.havuzBilgileri ?? []).map((havuz) => ({
      havuzTipi: havuz.havuzTipi,
      en: toNumber(havuz.genislik, 0),
      boy: toNumber(havuz.uzunluk, 0),
      derinlik: toNumber(havuz.derinlik, 0),
      havuzKorunakTipi: Number(havuz.mahremiyet),
    })),
    latitude:
      values.latitude === "" || values.latitude == null
        ? null
        : Number(values.latitude),
    longitude:
      values.longitude === "" || values.longitude == null
        ? null
        : Number(values.longitude),
    otoparkSayisi: Number(values.otoparkSayisi),
    belgeNo: values.belgeNo?.trim() || null,
  };
}

export function unwrapData(response) {
  return response?.data ?? response;
}

export function getEmlakAdi(emlak) {
  return (
    emlak?.["emlakAdı"] ??
    emlak?.["EmlakAdı"] ??
    emlak?.emlakAdi ??
    "İsimsiz Emlak"
  );
}

export function getAciklama(emlak) {
  return emlak?.["açıklama"] ?? emlak?.["Açıklama"] ?? emlak?.aciklama ?? "";
}

export function getYatakOdasi(emlak) {
  return (
    emlak?.["yatakOdasıSayısı"] ??
    emlak?.["YatakOdasıSayısı"] ??
    emlak?.yatakOdasiSayisi ??
    null
  );
}

export function getBanyoSayisi(emlak) {
  return (
    emlak?.["banyoSayısı"] ??
    emlak?.["BanyoSayısı"] ??
    emlak?.banyoSayisi ??
    null
  );
}

export function getEmlakTipiAdi(value) {
  const types = {
    0: "Villa",
    1: "Daire",
    2: "Bungalov",
    3: "Müstakil Ev",
  };

  return types[value] ?? (value == null ? "Belirtilmemiş" : `Tip ${value}`);
}

export function formatValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "Belirtilmemiş";
  }

  return `${value}${suffix}`;
}

export function extractList(data) {
  const value = unwrapData(data);

  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;

  return [];
}

export function normalizeIds(value) {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .map((item) => {
          if (typeof item === "number" || typeof item === "string") {
            return Number(item);
          }

          return Number(item?.ozellikId ?? item?.emlakOzellikId ?? item?.id);
        })
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
}

export function getOzellikIds(emlak) {
  return normalizeIds(
    emlak?.ozellikIds ?? emlak?.emlakOzellikleri ?? emlak?.ozellikler,
  );
}

export function getOneCikanIds(emlak) {
  return normalizeIds(emlak?.oneCikanOzellikIds ?? emlak?.oneCikanOzellikler);
}

export function getErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (typeof data === "string" && data) return data;

  if (data?.errors) {
    return Object.entries(data.errors)
      .flatMap(([field, messages]) =>
        (Array.isArray(messages) ? messages : [messages]).map(
          (message) => `${field}: ${message}`,
        ),
      )
      .join(" | ");
  }

  return data?.message || data?.title || fallback;
}

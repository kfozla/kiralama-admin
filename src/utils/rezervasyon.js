export function extractList(response) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  return [];
}

// Sayısal değerleri güvenli şekilde dönüştürür.
function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

// Boş string değerleri null olarak düzenler.
function toStringOrNull(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();

  return text.length > 0 ? text : null;
}

// BACKEND RESPONSE -> FRONTEND REZERVASYON

export function normalizeRezervasyon(item) {
  const musteriAd = toStringOrNull(item.musteriAd);
  const musteriSoyad = toStringOrNull(item.musteriSoyad);

  const musteriAdSoyad = [musteriAd, musteriSoyad].filter(Boolean).join(" ");

  const girisTarihi = item.girisTarihi ?? item.baslangicTarihi ?? null;

  const cikisTarihi = item.cikisTarihi ?? item.bitisTarihi ?? null;

  // ToplamFiyat backend'de yalnızca konaklama bedeli
  const toplamFiyat = toNumber(item.toplamFiyat ?? item.toplamTutar);

  // Ek ücretler backend'den ayrı geliyor
  const temizlikUcreti = toNumber(item.temizlikUcreti);
  const hasarDepozitosu = toNumber(item.hasarDepozitosu);

  const toplamTutar = toplamFiyat + (temizlikUcreti ?? 0);

  // Frontend'de gösterilecek gerçek rezervasyon toplamı
  const genelToplam =
    toplamFiyat !== null && temizlikUcreti !== null
      ? Math.round((toplamFiyat + temizlikUcreti) * 100) / 100
      : toplamFiyat;

  return {
    id: toNumber(item.id),
    emlakId: toNumber(item.emlakId),

    // Müşteri bilgileri
    musteriAd,
    musteriSoyad,
    musteriAdSoyad: musteriAdSoyad || null,
    telefon: toStringOrNull(item.telefon),
    email: toStringOrNull(item.email),

    // Tarihler
    girisTarihi,
    cikisTarihi,

    // Önceki componentlerle uyumluluk
    baslangicTarihi: girisTarihi,
    bitisTarihi: cikisTarihi,

    // Konaklama
    kisiSayisi: toNumber(item.kisiSayisi),

    // Fiyatlar
    toplamFiyat,
    toplamTutar: toplamTutar ?? null,
    temizlikUcreti,
    hasarDepozitosu,
    genelToplam,

    // Rezervasyon durumu
    durum: toNumber(item.durum),

    // Kayıt bilgileri
    createdAt: item.createdAt ?? null,
    updatedAt: isValidSystemDate(item.updatedAt) ? item.updatedAt : null,
  };
}

// .NET DateTime varsayılan değeri:
// 0001-01-01T00:00:00
// Bu değeri güncelleme tarihi olarak göstermiyoruz.
function isValidSystemDate(value) {
  if (!value) return false;

  const date = String(value);

  if (date.startsWith("0001-01-01")) {
    return false;
  }

  return !Number.isNaN(Date.parse(date));
}

// YYYY-MM-DD -> DD.MM.YYYY
export function formatDate(dateValue) {
  if (!dateValue) return "-";

  const datePart = String(dateValue).slice(0, 10);

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);

  if (!match) return "-";

  return `${match[3]}.${match[2]}.${match[1]}`;
}

// DateOnly değerini UTC gününe dönüştürür.
// Türkiye saat dilimi nedeniyle gün kayması yaşanmaz.
function toUtcDay(dateValue) {
  if (!dateValue) return null;

  const datePart = String(dateValue).slice(0, 10);

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const ms = Date.UTC(year, month - 1, day);

  const parsed = new Date(ms);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return ms;
}

// Giriş ve çıkış tarihleri arasındaki gece sayısı.
export function calculateNights(startDate, endDate) {
  const start = toUtcDay(startDate);
  const end = toUtcDay(endDate);

  if (start === null || end === null || end <= start) {
    return null;
  }

  return Math.round((end - start) / 86400000);
}

// TL para formatı
export function formatMoney(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "-";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Kayıt / güncelleme tarihleri
export function formatDateTime(value) {
  if (!isValidSystemDate(value)) {
    return "-";
  }

  const date = new Date(value);

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

// Emlak API'sindeki Türkçe property isimleri
export function getEmlakAdi(emlak) {
  return emlak?.["emlakAdı"] ?? emlak?.["EmlakAdı"] ?? emlak?.emlakAdi ?? null;
}

// Axios API hata mesajını çıkartır.
export function getApiError(error, fallback = "Bir hata oluştu.") {
  const data = error?.response?.data;

  if (typeof data === "string" && data) {
    return data;
  }

  if (data?.errors && typeof data.errors === "object") {
    return Object.entries(data.errors)
      .flatMap(([key, values]) =>
        (Array.isArray(values) ? values : [values]).map(
          (text) => `${key}: ${text}`,
        ),
      )
      .join(" | ");
  }

  return data?.message || data?.title || fallback;
}

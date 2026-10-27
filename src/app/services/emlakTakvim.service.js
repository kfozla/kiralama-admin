import apiClient from "@/app/lib/apiClient";
// apiClient baseURL'in /api ile bitiyorsa
// burada tekrar /api yazmıyoruz.
const ROUTES = {
  emlak: (id) => `/Emlak/${id}`,

  rezervasyonlar: "/Rezervasyon",

  // BLOKE
  blokeList: (emlakId) => `/EmlakBlokeTarih/emlak/${emlakId}`,

  blokeCreate: "/EmlakBlokeTarih",

  blokeUpdate: (id) => `/EmlakBlokeTarih/${id}`,

  blokeDelete: (id) => `/EmlakBlokeTarih/${id}`,

  // FİYAT
  fiyatList: (emlakId) => `/EmlakFiyat/emlak/${emlakId}`,

  fiyatCreate: "/EmlakFiyat",

  fiyatUpdate: (id) => `/EmlakFiyat/${id}`,

  fiyatDelete: (id) => `/EmlakFiyat/${id}`,
};

// API'den gelen listeyi düzenler.
function extractItems(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.data?.items)) {
    return data.data.items;
  }

  throw new Error("API beklenen liste formatında yanıt vermedi.");
}

// EMLAK BİLGİLERİ
export async function getTakvimEmlak(emlakId) {
  const response = await apiClient.get(ROUTES.emlak(emlakId));

  return response.data?.data ?? response.data;
}

// REZERVASYONLAR
export async function getTakvimRezervasyonlari(emlakId) {
  const response = await apiClient.get(ROUTES.rezervasyonlar);

  const reservations = extractItems(response);

  return reservations.filter(
    (item) => Number(item.emlakId) === Number(emlakId),
  );
}

// BLOKE TARİHLER
export async function getTakvimBlokeleri(emlakId) {
  const response = await apiClient.get(ROUTES.blokeList(emlakId));

  return extractItems(response);
}

export async function createTakvimBloke(emlakId, payload) {
  const response = await apiClient.post(ROUTES.blokeCreate, {
    emlakId: Number(emlakId),

    baslangicTarihi: payload.baslangicTarihi,

    bitisTarihi: payload.bitisTarihi,

    aciklama: payload.aciklama || null,
  });

  return response.data;
}

export async function updateTakvimBloke(blokeId, payload) {
  const response = await apiClient.put(ROUTES.blokeUpdate(blokeId), {
    emlakId: Number(payload.emlakId),

    baslangicTarihi: payload.baslangicTarihi,

    bitisTarihi: payload.bitisTarihi,

    aciklama: payload.aciklama || null,
  });

  return response.data;
}

export async function deleteTakvimBloke(blokeId) {
  const response = await apiClient.delete(ROUTES.blokeDelete(blokeId));

  return response.data;
}

// EMLAK FİYATLARI
export async function getTakvimFiyatlari(emlakId) {
  const response = await apiClient.get(ROUTES.fiyatList(emlakId));

  return extractItems(response);
}

export async function createTakvimFiyat(emlakId, payload) {
  const response = await apiClient.post(ROUTES.fiyatCreate, {
    emlakId: Number(emlakId),

    baslangicTarihi: payload.baslangicTarihi,

    bitisTarihi: payload.bitisTarihi,

    gecelikFiyat: Number(payload.gecelikFiyat),
  });

  return response.data;
}

export async function updateTakvimFiyat(fiyatId, payload) {
  const response = await apiClient.put(ROUTES.fiyatUpdate(fiyatId), {
    emlakId: Number(payload.emlakId),

    baslangicTarihi: payload.baslangicTarihi,

    bitisTarihi: payload.bitisTarihi,

    gecelikFiyat: Number(payload.gecelikFiyat),
  });

  return response.data;
}

export async function deleteTakvimFiyat(fiyatId) {
  const response = await apiClient.delete(ROUTES.fiyatDelete(fiyatId));

  return response.data;
}

// HATA MESAJLARI
export function takvimApiError(error) {
  const data = error?.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data?.errors) {
    return Object.entries(data.errors)
      .flatMap(([key, value]) =>
        (Array.isArray(value) ? value : [value]).map(
          (message) => `${key}: ${message}`,
        ),
      )
      .join(" | ");
  }

  return (
    data?.message ||
    data?.title ||
    error?.message ||
    "İşlem sırasında bir hata oluştu."
  );
}

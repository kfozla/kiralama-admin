import apiClient from "@/app/lib/apiClient";

// Controller rotası /api/Rezervasyon olarak varsayıldı.
// Swagger'da farklıysa bu path'i güncelle.
const BASE_URL = "/Rezervasyon";

export async function getRezervasyonlar() {
  const response = await apiClient.get(BASE_URL);
  return response.data;
}
export async function getRezervasyonById(id) {
  const response = await apiClient.get(`${BASE_URL}/${id}`);
  return response.data;
}
export async function createRezervasyon(payload) {
  const response = await apiClient.post("/Rezervasyon", payload);
  return response.data;
}

export async function changeRezervasyonStatus(id, durum) {
  const response = await apiClient.patch(`/Rezervasyon/${id}/durum`, { durum });

  return response.data;
}

export async function deleteRezervasyon(id) {
  const response = await apiClient.delete(`/Rezervasyon/${id}`);
  return response.data;
}

export async function getPagedRezervasyonlar(params = {}, signal) {
  const response = await apiClient.get("/Rezervasyon/paged", {
    params,
    signal,
  });

  return response.data;
}
export async function getRezervasyonStats() {
  const response = await apiClient.get("/Rezervasyon/stats");
  return response.data;
}

export async function getRezervasyonTakvim(params, signal) {
  const response = await apiClient.get("/Rezervasyon/takvim", {
    params,
    signal,
  });

  return response.data;
}

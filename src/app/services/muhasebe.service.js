import apiClient from "@/app/lib/apiClient";

export async function getMuhasebeOzet(params = {}) {
  const { data } = await apiClient.get("/Muhasebe/ozet", {
    params,
  });

  return data;
}

export async function getMuhasebeRezervasyonlar(params = {}) {
  const { data } = await apiClient.get("/Muhasebe/rezervasyonlar", { params });

  return data;
}
export async function getMuhasebeAylikGrafik(params = {}) {
  const { data } = await apiClient.get("/Muhasebe/aylik-grafik", { params });
  return data;
}

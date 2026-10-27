import apiClient from "@/app/lib/apiClient";

const BASE = "/IsletmeAyarlari";

export async function getIsletmeAyarlari() {
  const response = await apiClient.get(BASE);
  return response.data;
}

export async function updateIsletmeAyarlari(data) {
  const response = await apiClient.put(BASE, data);
  return response.data;
}

export async function uploadIsletmeLogo(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post(`${BASE}/logo`, formData, {
    headers: {
      "Content-Type": undefined,
    },
  });

  return response.data;
}

export async function deleteIsletmeLogo() {
  await apiClient.delete(`${BASE}/logo`);
}

export async function getIsletmeLogoBlob() {
  const response = await apiClient.get(`${BASE}/logo`, {
    responseType: "blob",
  });

  return response.data;
}

export async function uploadTursabBelgesi(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post(`${BASE}/tursab-belgesi`, formData, {
    headers: {
      "Content-Type": undefined,
    },
  });

  return response.data;
}

export async function deleteTursabBelgesi() {
  await apiClient.delete(`${BASE}/tursab-belgesi`);
}

export async function getTursabBelgesiBlob() {
  const response = await apiClient.get(`${BASE}/tursab-belgesi`, {
    responseType: "blob",
  });

  return response.data;
}

export function isletmeApiError(error) {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;

  if (error?.response?.status === 401) {
    return "Oturum süresi dolmuş. Tekrar giriş yapın.";
  }

  if (error?.response?.status === 403) {
    return "Bu işlem için Admin yetkisi gerekiyor.";
  }

  return error?.message || "İşlem gerçekleştirilemedi.";
}

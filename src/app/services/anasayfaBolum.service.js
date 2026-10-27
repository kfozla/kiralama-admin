import apiClient from "@/app/lib/apiClient";

const BASE = "/AnasayfaBolum";

export async function getAnasayfaBolumler() {
  const { data } = await apiClient.get(BASE);
  return data;
}

export async function createAnasayfaBolum(payload) {
  const { data } = await apiClient.post(BASE, payload);
  return data;
}

export async function updateAnasayfaBolum(id, payload) {
  const { data } = await apiClient.put(`${BASE}/${id}`, payload);
  return data;
}

export async function deleteAnasayfaBolum(id) {
  const { data } = await apiClient.delete(`${BASE}/${id}`);
  return data;
}

export async function saveAnasayfaBolumEmlaklar(id, emlaklar) {
  const { data } = await apiClient.put(`${BASE}/${id}/emlaklar`, {
    emlaklar: emlaklar.map((emlakId, index) => ({
      emlakId: Number(emlakId),
      sira: index + 1,
    })),
  });

  return data;
}

export function anasayfaApiError(error) {
  const data = error?.response?.data;

  return (
    data?.message ||
    data?.title ||
    error?.message ||
    "İşlem sırasında bir hata oluştu."
  );
}

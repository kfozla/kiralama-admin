import apiClient from "@/app/lib/apiClient";

export const getEmlakSahipleri = async () => {
  const response = await apiClient.get("/EmlakSahibi");
  return response.data;
};

export const getEmlakSahibiById = async (id) => {
  const response = await apiClient.get(`/EmlakSahibi/${id}`);
  return response.data;
};

export const createEmlakSahibi = async (data) => {
  const response = await apiClient.post("/EmlakSahibi", data);
  return response.data;
};

export const updateEmlakSahibi = async (id, data) => {
  const response = await apiClient.put(`/EmlakSahibi/${id}`, data);
  return response.data;
};

export const deleteEmlakSahibi = async (id) => {
  const response = await apiClient.delete(`/EmlakSahibi/${id}`);
  return response.data;
};

export const getEmlakSahibiEmlaklar = async (id) => {
  const response = await apiClient.get(`/EmlakSahibi/${id}/emlaklar`);
  return response.data;
};

export async function searchEmlakSahipleri(query, limit = 10, signal) {
  const response = await apiClient.get("/EmlakSahibi/search", {
    params: { query, limit },
    signal,
  });

  return response.data;
}

export async function getPagedEmlakSahipleri(params = {}, signal) {
  const response = await apiClient.get("/EmlakSahibi/paged", {
    params,
    signal,
  });

  return response.data;
}

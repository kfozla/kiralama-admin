import apiClient from "@/app/lib/apiClient";

export const getEmlakOzellikler = async () => {
  const response = await apiClient.get("/EmlakOzellik");
  return response.data;
};

export const getEmlakOzellikById = async (id) => {
  const response = await apiClient.get(`/EmlakOzellik/${id}`);
  return response.data;
};

export const createEmlakOzellik = async (data) => {
  const response = await apiClient.post("/EmlakOzellik", data);
  return response.data;
};

export const updateEmlakOzellik = async (id, data) => {
  const response = await apiClient.put(`/EmlakOzellik/${id}`, data);
  return response.data;
};

export const deleteEmlakOzellik = async (id) => {
  const response = await apiClient.delete(`/EmlakOzellik/${id}`);
  return response.data;
};

export async function uploadEmlakOzellikLogo(id, file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post(`/EmlakOzellik/${id}/logo`, formData);

  return data;
}

export async function deleteEmlakOzellikLogo(id) {
  const { data } = await apiClient.delete(`/EmlakOzellik/${id}/logo`);

  return data;
}

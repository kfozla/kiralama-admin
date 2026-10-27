import apiClient from "@/app/lib/apiClient";

export const getBolgeler = async () => {
  const response = await apiClient.get("/Bolge");
  return response.data;
};

export const getBolgeById = async (id) => {
  const response = await apiClient.get(`/Bolge/${id}`);
  return response.data;
};

export const createBolge = async (data) => {
  const response = await apiClient.post("/Bolge", data);
  return response.data;
};

export const updateBolge = async (id, data) => {
  const response = await apiClient.put(`/Bolge/${id}`, data);
  return response.data;
};

export const deleteBolge = async (id) => {
  const response = await apiClient.delete(`/Bolge/${id}`);
  return response.data;
};

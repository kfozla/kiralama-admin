import apiClient from "@/app/lib/apiClient";

export const getSayfaIcerikleri = async () =>
  (await apiClient.get("/SayfaIcerigi")).data;

export const getSayfaIcerigi = async (slug) =>
  (await apiClient.get(`/SayfaIcerigi/${encodeURIComponent(slug)}`)).data;

export const updateSayfaIcerigi = async (slug, payload) =>
  (await apiClient.put(`/SayfaIcerigi/${encodeURIComponent(slug)}`, payload)).data;

export const getSorularAdmin = async () =>
  (await apiClient.get("/SikcaSorulanSoru/admin")).data;

export const createSoru = async (payload) =>
  (await apiClient.post("/SikcaSorulanSoru", payload)).data;

export const updateSoru = async (id, payload) =>
  (await apiClient.put(`/SikcaSorulanSoru/${id}`, payload)).data;

export const deleteSoru = async (id) =>
  apiClient.delete(`/SikcaSorulanSoru/${id}`);

export const getBankalarAdmin = async () =>
  (await apiClient.get("/BankaHesabi/admin")).data;

export const createBanka = async (payload) =>
  (await apiClient.post("/BankaHesabi", payload)).data;

export const updateBanka = async (id, payload) =>
  (await apiClient.put(`/BankaHesabi/${id}`, payload)).data;

export const deleteBanka = async (id) =>
  apiClient.delete(`/BankaHesabi/${id}`);

export const uploadBankaLogo = async (id, file) => {
  const form = new FormData();
  form.append("file", file);
  return (await apiClient.post(`/BankaHesabi/${id}/logo`, form, {
    headers: { "Content-Type": undefined },
  })).data;
};

export const deleteBankaLogo = async (id) =>
  (await apiClient.delete(`/BankaHesabi/${id}/logo`)).data;

export const getApiMessage = (error) =>
  error?.response?.data?.message || error?.response?.data?.title ||
  error?.message || "İşlem gerçekleştirilemedi.";

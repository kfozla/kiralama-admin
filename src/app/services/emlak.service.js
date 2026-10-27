import apiClient from "@/app/lib/apiClient";

// Tüm emlakları getir
export const getEmlaklar = async () => {
  const response = await apiClient.get("/Emlak");
  return response.data;
};

// ID'ye göre emlak getir
export const getEmlakById = async (id) => {
  const response = await apiClient.get(`/Emlak/${id}`);
  return response.data;
};

// Yeni emlak ekle
export const createEmlak = async (data) => {
  const response = await apiClient.post("/Emlak", data);
  return response.data;
};

// Emlak güncelle
export const updateEmlak = async (id, data) => {
  const response = await apiClient.put(`/Emlak/${id}`, data);
  return response.data;
};

// Emlak sil
export const deleteEmlak = async (id) => {
  const response = await apiClient.delete(`/Emlak/${id}`);
  return response.data;
};

// Emlak takvimini getir
export const getEmlakTakvim = async (id, yil, ay) => {
  const response = await apiClient.get(`/Emlak/${id}/takvim`, {
    params: { yil, ay },
  });

  return response.data;
};
export const filterEmlaklar = async (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        params.append(key, String(item));
      });
    } else {
      params.append(key, String(value));
    }
  });

  const response = await apiClient.get("/Emlak/filter", {
    params,
  });

  return response.data;
};

export async function getPagedEmlaklar(params = {}) {
  const response = await apiClient.get("/Emlak/paged", {
    params,
    paramsSerializer: {
      indexes: null,
    },
  });

  return response.data;
}

export async function searchEmlaklar(query, signal) {
  const response = await apiClient.get("/Emlak/search", {
    params: {
      query,
      limit: 10,
    },
    signal,
  });

  return response.data;
}
export async function updateEmlakYayinDurumu(id, yayinda) {
  const { data } = await apiClient.patch(`/Emlak/${id}/yayin-durumu`, {
    yayinda,
  });

  return data;
}

import apiClient from "@/app/lib/apiClient";

export async function getUsers() {
  const response = await apiClient.get("/Users");
  return response.data;
}

export async function createUser(data) {
  const response = await apiClient.post("/Users", {
    username: data.username.trim(),
    password: data.password,
    role: data.role,
  });

  return response.data;
}

export async function updateUser(id, data) {
  const response = await apiClient.put(`/Users/${id}`, {
    username: data.username.trim(),
    password: data.password,
    role: data.role,
  });

  return response.data;
}

export async function deleteUser(id) {
  const response = await apiClient.delete(`/Users/${id}`);
  return response.data;
}

export function getUserApiError(error) {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;

  if (error?.response?.status === 403) {
    return "Bu işlem için yönetici yetkisi gerekiyor.";
  }

  if (error?.response?.status === 401) {
    return "Oturumunuz geçersiz. Tekrar giriş yapmalısınız.";
  }

  return error?.message || "İşlem gerçekleştirilemedi.";
}

import apiClient from "@/app/lib/apiClient";

const base = (emlakId) => `/Emlak/${emlakId}/fotograflar`;

export async function getEmlakFotograflar(emlakId) {
  const response = await apiClient.get(base(emlakId));
  return response.data;
}

export async function uploadEmlakFotograflar(emlakId, files, onUploadProgress) {
  const formData = new FormData();

  for (const file of files) {
    formData.append("Files", file);
  }

  const response = await apiClient.post(base(emlakId), formData, {
    onUploadProgress,
  });

  return response.data;
}

export async function deleteEmlakFotograf(emlakId, fotografId) {
  await apiClient.delete(`${base(emlakId)}/${fotografId}`);
}

export async function setEmlakKapakFotograf(emlakId, fotografId) {
  const response = await apiClient.patch(
    `${base(emlakId)}/${fotografId}/kapak`,
  );

  return response.data;
}

export async function reorderEmlakFotograflar(emlakId, fotografIds) {
  const response = await apiClient.put(`${base(emlakId)}/siralama`, {
    fotografIds,
  });

  return response.data;
}

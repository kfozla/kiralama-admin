import axios from "axios";

const publicApi = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

export async function getPublicEmlakPaylasim(token) {
  const { data } = await publicApi.get(
    `/EmlakPaylasim/public/${encodeURIComponent(token)}`,
  );

  return data;
}

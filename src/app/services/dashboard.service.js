import apiClient from "@/app/lib/apiClient";

export async function getDashboardSummary() {
  const response = await apiClient.get("/Dashboard/summary");
  return response.data;
}

export async function getLastSixMonthsReservations() {
  const response = await apiClient.get(
    "/Dashboard/reservations/last-six-months",
  );

  return response.data;
}

export async function getRecentReservations() {
  const response = await apiClient.get("/Dashboard/recent-reservations");

  return response.data;
}

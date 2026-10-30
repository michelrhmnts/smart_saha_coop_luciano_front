import api from "./axios";

export const getNearbyFires = async (
  radiusKm = 5,
  period = "7d",
  refresh = false
) => {
  const response = await api.get(
    "/fires/nearby",
    {
      params: {
        radius_km: radiusKm,
        period,
        refresh,
      },
    }
  );

  return response.data;
};

export const getSyncStatus = async () => {
  const response = await api.get("/fire-sync/status");
  return response.data;
};

export const triggerSync = async (radiusKm = 10, days = 2) => {
  const response = await api.post("/fire-sync", null, {
    params: { radius_km: radiusKm, days },
  });
  return response.data;
};
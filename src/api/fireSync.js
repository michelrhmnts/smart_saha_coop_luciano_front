import api from "./axios";

export const syncFires = async () => {
  const response = await api.post("/fire-sync");

  return response.data;
};
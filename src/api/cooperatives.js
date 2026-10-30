import api from "./axios";

export const getCooperatives = async () => {
  const response = await api.get("/cooperatives/");

  return response.data;
};

export const getCooperative = async (uuid) => {
  const response = await api.get(`/cooperatives/${uuid}`);

  return response.data;
};

export const createCooperative = async (data) => {
  const response = await api.post("/cooperatives/", data);

  return response.data;
};

export const updateCooperative = async (uuid, data) => {
  const response = await api.put(`/cooperatives/${uuid}`, data);

  return response.data;
};

export const deleteCooperative = async (uuid) => {
  const response = await api.delete(`/cooperatives/${uuid}`);

  return response.data;
};
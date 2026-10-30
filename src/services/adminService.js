import api from "../api/axios";

export const getAdminUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const createAdminUser = async (userData) => {
  const response = await api.post("/admin/users", userData);
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await api.put(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export const deleteAdminUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const getAdminStats = async () => {
  const response = await api.get("/admin/stats");
  return response.data;
};

export const getAdminSettings = async () => {
  const response = await api.get("/admin/settings");
  return response.data;
};

export const updateAdminSettings = async (settings) => {
  const response = await api.put("/admin/settings", settings);
  return response.data;
};

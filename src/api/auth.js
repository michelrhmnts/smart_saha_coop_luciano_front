import api from "./axios";

export const register = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const login = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const logout = async (data = {}) => {
  const response = await api.post("/auth/logout", data);
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/auth/profile", data);
  return response.data;
};

export const forgotPassword = async (data) => {
  const response = await api.post("/auth/forgot-password", data);
  return response.data;
};

export const resetPassword = async (data, config = {}) => {
  const response = await api.post("/auth/reset-password", data, config);
  return response.data;
};

export const verifyEmailOtp = async (data) => {
  const response = await api.post("/auth/verify-email", data);
  return response.data;
};

export const resendVerificationCode = async (data) => {
  const response = await api.post("/auth/resend-verification-code", data);
  return response.data;
};

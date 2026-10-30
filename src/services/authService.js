import {
  register,
  login,
  getMe,
  logout,
  updateProfile,
} from "../api/auth";

export const loginUser = async (credentials) => {
  const result = await login(credentials);

  console.log("RESULTAT LOGIN SERVICE :", result);

  if (result.access_token) {
    localStorage.setItem("access_token", result.access_token);
  }

  if (result.refresh_token) {
    localStorage.setItem("refresh_token", result.refresh_token);
  }

  return result;
};

export const registerUser = async (data) => {
  return await register(data);
};

export const getCurrentUser = async () => {
  return await getMe();
};

export const logoutUser = async () => {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    await logout({ refresh_token: refreshToken });
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
};

export const updateUserProfile = async (data) => {
  const result = await updateProfile(data);
  return result;
};
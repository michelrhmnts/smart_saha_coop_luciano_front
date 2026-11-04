import {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyEmailOtp,
  resendVerificationCode,
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

export const requestPasswordReset = async (email) => {
  return await forgotPassword({ email });
};

export const resetUserPassword = async ({ password, access_token, code }) => {
  const config = access_token
    ? { headers: { Authorization: `Bearer ${access_token}` } }
    : {};
  return await resetPassword({ password, access_token, code }, config);
};

export const verifyUserEmail = async ({ email, token }) => {
  const result = await verifyEmailOtp({ email, token });
  if (result.access_token) {
    localStorage.setItem("access_token", result.access_token);
  }
  if (result.refresh_token) {
    localStorage.setItem("refresh_token", result.refresh_token);
  }
  return result;
};

export const resendUserVerificationCode = async (email) => {
  return await resendVerificationCode({ email });
};


import { createContext, useContext, useEffect, useState } from "react";

import {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
  verifyUserEmail,
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const result = await getCurrentUser();

        console.log("SESSION /ME :", result);

        if (result.user) {
          setUser(result.user);
        } else {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setUser(null);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la vérification de la session :",
          error
        );

        // Ne déconnecter QUE si le serveur a explicitement rejeté l'authentification (401 ou 403)
        // En cas de simple instabilité réseau ou timeout, on préserve le token pour éviter la déconnexion intempestive
        if (error.response && [401, 403].includes(error.response.status)) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (credentials) => {
    const result = await loginUser(credentials);

    // console.log("LOGIN RESULT :", result);
    // console.log(
    //   "TOKEN APRES LOGIN :",
    //   localStorage.getItem("access_token")
    // );

    if (result.access_token && result.user) {
      setUser(result.user);

      // console.log(
      //   "USER DEFINI APRES LOGIN :",
      //   result.user
      // );
    }

    return result;
  };

  const register = async (data) => {
    return await registerUser(data);
  };

  const verifyEmail = async (data) => {
    const result = await verifyUserEmail(data);
    if (result.user) {
      setUser(result.user);
    }
    return result;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    verifyEmail,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth doit être utilisé à l'intérieur de AuthProvider"
    );
  }

  return context;
};
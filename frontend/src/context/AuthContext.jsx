/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { registerUnauthorizedHandler, setAuthToken } from "../services/api";

const AuthContext = createContext(null);

const parseApiError = (error, fallbackMessage) => {
  const response = error?.response?.data;
  if (response?.errors?.length) return response.errors.join(", ");
  if (response?.message) return response.message;
  return fallbackMessage;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [loadingAuth, setLoadingAuth] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore logout failure
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearAuth();
    });

    const initializeAuth = async () => {
      if (!token) {
        setLoadingAuth(false);
        return;
      }

      setAuthToken(token);
      const cachedUser = localStorage.getItem("authUser");
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          // ignore parse error
        }
      }

      try {
        const response = await api.get("/auth/me");
        const me = response.data?.data?.user;
        if (me) {
          setUser(me);
          localStorage.setItem("authUser", JSON.stringify(me));
        }
      } catch {
        clearAuth();
      } finally {
        setLoadingAuth(false);
      }
    };

    initializeAuth();
  }, [token, clearAuth]);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const nextToken = response.data?.data?.token;
    const nextUser = response.data?.data?.user;

    if (!nextToken || !nextUser) {
      throw new Error("Invalid login response");
    }

    localStorage.setItem("authToken", nextToken);
    localStorage.setItem("authUser", JSON.stringify(nextUser));
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  };

  const signup = async (name, email, password) => {
    const response = await api.post("/auth/signup", { name, email, password });
    const nextToken = response.data?.data?.token;
    const nextUser = response.data?.data?.user;

    if (!nextToken || !nextUser) {
      throw new Error("Invalid signup response");
    }

    localStorage.setItem("authToken", nextToken);
    localStorage.setItem("authUser", JSON.stringify(nextUser));
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      loadingAuth,
      login,
      signup,
      logout,
      parseApiError,
    }),
    [user, token, loadingAuth, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

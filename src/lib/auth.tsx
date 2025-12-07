// src/lib/auth.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import api from "./api";

type User = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
};

type Account = {
  id: string;
  name: string;
  plan: string;
  status: string;
};

type AuthContextType = {
  user: User | null;
  account: Account | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoggingOut: boolean; // ⬅ añadido
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // ⬅ nuevo

  // Al cargar la app, intentar hidratar la sesión desde /auth/me
  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data?.success) {
          setUser(res.data.user);
          setAccount(res.data.account);
        } else {
          setUser(null);
          setAccount(null);
        }
      } catch {
        setUser(null);
        setAccount(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  // Login real contra tu Worker (POST /auth/login + GET /auth/me)
  const login = async (email: string, password: string) => {
    await api.post("/auth/login", { email, password });
    const res = await api.get("/auth/me");
    if (!res.data?.success) {
      throw new Error("LOGIN_FAILED");
    }
    setUser(res.data.user);
    setAccount(res.data.account);
  };

  const logout = async () => {
    try {
      setIsLoggingOut(true);

      // cierra sesión en la API
      await api.post("/auth/logout");

      // pequeño overlay de 2s
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setUser(null);
      setAccount(null);

      // navegación dura para limpiar todo
      window.location.href = "/login";
    } catch (e) {
      console.error("[AUTH] logout error:", e);
      window.location.href = "/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, account, loading, login, logout, isLoggingOut }} // ⬅ incluye flag
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

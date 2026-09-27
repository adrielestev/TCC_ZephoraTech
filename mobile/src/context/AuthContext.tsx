import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { authApi } from "../api/auth";
import { TOKEN_KEY } from "../api/client";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshMe() {
    try {
      const { data } = await authApi.me();
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        console.log("Token found, refreshing user data...");
        await refreshMe();
      }
      setIsLoading(false);
    })();
  }, []);

  async function signIn(email: string, password: string) {
    const { data } = await authApi.login({ email, password });
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await refreshMe();
    router.replace("/(app)");
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
  }

  const value: AuthContextValue = {
    user,
    isLoading,
    isAdmin: user?.user_level === "ADMIN",
    signIn,
    signOut,
    refreshMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

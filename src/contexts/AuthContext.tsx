import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth, setAuthToken, getAuthToken, User, Subscription } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const response = await auth.me();
      setUser(response.user);
      setSubscription(response.subscription || null);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setAuthToken(null);
      setUser(null);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await auth.login({ email, password });
    setAuthToken(response.token);
    setUser(response.user);
    await refreshUser();
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await auth.register({ email, password, name });
    setAuthToken(response.token);
    setUser(response.user);
    await refreshUser();
  };

  const logout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAuthToken(null);
      setUser(null);
      setSubscription(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (userData: Partial<User> & { password: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const isLoading = status === "loading";

  useEffect(() => {
    if (session?.user) {
      // Map NextAuth session to our User type
      const mappedUser: User = {
        id: session.user.id,
        email: session.user.email || "",
        firstName: session.user.firstName || session.user.name?.split(" ")[0] || "",
        lastName: session.user.lastName || session.user.name?.split(" ").slice(1).join(" ") || "",
        dateOfBirth: session.user.dateOfBirth || "",
        gender: (session.user.gender?.toLowerCase() as "male" | "female" | "other") || "other",
        role: (session.user.role as User["role"]) || "member",
        createdAt: new Date().toISOString(),
        subscriptionStatus: "active",
        avatarUrl: session.user.image || undefined,
      };
      setUser(mappedUser);
    } else {
      setUser(null);
    }
  }, [session]);

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    await signOut({ redirect: false });
    setUser(null);
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          dateOfBirth: userData.dateOfBirth,
          gender: userData.gender?.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      // Auto-login after registration
      const loginResult = await login(userData.email || "", userData.password);
      return loginResult;
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
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

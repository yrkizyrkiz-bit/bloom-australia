"use client";

import { createContext, useContext, type ReactNode } from "react";
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

function mapSessionUser(sessionUser: NonNullable<ReturnType<typeof useSession>["data"]>["user"]): User {
  return {
    id: sessionUser.id,
    email: sessionUser.email || "",
    firstName: sessionUser.firstName || sessionUser.name?.split(" ")[0] || "",
    lastName: sessionUser.lastName || sessionUser.name?.split(" ").slice(1).join(" ") || "",
    dateOfBirth: sessionUser.dateOfBirth || "",
    gender: (sessionUser.gender?.toLowerCase() as "male" | "female" | "other") || "other",
    role: (sessionUser.role as User["role"]) || "member",
    createdAt: new Date().toISOString(),
    subscriptionStatus: "active",
    avatarUrl: sessionUser.image || undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const user = session?.user ? mapSessionUser(session.user) : null;
  const isLoading = status === "loading";

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: result.error };
      }

      await update();
      return { success: true };
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    if (user?.id) {
      try {
        sessionStorage.removeItem(`sanative_grid_overlay_dismissed_${user.id}`);
      } catch {
        // ignore
      }
    }
    await signOut({ redirect: false });
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

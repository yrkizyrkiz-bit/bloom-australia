import { useState, useEffect, useCallback } from "react";

// Generic fetch hook
export function useApi<T>(url: string | null, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// Dashboard stats hook
export function useDashboardStats(userId?: string) {
  const url = userId ? `/api/dashboard/stats?userId=${userId}` : "/api/dashboard/stats";
  return useApi<{
    user: any;
    healthScore: any;
    biologicalAge: any;
    biomarkerStats: any;
    categoryBreakdown: any;
    goalStats: any;
    goals: any[];
    upcomingReminders: any[];
    upcomingAppointments: any[];
    unreadNotifications: number;
    recentActivity: any[];
    labReports: any[];
    biomarkerResults: any[];
  }>(url);
}

// Biomarker results hook
export function useBiomarkerResults(userId?: string, options?: { latest?: boolean; category?: string }) {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  if (options?.latest) params.append("latest", "true");
  if (options?.category) params.append("category", options.category);

  const url = `/api/biomarkers/results?${params.toString()}`;
  return useApi<{ results: any[] }>(url);
}

// Health goals hook
export function useHealthGoals(userId?: string, status?: string) {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  if (status) params.append("status", status);

  const url = `/api/goals?${params.toString()}`;
  return useApi<{ goals: any[] }>(url);
}

// Notifications hook
export function useNotifications(options?: { unreadOnly?: boolean; limit?: number }) {
  const params = new URLSearchParams();
  if (options?.unreadOnly) params.append("unread", "true");
  if (options?.limit) params.append("limit", options.limit.toString());

  const url = `/api/notifications?${params.toString()}`;
  return useApi<{ notifications: any[]; unreadCount: number }>(url);
}

// Reminders hook
export function useReminders(options?: { upcoming?: boolean }) {
  const params = new URLSearchParams();
  if (options?.upcoming) params.append("upcoming", "true");

  const url = `/api/reminders?${params.toString()}`;
  return useApi<{ reminders: any[] }>(url);
}

// Health score hook
export function useHealthScore(userId?: string) {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  params.append("latest", "true");

  const url = `/api/health-scores?${params.toString()}`;
  return useApi<{ score: any }>(url);
}

// Biological age hook
export function useBiologicalAge(userId?: string) {
  const url = userId ? `/api/biological-age?userId=${userId}` : "/api/biological-age";
  return useApi<{ biologicalAge: any }>(url);
}

// Biomarker definitions hook
export function useBiomarkerDefinitions(category?: string) {
  const url = category ? `/api/biomarkers?category=${category}` : "/api/biomarkers";
  return useApi<{ biomarkers: any[] }>(url);
}

// Admin stats hook
export function useAdminStats() {
  return useApi<{
    overview: any;
    subscriptions: any[];
    biomarkerStatus: any[];
    goals: any;
    appointments: any;
    recentActivity: any[];
    recentLabReports: any[];
    usersWithCritical: any[];
  }>("/api/admin/stats");
}

// Users list hook (admin)
export function useUsers(options?: { page?: number; limit?: number; search?: string; role?: string }) {
  const params = new URLSearchParams();
  if (options?.page) params.append("page", options.page.toString());
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.search) params.append("search", options.search);
  if (options?.role) params.append("role", options.role);

  const url = `/api/users?${params.toString()}`;
  return useApi<{ users: any[]; pagination: any }>(url);
}

// Mutation helpers
export async function apiPost<T>(url: string, data: any): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "An error occurred" };
    }

    return { data: result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "An error occurred" };
  }
}

export async function apiPatch<T>(url: string, data: any): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "An error occurred" };
    }

    return { data: result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "An error occurred" };
  }
}

export async function apiDelete(url: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "An error occurred" };
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "An error occurred" };
  }
}

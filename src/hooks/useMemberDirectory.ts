"use client";

import { useEffect, useState, useCallback } from "react";

export interface MemberDirectoryEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function useMemberDirectory(limit = 500) {
  const [members, setMembers] = useState<MemberDirectoryEntry[]>([]);
  const [nameByUserId, setNameByUserId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/users?role=MEMBER&limit=${limit}&lite=1`);
        if (!res.ok) return;
        const data = await res.json();
        const users: MemberDirectoryEntry[] = (data.users || []).map(
          (u: MemberDirectoryEntry) => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
          })
        );
        if (cancelled) return;
        setMembers(users);
        const map: Record<string, string> = {};
        for (const u of users) {
          map[u.id] = `${u.firstName} ${u.lastName}`.trim() || u.email;
        }
        setNameByUserId(map);
      } catch {
        // Admin CRM pages require auth; silent fail keeps UI usable
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const getDisplayName = useCallback(
    (userId: string | undefined | null) => {
      if (!userId) return "Unknown";
      return nameByUserId[userId] || "Unknown";
    },
    [nameByUserId]
  );

  return { members, nameByUserId, getDisplayName, loading };
}

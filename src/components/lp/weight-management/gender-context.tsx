"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type LpGender = "women" | "men";

type LpGenderContextValue = {
  gender: LpGender;
  setGender: (gender: LpGender) => void;
};

const LpGenderContext = createContext<LpGenderContextValue | null>(null);

export function LpGenderProvider({ children }: { children: ReactNode }) {
  const [gender, setGender] = useState<LpGender>("women");
  const value = useMemo(() => ({ gender, setGender }), [gender]);

  return <LpGenderContext.Provider value={value}>{children}</LpGenderContext.Provider>;
}

export function useLpGender() {
  const ctx = useContext(LpGenderContext);
  if (!ctx) {
    throw new Error("useLpGender must be used within LpGenderProvider");
  }
  return ctx;
}

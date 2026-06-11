"use client";

import { OrganGoalSetting } from "@/components/dashboard/OrganGoalSetting";
import type { BiomarkerResult } from "@/types";

interface KidneyGoalSettingProps {
  currentResults: BiomarkerResult[];
}

export function KidneyGoalSetting({ currentResults }: KidneyGoalSettingProps) {
  return <OrganGoalSetting organ="kidney" currentResults={currentResults} />;
}

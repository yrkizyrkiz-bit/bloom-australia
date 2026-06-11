"use client";

import { OrganGoalSetting } from "@/components/dashboard/OrganGoalSetting";
import type { BiomarkerResult } from "@/types";

interface HeartGoalSettingProps {
  currentResults: BiomarkerResult[];
}

export function HeartGoalSetting({ currentResults }: HeartGoalSettingProps) {
  return <OrganGoalSetting organ="heart" currentResults={currentResults} />;
}

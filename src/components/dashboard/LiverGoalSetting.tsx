"use client";

import { OrganGoalSetting } from "@/components/dashboard/OrganGoalSetting";
import type { BiomarkerResult } from "@/types";

interface LiverGoalSettingProps {
  currentResults: BiomarkerResult[];
}

export function LiverGoalSetting({ currentResults }: LiverGoalSettingProps) {
  return <OrganGoalSetting organ="liver" currentResults={currentResults} />;
}

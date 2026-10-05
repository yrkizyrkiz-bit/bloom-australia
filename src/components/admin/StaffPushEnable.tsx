"use client";

import { PushEnable } from "@/components/notifications/PushEnable";

/** Admin-nav wrapper for staff Web Push opt-in. */
export function StaffPushEnable({ className }: { className?: string }) {
  return <PushEnable variant="staff" className={className} />;
}

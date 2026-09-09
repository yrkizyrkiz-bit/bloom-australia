"use client";

import { FaceIdSettingsCard } from "@/components/account/FaceIdSettingsCard";

export default function AdminAccountPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage how you sign in to the staff portal.
        </p>
      </div>
      <FaceIdSettingsCard staffCopy />
    </div>
  );
}

"use client";

import { WeightTracker } from "@/components/weight-management/WeightTracker";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function WeightTrackingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Weight Tracking</h1>
          <p className="text-muted-foreground">Track your daily weight and measurements</p>
        </div>
      </div>

      <WeightTracker />
    </div>
  );
}

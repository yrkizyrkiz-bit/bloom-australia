"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HairPhotoTimeline } from "@/components/dashboard/HairPhotoTimeline";

export default function HairComparePage() {
  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mens-health/hair-loss">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <BarChart3 className="h-6 w-6 text-violet-600" />
            Compare
          </h1>
          <p className="text-muted-foreground">
            Scroll your photo timeline. Thumbnails stay small so the page stays light.
          </p>
        </div>
      </div>

      <HairPhotoTimeline />
    </div>
  );
}

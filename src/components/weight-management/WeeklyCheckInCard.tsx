"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight, CheckCircle2, Flame } from "lucide-react";
import Link from "next/link";

interface CheckInData {
  checkInNeeded: boolean;
  daysSinceLastCheckIn: number | null;
  streaks: {
    current: number;
    longest: number;
  };
}

export function WeeklyCheckInCard() {
  const [data, setData] = useState<CheckInData | null>(null);

  useEffect(() => {
    fetchCheckInStatus();
  }, []);

  const fetchCheckInStatus = async () => {
    try {
      const res = await fetch("/api/weight-management/check-in?limit=1");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching check-in status:", error);
    }
  };

  if (!data) return null;

  if (data.checkInNeeded) {
    return (
      <Card className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Time to check in!</h3>
                <p className="text-sm text-white/80">
                  {data.daysSinceLastCheckIn !== null
                    ? `${data.daysSinceLastCheckIn} days since last check-in`
                    : "Start your first weekly check-in"
                  }
                </p>
              </div>
            </div>
            <Link href="/dashboard/weight-management/check-in">
              <Button variant="secondary" size="sm" className="gap-1">
                Check in <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">All caught up!</h3>
              <p className="text-sm text-white/80">
                You&apos;ve completed this week&apos;s check-in
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
            <Flame className="w-5 h-5 text-orange-300" />
            <div className="text-right">
              <p className="text-lg font-bold">{data.streaks.current}</p>
              <p className="text-xs text-white/80">week streak</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

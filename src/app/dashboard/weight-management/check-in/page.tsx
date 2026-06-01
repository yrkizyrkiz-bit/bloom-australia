"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Flame, Calendar, CheckCircle2, Loader2, Smile, Zap, Moon, Brain } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface CheckInData {
  checkIns: Array<{
    id: string;
    weekNumber: number;
    overallFeeling: number;
    energyLevel: number;
    sleepQuality: number;
    stressLevel: number;
    focusAreas: string[];
    achievements: string[];
    challenges: string | null;
    checkedInAt: string;
  }>;
  currentWeek: number;
  checkInNeeded: boolean;
  streaks: { current: number; longest: number };
  averages: { feeling: number; energy: number; sleep: number };
}

const FOCUS_AREAS = [
  { id: "diet", label: "Diet & Nutrition" },
  { id: "exercise", label: "Exercise" },
  { id: "sleep", label: "Sleep" },
  { id: "stress", label: "Stress Management" },
  { id: "hydration", label: "Hydration" },
  { id: "accountability", label: "Accountability" },
];

export default function CheckInPage() {
  const [data, setData] = useState<CheckInData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [feeling, setFeeling] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [stress, setStress] = useState(3);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [achievements, setAchievements] = useState("");
  const [challenges, setChallenges] = useState("");

  useEffect(() => {
    fetchCheckIns();
  }, []);

  const fetchCheckIns = async () => {
    try {
      const res = await fetch("/api/weight-management/check-in?limit=10");
      if (res.ok) {
        const result = await res.json();
        setData(result);
        if (result.checkInNeeded) setShowForm(true);
      }
    } catch (error) {
      console.error("Error fetching check-ins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/weight-management/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallFeeling: feeling,
          energyLevel: energy,
          sleepQuality: sleep,
          stressLevel: stress,
          focusAreas,
          achievements: achievements.split("\n").filter(Boolean),
          challenges: challenges || null,
        }),
      });

      if (res.ok) {
        toast.success("Check-in completed!");
        setShowForm(false);
        fetchCheckIns();
      }
    } catch (error) {
      toast.error("Failed to submit check-in");
    } finally {
      setSubmitting(false);
    }
  };

  const RatingSelector = ({ value, onChange, icon: Icon, label, color }: {
    value: number;
    onChange: (v: number) => void;
    icon: typeof Smile;
    label: string;
    color: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <Label>{label}</Label>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <Button
            key={v}
            type="button"
            variant={value === v ? "default" : "outline"}
            size="sm"
            className="w-10 h-10"
            onClick={() => onChange(v)}
          >
            {v}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">1 = Poor, 5 = Excellent</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Weekly Check-in</h1>
          <p className="text-muted-foreground">Reflect on your progress this week</p>
        </div>
      </div>

      {/* Streak Card */}
      <Card className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Current Streak</p>
              <p className="text-4xl font-bold">{data?.streaks.current || 0} weeks</p>
            </div>
            <div className="text-right">
              <Flame className="w-12 h-12 text-orange-300" />
              <p className="text-xs text-white/80 mt-1">Best: {data?.streaks.longest || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-in Form */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Week {data?.currentWeek} Check-in
            </CardTitle>
            <CardDescription>Take a moment to reflect on how your week went</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RatingSelector value={feeling} onChange={setFeeling} icon={Smile} label="Overall Feeling" color="text-amber-500" />
                <RatingSelector value={energy} onChange={setEnergy} icon={Zap} label="Energy Level" color="text-yellow-500" />
                <RatingSelector value={sleep} onChange={setSleep} icon={Moon} label="Sleep Quality" color="text-indigo-500" />
                <RatingSelector value={stress} onChange={setStress} icon={Brain} label="Stress Level" color="text-red-500" />
              </div>

              <div className="space-y-2">
                <Label>Focus Areas for Next Week</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {FOCUS_AREAS.map((area) => (
                    <div key={area.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={area.id}
                        checked={focusAreas.includes(area.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFocusAreas([...focusAreas, area.id]);
                          } else {
                            setFocusAreas(focusAreas.filter((a) => a !== area.id));
                          }
                        }}
                      />
                      <label htmlFor={area.id} className="text-sm cursor-pointer">{area.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Achievements This Week</Label>
                <Textarea
                  placeholder="What went well? List your wins (one per line)"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Challenges</Label>
                <Textarea
                  placeholder="What was difficult? Any obstacles you faced?"
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Complete Check-in
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardContent>
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground mb-4">You&apos;ve already completed this week&apos;s check-in</p>
            <Button variant="outline" onClick={() => setShowForm(true)}>Update Check-in</Button>
          </CardContent>
        </Card>
      )}

      {/* Past Check-ins */}
      {data?.checkIns && data.checkIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Past Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.checkIns.map((checkIn) => (
                <div key={checkIn.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Week {checkIn.weekNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(checkIn.checkedInAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Feeling: {checkIn.overallFeeling}/5</Badge>
                    <Badge variant="outline">Energy: {checkIn.energyLevel}/5</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Ruler, Plus, TrendingDown, TrendingUp, Minus,
  Calendar, ChevronRight, Target, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Measurement {
  id: string;
  date: string;
  waist: number | null;
  hips: number | null;
  chest: number | null;
  arms: number | null;
  thighs: number | null;
}

const MEASUREMENT_KEYS = ["waist", "hips", "chest", "arms", "thighs"] as const;

const MEASUREMENT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  waist: { label: "Waist", icon: "👔", color: "from-blue-500 to-cyan-500" },
  hips: { label: "Hips", icon: "👖", color: "from-pink-500 to-rose-500" },
  chest: { label: "Chest", icon: "👕", color: "from-violet-500 to-purple-500" },
  arms: { label: "Arms", icon: "💪", color: "from-orange-500 to-amber-500" },
  thighs: { label: "Thighs", icon: "🦵", color: "from-emerald-500 to-teal-500" },
};

export function BodyMeasurements() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({
    waist: "",
    hips: "",
    chest: "",
    arms: "",
    thighs: "",
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("bodyMeasurements");
    if (saved) {
      setMeasurements(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("bodyMeasurements", JSON.stringify(measurements));
  }, [measurements]);

  const handleAddMeasurement = () => {
    const measurement: Measurement = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      waist: newMeasurement.waist ? parseFloat(newMeasurement.waist) : null,
      hips: newMeasurement.hips ? parseFloat(newMeasurement.hips) : null,
      chest: newMeasurement.chest ? parseFloat(newMeasurement.chest) : null,
      arms: newMeasurement.arms ? parseFloat(newMeasurement.arms) : null,
      thighs: newMeasurement.thighs ? parseFloat(newMeasurement.thighs) : null,
    };

    setMeasurements(prev => [...prev, measurement]);
    setNewMeasurement({ waist: "", hips: "", chest: "", arms: "", thighs: "" });
    setShowAddDialog(false);
    toast.success("Measurements saved!");
  };

  const getLatestValue = (key: keyof Omit<Measurement, "id" | "date">) => {
    for (let i = measurements.length - 1; i >= 0; i--) {
      if (measurements[i][key] !== null) {
        return measurements[i][key];
      }
    }
    return null;
  };

  const getChange = (key: keyof Omit<Measurement, "id" | "date">) => {
    const values = measurements
      .map(m => m[key])
      .filter((v): v is number => v !== null);

    if (values.length < 2) return null;
    return values[values.length - 1] - values[0];
  };

  const getMiniChartPath = (key: keyof Omit<Measurement, "id" | "date">) => {
    const values = measurements
      .map(m => m[key])
      .filter((v): v is number => v !== null);

    if (values.length < 2) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values.map((v, i) => ({
      x: (i / (values.length - 1)) * 100,
      y: 100 - ((v - min) / range) * 80 - 10,
    }));

    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ruler className="w-5 h-5 text-violet-500" />
            Body Measurements
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-1" /> Log
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-violet-500" />
                  Log Body Measurements
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Enter your measurements in centimeters. Leave blank any you don't want to track.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {MEASUREMENT_KEYS.map((key) => (
                    <div key={key} className="space-y-2">
                      <Label className="flex items-center gap-2">
                        {MEASUREMENT_LABELS[key].icon} {MEASUREMENT_LABELS[key].label} (cm)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 85"
                        value={newMeasurement[key]}
                        onChange={(e) => setNewMeasurement(prev => ({ ...prev, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={handleAddMeasurement} className="w-full bg-violet-600 hover:bg-violet-700">
                  Save Measurements
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {measurements.length === 0 ? (
          <div className="text-center py-8">
            <Ruler className="w-12 h-12 mx-auto mb-3 text-violet-200" />
            <p className="font-medium mb-1">Track your body measurements</p>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor changes in your waist, hips, chest, and more
            </p>
            <Button onClick={() => setShowAddDialog(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Add first measurement
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <AnimatePresence mode="popLayout">
              {MEASUREMENT_KEYS.map((key, index) => {
                const latest = getLatestValue(key);
                const change = getChange(key);
                const chartPath = getMiniChartPath(key);
                const info = MEASUREMENT_LABELS[key];

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${info.color} p-3 text-white`}
                  >
                    {/* Mini chart background */}
                    {chartPath && (
                      <svg
                        viewBox="0 0 100 100"
                        className="absolute inset-0 w-full h-full opacity-20"
                        preserveAspectRatio="none"
                      >
                        <path
                          d={chartPath}
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}

                    <div className="relative z-10">
                      <div className="text-lg mb-1">{info.icon}</div>
                      <p className="text-xs opacity-80">{info.label}</p>
                      <p className="text-xl font-bold">
                        {latest !== null ? `${latest}` : "—"}
                        <span className="text-xs font-normal ml-1">cm</span>
                      </p>
                      {change !== null && (
                        <div className={`flex items-center gap-1 text-xs mt-1 ${change <= 0 ? 'text-green-200' : 'text-amber-200'}`}>
                          {change <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          {Math.abs(change).toFixed(1)} cm
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for homepage
export function BodyMeasurementsCompact() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("bodyMeasurements");
    if (saved) {
      setMeasurements(JSON.parse(saved));
    }
  }, []);

  const getLatestWaist = () => {
    for (let i = measurements.length - 1; i >= 0; i--) {
      if (measurements[i].waist !== null) {
        return measurements[i].waist;
      }
    }
    return null;
  };

  const waist = getLatestWaist();

  return (
    <div className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-950/20 rounded-xl">
      <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
        <Ruler className="w-5 h-5 text-violet-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">Waist</p>
        <p className="text-xs text-muted-foreground">
          {waist !== null ? `${waist} cm` : "Not tracked"}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}

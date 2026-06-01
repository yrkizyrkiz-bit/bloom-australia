"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scale, Apple, Dumbbell, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface QuickLogWidgetProps {
  onLog?: () => void;
}

export function QuickLogWidget({ onLog }: QuickLogWidgetProps) {
  const [activeTab, setActiveTab] = useState("weight");
  const [loading, setLoading] = useState(false);

  // Weight form
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");

  // Meal form
  const [mealType, setMealType] = useState("BREAKFAST");
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");

  // Exercise form
  const [activityType, setActivityType] = useState("WALKING");
  const [exerciseName, setExerciseName] = useState("");
  const [duration, setDuration] = useState("");

  const handleLogWeight = async () => {
    if (!weight) {
      toast.error("Please enter your weight");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/weight-management/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: parseFloat(weight),
          waistCircumference: waist ? parseFloat(waist) : null,
        }),
      });

      if (res.ok) {
        toast.success("Weight logged successfully!");
        setWeight("");
        setWaist("");
        onLog?.();
      } else {
        throw new Error("Failed to log weight");
      }
    } catch (error) {
      toast.error("Failed to log weight. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = async () => {
    if (!mealName) {
      toast.error("Please enter meal name");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/weight-management/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType,
          name: mealName,
          calories: calories ? parseInt(calories) : null,
        }),
      });

      if (res.ok) {
        toast.success("Meal logged successfully!");
        setMealName("");
        setCalories("");
        onLog?.();
      } else {
        throw new Error("Failed to log meal");
      }
    } catch (error) {
      toast.error("Failed to log meal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogExercise = async () => {
    if (!exerciseName || !duration) {
      toast.error("Please fill in exercise details");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/weight-management/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType,
          name: exerciseName,
          durationMinutes: parseInt(duration),
        }),
      });

      if (res.ok) {
        toast.success("Exercise logged successfully!");
        setExerciseName("");
        setDuration("");
        onLog?.();
      } else {
        throw new Error("Failed to log exercise");
      }
    } catch (error) {
      toast.error("Failed to log exercise. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Log</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="weight" className="gap-2">
              <Scale className="w-4 h-4" /> Weight
            </TabsTrigger>
            <TabsTrigger value="meal" className="gap-2">
              <Apple className="w-4 h-4" /> Meal
            </TabsTrigger>
            <TabsTrigger value="exercise" className="gap-2">
              <Dumbbell className="w-4 h-4" /> Exercise
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weight" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="75.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waist">Waist (cm) <span className="text-muted-foreground text-xs">optional</span></Label>
                <Input
                  id="waist"
                  type="number"
                  step="0.1"
                  placeholder="85"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleLogWeight} className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Log Weight
            </Button>
          </TabsContent>

          <TabsContent value="meal" className="space-y-4">
            <div className="space-y-2">
              <Label>Meal Type</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                  <SelectItem value="MORNING_SNACK">Morning Snack</SelectItem>
                  <SelectItem value="LUNCH">Lunch</SelectItem>
                  <SelectItem value="AFTERNOON_SNACK">Afternoon Snack</SelectItem>
                  <SelectItem value="DINNER">Dinner</SelectItem>
                  <SelectItem value="EVENING_SNACK">Evening Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mealName">Meal Name</Label>
                <Input
                  id="mealName"
                  placeholder="Grilled chicken salad"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories">Calories <span className="text-muted-foreground text-xs">optional</span></Label>
                <Input
                  id="calories"
                  type="number"
                  placeholder="450"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleLogMeal} className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Log Meal
            </Button>
          </TabsContent>

          <TabsContent value="exercise" className="space-y-4">
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WALKING">Walking</SelectItem>
                  <SelectItem value="RUNNING">Running</SelectItem>
                  <SelectItem value="CYCLING">Cycling</SelectItem>
                  <SelectItem value="SWIMMING">Swimming</SelectItem>
                  <SelectItem value="STRENGTH_TRAINING">Strength Training</SelectItem>
                  <SelectItem value="YOGA">Yoga</SelectItem>
                  <SelectItem value="PILATES">Pilates</SelectItem>
                  <SelectItem value="HIIT">HIIT</SelectItem>
                  <SelectItem value="DANCE">Dance</SelectItem>
                  <SelectItem value="SPORTS">Sports</SelectItem>
                  <SelectItem value="STRETCHING">Stretching</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exerciseName">Exercise Name</Label>
                <Input
                  id="exerciseName"
                  placeholder="Morning run"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleLogExercise} className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Log Exercise
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

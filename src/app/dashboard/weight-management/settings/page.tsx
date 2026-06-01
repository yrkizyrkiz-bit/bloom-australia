"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Settings, Scale, Apple, Bell, Loader2, Check, X, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Preferences {
  id: string;
  weightUnit: string;
  dietaryRequirements: string[];
  allergies: string[];
  dailyCalorieGoal: number | null;
  dailyWaterGoal: number | null;
  trackingReminders: boolean;
  reminderTime: string | null;
  hasCompletedOnboarding: boolean;
}

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "pescatarian", label: "Pescatarian" },
  { id: "keto", label: "Keto" },
  { id: "paleo", label: "Paleo" },
  { id: "low-carb", label: "Low Carb" },
  { id: "gluten-free", label: "Gluten Free" },
  { id: "dairy-free", label: "Dairy Free" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
];

const ALLERGY_OPTIONS = [
  { id: "nuts", label: "Nuts" },
  { id: "peanuts", label: "Peanuts" },
  { id: "dairy", label: "Dairy" },
  { id: "eggs", label: "Eggs" },
  { id: "shellfish", label: "Shellfish" },
  { id: "fish", label: "Fish" },
  { id: "soy", label: "Soy" },
  { id: "wheat", label: "Wheat/Gluten" },
  { id: "sesame", label: "Sesame" },
];

export default function WeightManagementSettingsPage() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [weightUnit, setWeightUnit] = useState("KG");
  const [dietaryRequirements, setDietaryRequirements] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState("");
  const [dailyWaterGoal, setDailyWaterGoal] = useState("");
  const [trackingReminders, setTrackingReminders] = useState(true);
  const [reminderTime, setReminderTime] = useState("08:00");

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/weight-management/preferences");
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
        // Populate form
        setWeightUnit(data.weightUnit || "KG");
        setDietaryRequirements(data.dietaryRequirements || []);
        setAllergies(data.allergies || []);
        setDailyCalorieGoal(data.dailyCalorieGoal?.toString() || "");
        setDailyWaterGoal(data.dailyWaterGoal?.toString() || "");
        setTrackingReminders(data.trackingReminders ?? true);
        setReminderTime(data.reminderTime || "08:00");
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/weight-management/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightUnit,
          dietaryRequirements,
          allergies,
          dailyCalorieGoal: dailyCalorieGoal ? parseInt(dailyCalorieGoal) : null,
          dailyWaterGoal: dailyWaterGoal ? parseFloat(dailyWaterGoal) : null,
          trackingReminders,
          reminderTime: trackingReminders ? reminderTime : null,
        }),
      });

      if (res.ok) {
        toast.success("Preferences saved!");
        fetchPreferences();
      }
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggleDietary = (id: string) => {
    setDietaryRequirements(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleAllergy = (id: string) => {
    setAllergies(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

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
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Customize your weight management experience</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Weight Unit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            Measurement Units
          </CardTitle>
          <CardDescription>Choose your preferred unit for weight tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Weight Unit</Label>
              <Select value={weightUnit} onValueChange={setWeightUnit}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KG">Kilograms (kg)</SelectItem>
                  <SelectItem value="LBS">Pounds (lbs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="w-5 h-5 text-orange-500" />
            Daily Goals
          </CardTitle>
          <CardDescription>Set your daily nutrition and hydration targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Daily Calorie Goal</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="1800"
                  value={dailyCalorieGoal}
                  onChange={(e) => setDailyCalorieGoal(e.target.value)}
                />
                <span className="text-muted-foreground text-sm">cal</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Daily Water Goal</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.5"
                  placeholder="2.0"
                  value={dailyWaterGoal}
                  onChange={(e) => setDailyWaterGoal(e.target.value)}
                />
                <span className="text-muted-foreground text-sm">liters</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dietary Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Dietary Requirements</CardTitle>
          <CardDescription>Select any dietary preferences you follow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((option) => (
              <Badge
                key={option.id}
                variant={dietaryRequirements.includes(option.id) ? "default" : "outline"}
                className="cursor-pointer text-sm py-1.5 px-3"
                onClick={() => toggleDietary(option.id)}
              >
                {dietaryRequirements.includes(option.id) && <Check className="w-3 h-3 mr-1" />}
                {option.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle>Food Allergies & Intolerances</CardTitle>
          <CardDescription>Select any allergies so we can filter recipes accordingly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_OPTIONS.map((option) => (
              <Badge
                key={option.id}
                variant={allergies.includes(option.id) ? "destructive" : "outline"}
                className="cursor-pointer text-sm py-1.5 px-3"
                onClick={() => toggleAllergy(option.id)}
              >
                {allergies.includes(option.id) && <X className="w-3 h-3 mr-1" />}
                {option.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-500" />
            Reminders
          </CardTitle>
          <CardDescription>Set up daily reminders to stay on track</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Tracking Reminders</p>
                <p className="text-sm text-muted-foreground">Get reminded to log your weight and meals</p>
              </div>
              <Switch
                checked={trackingReminders}
                onCheckedChange={setTrackingReminders}
              />
            </div>

            {trackingReminders && (
              <div className="space-y-2">
                <Label>Reminder Time</Label>
                <Input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-32"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Mobile) */}
      <div className="md:hidden">
        <Button onClick={handleSave} className="w-full" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

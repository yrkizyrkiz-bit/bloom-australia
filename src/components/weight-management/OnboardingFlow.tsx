"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scale, Target, Apple, Check, ChevronRight, ChevronLeft, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OnboardingFlowProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS = [
  { id: 1, title: "Welcome", icon: Sparkles },
  { id: 2, title: "Current Weight", icon: Scale },
  { id: 3, title: "Goal Weight", icon: Target },
  { id: 4, title: "Dietary Preferences", icon: Apple },
];

const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Pescatarian", "Keto", "Paleo",
  "Low Carb", "Gluten Free", "Dairy Free", "No restrictions"
];

export function OnboardingFlow({ open, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("KG");
  const [targetDate, setTargetDate] = useState("");
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);

  const progress = (step / STEPS.length) * 100;

  const handleNext = () => {
    if (step < STEPS.length) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleDietary = (pref: string) => {
    if (pref === "No restrictions") {
      setDietaryPrefs(["No restrictions"]);
    } else {
      setDietaryPrefs(prev => {
        const filtered = prev.filter(p => p !== "No restrictions");
        return filtered.includes(pref)
          ? filtered.filter(p => p !== pref)
          : [...filtered, pref];
      });
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Save preferences
      await fetch("/api/weight-management/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: true,
          weightUnit,
          dietaryRequirements: dietaryPrefs.filter(p => p !== "No restrictions"),
        }),
      });

      // Log initial weight if provided
      if (currentWeight) {
        await fetch("/api/weight-management/weight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weight: parseFloat(currentWeight),
          }),
        });
      }

      // Create goal if target weight and date provided
      if (targetWeight && targetDate && currentWeight) {
        await fetch("/api/weight-management/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startWeight: parseFloat(currentWeight),
            targetWeight: parseFloat(targetWeight),
            targetDate,
          }),
        });
      }

      toast.success("You're all set! Let's start your journey.");
      onComplete();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split("T")[0];
  };

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return !!currentWeight;
      case 3: return true; // Optional step
      case 4: return true; // Optional step
      default: return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="flex items-center gap-2">
              {step === 1 && <Sparkles className="w-5 h-5 text-emerald-600" />}
              {step === 2 && <Scale className="w-5 h-5 text-emerald-600" />}
              {step === 3 && <Target className="w-5 h-5 text-emerald-600" />}
              {step === 4 && <Apple className="w-5 h-5 text-emerald-600" />}
              {STEPS[step - 1].title}
            </DialogTitle>
            <span className="text-sm text-muted-foreground">Step {step} of {STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </DialogHeader>

        <div className="py-6">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold">Welcome to Weight Management</h2>
              <p className="text-muted-foreground">
                Let's set up your profile to personalize your weight loss journey.
                This will only take a minute.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <p className="text-sm font-medium mb-2">What you'll get:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Personalized weight tracking</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Goal-based progress monitoring</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Meal and exercise logging</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Weekly check-ins with your care team</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Current Weight */}
          {step === 2 && (
            <div className="space-y-6">
              <DialogDescription>
                Enter your current weight to start tracking your progress.
              </DialogDescription>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Weight Unit</Label>
                  <Select value={weightUnit} onValueChange={setWeightUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KG">Kilograms (kg)</SelectItem>
                      <SelectItem value="LBS">Pounds (lbs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Current Weight *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={weightUnit === "KG" ? "75.0" : "165.0"}
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                      className="text-lg"
                    />
                    <span className="text-muted-foreground font-medium">{weightUnit.toLowerCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Goal Weight */}
          {step === 3 && (
            <div className="space-y-6">
              <DialogDescription>
                Set your target weight and timeline. You can skip this and set a goal later.
              </DialogDescription>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Weight</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={weightUnit === "KG" ? "68.0" : "150.0"}
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      className="text-lg"
                    />
                    <span className="text-muted-foreground font-medium">{weightUnit.toLowerCase()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Input
                    type="date"
                    min={getMinDate()}
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: Allow at least 2 weeks for your goal
                  </p>
                </div>

                {currentWeight && targetWeight && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      Goal: Lose {Math.abs(parseFloat(currentWeight) - parseFloat(targetWeight)).toFixed(1)} {weightUnit.toLowerCase()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Dietary Preferences */}
          {step === 4 && (
            <div className="space-y-6">
              <DialogDescription>
                Select any dietary preferences to help us recommend suitable recipes.
              </DialogDescription>

              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((pref) => (
                  <Badge
                    key={pref}
                    variant={dietaryPrefs.includes(pref) ? "default" : "outline"}
                    className="cursor-pointer text-sm py-2 px-3"
                    onClick={() => toggleDietary(pref)}
                  >
                    {dietaryPrefs.includes(pref) && <Check className="w-3 h-3 mr-1" />}
                    {pref}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <div className="flex gap-2">
            {step === 3 && (
              <Button variant="ghost" onClick={handleNext}>
                Skip for now
              </Button>
            )}
            <Button onClick={handleNext} disabled={!canProceed() || loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {step === STEPS.length ? "Get Started" : "Continue"}
              {step !== STEPS.length && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

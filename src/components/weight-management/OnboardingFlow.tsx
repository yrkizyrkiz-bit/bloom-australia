"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OnboardingFlowProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingFlow({ open, onComplete }: OnboardingFlowProps) {
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Mark portal onboarding done. Start weight, target, and target date
      // come from the doctor consultation — do not collect them again here.
      const res = await fetch("/api/weight-management/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: true,
          weightUnit: "KG",
        }),
      });
      if (!res.ok) throw new Error("Failed to complete onboarding");

      toast.success("You're all set. Let's start your journey.");
      onComplete();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Welcome
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold">Welcome to Weight Management</h2>
          <p className="text-muted-foreground">
            Your doctor has set your starting weight, target, and timeline. You can start tracking
            your program now.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 text-left">
            <p className="text-sm font-medium mb-2">What you can do here:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> Track weight and progress
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> Log meals and movement
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> Weekly check-ins with your care team
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleComplete} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

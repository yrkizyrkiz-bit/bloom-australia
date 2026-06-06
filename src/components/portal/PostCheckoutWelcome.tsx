"use client";

import Link from "next/link";
import { X, Sparkles } from "lucide-react";
import { useState } from "react";

export function PostCheckoutWelcome() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white px-4 py-3 md:px-6">
      <div className="max-w-3xl mx-auto flex items-start gap-3">
        <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm md:text-base">Welcome to your Sanative portal</p>
          <p className="text-white/90 text-xs md:text-sm mt-0.5">
            Follow your program journey below. Progress tracking unlocks when your treatment is active.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

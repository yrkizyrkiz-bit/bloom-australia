"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OrganPageBackButton() {
  return (
    <Button variant="ghost" size="icon" asChild className="shrink-0">
      <Link href="/dashboard" aria-label="Back to dashboard">
        <ArrowLeft className="h-5 w-5" />
      </Link>
    </Button>
  );
}

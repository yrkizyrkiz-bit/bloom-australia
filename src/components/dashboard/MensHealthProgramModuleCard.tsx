"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
export type MensHealthModuleConfig = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  quizRoute?: string;
  gradient: string;
  stats: { label: string; value: string };
  image: string;
};

type MensHealthProgramModuleCardProps = {
  module: MensHealthModuleConfig;
  entitled: boolean;
  /** When locked, send the member straight to this program's in-portal quiz. */
  unlockHref?: string;
};

export function MensHealthProgramModuleCard({
  module,
  entitled,
  unlockHref,
}: MensHealthProgramModuleCardProps) {
  const card = (
    <Card
      className={cn(
        "group relative h-full cursor-pointer overflow-hidden border-0 bg-slate-900 transition-all",
        entitled ? "hover:shadow-lg" : "opacity-50 grayscale"
      )}
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={module.image}
          alt={module.title}
          className={cn(
            "h-full w-full object-cover transition-transform duration-300",
            entitled && "group-hover:scale-110 opacity-60",
            !entitled && "opacity-40"
          )}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${module.gradient} opacity-80`} />
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <module.icon className="mb-2 h-8 w-8 text-white drop-shadow-lg" />
          <h3 className="text-lg font-bold text-white">{module.title}</h3>
          <p className="text-sm text-white/80">{module.description}</p>
        </div>
        {entitled ? (
          <Badge className="absolute right-3 top-3 border-0 bg-white/20 text-white">
            {module.stats.label}
          </Badge>
        ) : (
          <Badge className="absolute right-3 top-3 border-0 bg-white/10 text-white/80">
            <Lock className="mr-1 h-3 w-3" />
            Locked
          </Badge>
        )}
      </div>

      {!entitled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 px-4 text-center">
          <p className="text-sm font-medium text-white">Not enrolled yet</p>
          <p className="mt-1 max-w-[14rem] text-xs text-slate-300">
            Join this program from your programs hub to unlock your dashboard.
          </p>
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="mt-3 bg-white/90 text-slate-900 hover:bg-white"
          >
            <Link href={unlockHref ?? module.quizRoute ?? module.href}>Start quiz</Link>
          </Button>
        </div>
      )}
    </Card>
  );

  if (entitled) {
    return (
      <Link href={module.href} className="block h-full">
        {card}
      </Link>
    );
  }

  return card;
}

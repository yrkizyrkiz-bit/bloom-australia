"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { Home, Lightbulb, TrendingUp, Pill, HelpCircle, Settings, Plus, Lock } from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";
import {
  PageTransition,
  NavigationProvider,
  BottomTabIndicator,
  TabIndicator,
} from "@/components/weight-management/PageTransition";
import { WeightManagementPortalShell } from "@/components/portal/WeightManagementPortalShell";
import { usePortalContext } from "@/hooks/usePortalContext";
import { hasPortalFeature } from "@/components/portal/ProgramFeatureGate";

const weightNavItems = [
  { href: "/dashboard/weight-management", label: "Home", icon: Home, exact: true },
  { href: "/dashboard/weight-management/learn", label: "Learn", icon: Lightbulb },
  {
    href: "/dashboard/weight-management/progress",
    label: "Progress",
    icon: TrendingUp,
    requiresProgress: true,
  },
  { href: "/dashboard/weight-management/treatment", label: "Treatment", icon: Pill },
  { href: "/dashboard/weight-management/support", label: "Care Team", icon: HelpCircle },
];

export const secondaryNavItems = [
  { href: "/dashboard/weight-management/track", label: "Track Weight", requiresProgress: true },
  { href: "/dashboard/weight-management/meals", label: "Meal Diary" },
  { href: "/dashboard/weight-management/exercise", label: "Exercise" },
  { href: "/dashboard/weight-management/goals", label: "Goals", requiresProgress: true },
  { href: "/dashboard/weight-management/check-in", label: "Check-in", requiresProgress: true },
  { href: "/dashboard/weight-management/recipes", label: "Recipes" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/weight-management/saved", label: "Saved" },
  { href: "/dashboard/weight-management/settings", label: "Settings" },
];

function WeightManagementLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const { data: portal } = usePortalContext();
  const progressLocked = portal && !hasPortalFeature(portal, "weightProgress");

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isNavLocked = (requiresProgress?: boolean) =>
    Boolean(requiresProgress && progressLocked);

  return (
    <NavigationProvider>
      <div className="min-h-screen pb-20 md:pb-0 md:pl-56">
        <div className="w-full">
          <PageTransition>
            <WeightManagementPortalShell>{children}</WeightManagementPortalShell>
          </PageTransition>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200 safe-area-bottom shadow-lg">
          <LayoutGroup id="mobile-nav">
            <div className="flex items-center justify-around h-16 px-1">
              {weightNavItems.map((item) => {
                const active = isActive(item.href, item.exact);
                const locked = isNavLocked(item.requiresProgress);

                if (locked) {
                  return (
                    <div
                      key={item.href}
                      className="flex-1 h-full flex flex-col items-center justify-center text-gray-400 cursor-not-allowed"
                      title="Unlocks when your program is active"
                    >
                      <item.icon className="w-5 h-5 mb-0.5 opacity-60" />
                      <span className="text-[10px] font-medium flex items-center gap-0.5">
                        {item.label}
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  );
                }

                return (
                  <Link key={item.href} href={item.href} className="flex-1 h-full">
                    <motion.div
                      className={cn(
                        "flex flex-col items-center justify-center h-full py-1 px-1 relative",
                        active ? "text-emerald-700" : "text-gray-500"
                      )}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <BottomTabIndicator isActive={active} />
                      <motion.div
                        animate={{ scale: active ? 1.15 : 1, y: active ? -3 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <item.icon className="w-5 h-5 mb-0.5" />
                      </motion.div>
                      <motion.span
                        className={cn("text-[10px]", active ? "font-semibold" : "font-medium")}
                        animate={{ opacity: active ? 1 : 0.6, scale: active ? 1.05 : 1 }}
                      >
                        {item.label}
                      </motion.span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </LayoutGroup>
        </nav>

        <aside className="hidden md:fixed md:top-[64px] md:left-0 md:w-56 md:h-[calc(100vh-64px)] md:flex md:flex-col md:border-r md:border-gray-200 md:bg-white md:z-40 md:overflow-y-auto">
          <LayoutGroup id="desktop-nav">
            <div className="p-4 space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                Weight Management
              </p>
              {weightNavItems.map((item) => {
                const active = isActive(item.href, item.exact);
                const locked = isNavLocked(item.requiresProgress);

                if (locked) {
                  return (
                    <div
                      key={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 cursor-not-allowed"
                      title="Unlocks when your program is active"
                    >
                      <item.icon className="w-5 h-5 opacity-60" />
                      <span className="text-sm flex items-center gap-1.5">
                        {item.label}
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  );
                }

                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg relative overflow-hidden",
                        active ? "text-emerald-700 font-medium" : "text-gray-600 hover:text-gray-900"
                      )}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <TabIndicator isActive={active} layoutId="activeNavBg" />
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                Quick Actions
              </p>
              <div className="space-y-1">
                {[
                  { href: "/dashboard/weight-management/track", label: "Track Weight", requiresProgress: true },
                  { href: "/dashboard/weight-management/meals", label: "Log Meal" },
                  { href: "/dashboard/weight-management/exercise", label: "Log Exercise" },
                ].map((action, index) => {
                  const actionActive = pathname.includes(action.href.split("/").pop() || "");
                  const locked = isNavLocked(action.requiresProgress);

                  if (locked) {
                    return (
                      <div
                        key={action.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 opacity-60" />
                        {action.label}
                        <Lock className="w-3 h-3 ml-auto" />
                      </div>
                    );
                  }

                  return (
                    <Link key={action.href} href={action.href}>
                      <motion.div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm relative overflow-hidden",
                          actionActive
                            ? "bg-emerald-50 text-emerald-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        )}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Plus className="w-4 h-4" />
                        {action.label}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 mt-auto">
              <Link href="/dashboard/weight-management/settings">
                <motion.div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                    pathname.includes("/settings")
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </motion.div>
              </Link>
              <Link href="/dashboard">
                <motion.div
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 mt-1"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Home className="w-4 h-4" />
                  Back to Dashboard
                </motion.div>
              </Link>
            </div>
          </LayoutGroup>
        </aside>
      </div>
    </NavigationProvider>
  );
}

export default function WeightManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <WeightManagementLayoutInner>{children}</WeightManagementLayoutInner>
    </Suspense>
  );
}

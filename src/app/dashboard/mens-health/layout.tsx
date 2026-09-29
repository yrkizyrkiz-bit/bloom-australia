"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalContext } from "@/hooks/usePortalContext";
import { isProgramEntitled } from "@/lib/membership/program-access";
import { VITALITY_PROGRAM_RELEASED } from "@/lib/programs/release-flags";
import { MEMBER_PROGRAMS_HOME } from "@/lib/portal/member-home";
import {
  mensHealthShellFromPathname,
  readStoredMensHealthShell,
  resolveMensHealthShell,
  writeStoredMensHealthShell,
  type MensHealthShell,
} from "@/lib/portal/mens-health-shell";
import {
  HelpCircle,
  Settings,
  Plus,
  Sparkles,
  Zap,
  Loader2,
  Home,
  Heart,
  Pill,
  LayoutGrid,
  Calendar,
} from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";
import {
  PageTransition,
  NavigationProvider,
} from "@/components/weight-management/PageTransition";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Sparkles;
  exact?: boolean;
};

const hairNavItems: NavItem[] = [
  { href: "/dashboard/mens-health/hair-loss", label: "Hair", icon: Sparkles },
  ...(VITALITY_PROGRAM_RELEASED
    ? [{ href: "/dashboard/mens-health/vitality", label: "Vitality", icon: Zap }]
    : []),
  { href: "/dashboard/mens-health/support", label: "Care Team", icon: HelpCircle },
];

/** Standalone sexual health shell — not mixed with Hair Restoration. */
const sexualHealthNavItems: NavItem[] = [
  {
    href: "/dashboard/mens-health/sexual-health",
    label: "Overview",
    icon: Heart,
    exact: true,
  },
  {
    href: "/dashboard/mens-health/sexual-health/check-in",
    label: "Check-in",
    icon: Calendar,
  },
  { href: "/dashboard/mens-health/sexual-health/log", label: "Log use", icon: Pill },
  { href: "/dashboard/mens-health/support", label: "Care Team", icon: HelpCircle },
];

export const secondaryNavItems = [
  { href: "/dashboard/mens-health/treatment", label: "Treatments" },
  { href: "/dashboard/mens-health/progress", label: "Progress" },
  { href: "/dashboard/mens-health/learn", label: "Learn" },
  { href: "/dashboard/mens-health/coach", label: "Coach" },
  { href: "/dashboard/mens-health/settings", label: "Settings" },
];

export default function MensHealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { data: portal, isLoading: portalLoading } = usePortalContext();
  const [storedShell, setStoredShell] = useState<MensHealthShell | null>(() =>
    readStoredMensHealthShell()
  );

  const hasSexual = isProgramEntitled(portal?.membership, "MENS_HEALTH_SEXUAL");
  const hasHair = isProgramEntitled(portal?.membership, "HAIR_LOSS");
  const shell = resolveMensHealthShell({
    pathname,
    hasSexual,
    hasHair,
    stored: storedShell,
  });
  const isSexualHealthShell = shell === "sexual";
  const navItems = isSexualHealthShell ? sexualHealthNavItems : hairNavItems;
  const navLabel = isSexualHealthShell ? "Men's Health" : "Hair Restoration";
  const layoutGroupId = isSexualHealthShell ? "nav-mens-sexual" : "nav-mens-hair";

  const hasMensHealthEntitlement =
    hasSexual ||
    isProgramEntitled(portal?.membership, "MENS_HEALTH_VITALITY") ||
    hasHair;

  useEffect(() => {
    const fromPath = mensHealthShellFromPathname(pathname);
    if (fromPath) {
      writeStoredMensHealthShell(fromPath);
      setStoredShell(fromPath);
      return;
    }
    setStoredShell(readStoredMensHealthShell());
  }, [pathname]);

  useEffect(() => {
    if (isLoading || portalLoading) return;
    if (!user) return;

    const gender = user.gender?.toLowerCase();
    const isMale = gender === "male";
    if (!isMale && !hasMensHealthEntitlement) {
      router.push("/dashboard");
    }
  }, [user, isLoading, portalLoading, hasMensHealthEntitlement, router]);

  if (isLoading || portalLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const gender = user?.gender?.toLowerCase();
  const isMale = gender === "male";
  if (user && !isMale && !hasMensHealthEntitlement) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const hairQuickActions = [
    { href: "/dashboard/mens-health/hair-loss/check-in", label: "Weekly Check-in" },
    { href: "/dashboard/mens-health/treatment", label: "Medications" },
    ...(VITALITY_PROGRAM_RELEASED && !pathname.startsWith("/dashboard/mens-health/hair-loss")
      ? [{ href: "/dashboard/mens-health/vitality/check-in", label: "Daily Check-in" }]
      : []),
  ];

  const sexualQuickActions = [
    { href: "/dashboard/mens-health/sexual-health/check-in", label: "Weekly Check-in" },
    { href: "/dashboard/mens-health/sexual-health/log", label: "Log use" },
  ];

  const quickActions = isSexualHealthShell ? sexualQuickActions : hairQuickActions;

  return (
    <NavigationProvider>
      <div className="pb-20 md:pb-0 md:pl-56">
        <div className="w-full">
          <PageTransition>{children}</PageTransition>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-900/95 shadow-lg backdrop-blur-lg safe-area-bottom md:hidden">
          <LayoutGroup id={`${layoutGroupId}-mobile`}>
            <div className="flex h-16 items-center justify-around px-1">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link key={item.href} href={item.href} className="h-full flex-1">
                    <motion.div
                      className={cn(
                        "relative flex h-full flex-col items-center justify-center px-1 py-1",
                        active ? "text-teal-400" : "text-slate-400"
                      )}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      {active && (
                        <motion.div
                          layoutId={`${layoutGroupId}-tab`}
                          className="absolute -top-0.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <motion.div
                        animate={{ scale: active ? 1.15 : 1, y: active ? -3 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <item.icon className="mb-0.5 h-5 w-5" />
                      </motion.div>
                      <motion.span
                        className={cn("text-[10px]", active ? "font-semibold" : "font-medium")}
                        animate={{ opacity: active ? 1 : 0.6, scale: active ? 1.05 : 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
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

        <aside className="z-40 hidden overflow-y-auto border-r border-slate-800 bg-slate-900 md:fixed md:left-0 md:top-[64px] md:flex md:h-[calc(100vh-64px)] md:w-56 md:flex-col">
          <LayoutGroup id={`${layoutGroupId}-desktop`}>
            <div className="space-y-1 p-4">
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {navLabel}
              </p>
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      className={cn(
                        "relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5",
                        active
                          ? "font-medium text-teal-400"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      {active && (
                        <motion.div
                          layoutId={`${layoutGroupId}-bg`}
                          className="absolute inset-0 rounded-lg bg-teal-500/10"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <motion.div
                        animate={{ scale: active ? 1.1 : 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="relative z-10"
                      >
                        <item.icon className="h-5 w-5" />
                      </motion.div>
                      <span className="relative z-10 text-sm">{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-slate-800 p-4">
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Quick Actions
              </p>
              <div className="space-y-1">
                {quickActions.map((action, index) => {
                  const actionActive =
                    pathname === action.href || pathname.startsWith(action.href + "/");
                  return (
                    <Link key={action.href} href={action.href}>
                      <motion.div
                        className={cn(
                          "relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-sm",
                          actionActive
                            ? "bg-teal-500/10 font-medium text-teal-400"
                            : "text-slate-400 hover:bg-slate-800/50"
                        )}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                          delay: index * 0.05,
                        }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Plus className="h-4 w-4" />
                        {action.label}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-auto border-t border-slate-800 p-4">
              {!isSexualHealthShell && (
                <Link href="/dashboard/mens-health/settings">
                  <motion.div
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                      pathname.includes("/settings")
                        ? "bg-teal-500/10 font-medium text-teal-400"
                        : "text-slate-400 hover:bg-slate-800/50"
                    )}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </motion.div>
                </Link>
              )}
              <Link href={isSexualHealthShell ? MEMBER_PROGRAMS_HOME : "/dashboard"}>
                <motion.div
                  className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {isSexualHealthShell ? (
                    <LayoutGrid className="h-4 w-4" />
                  ) : (
                    <Home className="h-4 w-4" />
                  )}
                  {isSexualHealthShell ? "Programs" : "Back to Dashboard"}
                </motion.div>
              </Link>
            </div>
          </LayoutGroup>
        </aside>
      </div>
    </NavigationProvider>
  );
}

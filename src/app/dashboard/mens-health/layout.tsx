"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home, TrendingUp, Pill, HelpCircle, Settings, Plus,
  Sparkles, Heart, Zap, ShieldCheck, Loader2
} from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";
import {
  PageTransition,
  NavigationProvider,
  BottomTabIndicator,
  TabIndicator,
} from "@/components/weight-management/PageTransition";

// Men's Health 5-tab navigation
const mensHealthNavItems = [
  { href: "/dashboard/mens-health", label: "Home", icon: Home, exact: true },
  { href: "/dashboard/mens-health/hair-loss", label: "Hair", icon: Sparkles },
  { href: "/dashboard/mens-health/vitality", label: "Vitality", icon: Zap },
  { href: "/dashboard/mens-health/sexual-health", label: "Wellness", icon: Heart },
  { href: "/dashboard/mens-health/support", label: "Care Team", icon: HelpCircle },
];

// Secondary navigation items
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

  // Redirect non-male users to dashboard
  useEffect(() => {
    if (!isLoading && user && user.gender?.toLowerCase() !== "male") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // Don't render for non-male users (redirect will happen)
  if (user && user.gender?.toLowerCase() !== "male") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <NavigationProvider>
      <div className="min-h-screen pb-20 md:pb-0 md:pl-56">
        {/* Animated Page Content */}
        <div className="w-full">
          <PageTransition>
            {children}
          </PageTransition>
        </div>

        {/* Mobile Bottom Navigation - Masculine Teal Theme */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 safe-area-bottom shadow-lg">
          <LayoutGroup id="mobile-nav-mens">
            <div className="flex items-center justify-around h-16 px-1">
              {mensHealthNavItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex-1 h-full"
                  >
                    <motion.div
                      className={cn(
                        "flex flex-col items-center justify-center h-full py-1 px-1 relative",
                        active
                          ? "text-teal-400"
                          : "text-slate-400"
                      )}
                      whileTap={{ scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }}
                    >
                      {/* Sliding Active Tab Indicator */}
                      {active && (
                        <motion.div
                          layoutId="activeMensTab"
                          className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}

                      {/* Icon with smooth animation */}
                      <motion.div
                        animate={{
                          scale: active ? 1.15 : 1,
                          y: active ? -3 : 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      >
                        <item.icon className="w-5 h-5 mb-0.5" />
                      </motion.div>

                      {/* Label with animation */}
                      <motion.span
                        className={cn(
                          "text-[10px]",
                          active ? "font-semibold" : "font-medium"
                        )}
                        animate={{
                          opacity: active ? 1 : 0.6,
                          scale: active ? 1.05 : 1,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25
                        }}
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

        {/* Desktop Sidebar Navigation - Dark Slate Theme */}
        <aside className="hidden md:fixed md:top-[64px] md:left-0 md:w-56 md:h-[calc(100vh-64px)] md:flex md:flex-col md:border-r md:border-slate-800 md:bg-slate-900 md:z-40 md:overflow-y-auto">
          <LayoutGroup id="desktop-nav-mens">
            {/* Main Navigation */}
            <div className="p-4 space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
                Men&apos;s Health
              </p>
              {mensHealthNavItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg relative overflow-hidden",
                        active
                          ? "text-teal-400 font-medium"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }}
                    >
                      {/* Sliding Active Background */}
                      {active && (
                        <motion.div
                          layoutId="activeMensNavBg"
                          className="absolute inset-0 bg-teal-500/10 rounded-lg"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}

                      <motion.div
                        animate={{ scale: active ? 1.1 : 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="relative z-10"
                      >
                        <item.icon className="w-5 h-5" />
                      </motion.div>
                      <span className="text-sm relative z-10">{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t border-slate-800">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
                Quick Actions
              </p>
              <div className="space-y-1">
                {[
                  { href: "/dashboard/mens-health/hair-loss/track", label: "Log Progress" },
                  { href: "/dashboard/mens-health/treatment", label: "Medications" },
                  { href: "/dashboard/mens-health/vitality/check-in", label: "Daily Check-in" },
                ].map((action, index) => {
                  const actionActive = pathname.includes(action.href.split('/').pop() || '');
                  return (
                    <Link key={action.href} href={action.href}>
                      <motion.div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm relative overflow-hidden",
                          actionActive
                            ? "bg-teal-500/10 text-teal-400 font-medium"
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
                        <Plus className="w-4 h-4" />
                        {action.label}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* More */}
            <div className="p-4 border-t border-slate-800 mt-auto">
              <Link href="/dashboard/mens-health/settings">
                <motion.div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                    pathname.includes("/settings")
                      ? "bg-teal-500/10 text-teal-400 font-medium"
                      : "text-slate-400 hover:bg-slate-800/50"
                  )}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </motion.div>
              </Link>
              <Link href="/dashboard">
                <motion.div
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 mt-1"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
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

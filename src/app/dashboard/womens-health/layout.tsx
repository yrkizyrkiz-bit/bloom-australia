"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Heart,
  HelpCircle,
  Home,
  Loader2,
  MessageCircle,
  Moon,
  Settings,
  Pill,
} from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";
import {
  NavigationProvider,
  PageTransition,
} from "@/components/weight-management/PageTransition";

const womensHealthNavItems = [
  { href: "/dashboard/womens-health", label: "Home", icon: Home, exact: true },
  { href: "/dashboard/womens-health/check-in", label: "Data", icon: CalendarDays },
  { href: "/dashboard/womens-health/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/womens-health/treatment", label: "Treatment", icon: Pill },
  { href: "/dashboard/womens-health/care", label: "Care", icon: MessageCircle },
];

const quickActions = [
  { href: "/dashboard/biomarkers?view=program&program=WOMENS_HEALTH", label: "Women's Biomarkers" },
  { href: "/dashboard/hormone-test", label: "Hormone Panel" },
  { href: "/dashboard/womens-health/hormones", label: "Hormone Health" },
  { href: "/dashboard/womens-health/menopause", label: "Menopause" },
  { href: "/dashboard/womens-health/pcos", label: "PCOS" },
  { href: "/dashboard/womens-health/fertility", label: "Fertility" },
];

export default function WomensHealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user && user.gender?.toLowerCase() !== "female") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || (user && user.gender?.toLowerCase() !== "female")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <NavigationProvider>
      <div className="min-h-screen pb-20 md:pb-0 md:pl-56 bg-gradient-to-br from-rose-50/40 via-white to-purple-50/40 dark:from-background dark:via-background dark:to-background">
        <div className="w-full">
          <PageTransition>{children}</PageTransition>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-lg border-t border-rose-100 safe-area-bottom shadow-lg">
          <LayoutGroup id="mobile-nav-womens">
            <div className="flex items-center justify-around h-16 px-1">
              {womensHealthNavItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link key={item.href} href={item.href} className="flex-1 h-full">
                    <motion.div
                      className={cn(
                        "flex flex-col items-center justify-center h-full py-1 px-1 relative",
                        active ? "text-rose-600" : "text-slate-400"
                      )}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeWomensTab"
                          className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-rose-500 to-purple-500"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <motion.div
                        animate={{ scale: active ? 1.15 : 1, y: active ? -3 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <item.icon className="w-5 h-5 mb-0.5" />
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

        <aside className="hidden md:fixed md:top-[64px] md:left-0 md:w-56 md:h-[calc(100vh-64px)] md:flex md:flex-col md:border-r md:border-rose-100 md:bg-white md:z-40 md:overflow-y-auto">
          <LayoutGroup id="desktop-nav-womens">
            <div className="p-4 space-y-1">
              <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-3 px-3">
                Women&apos;s Health
              </p>
              {womensHealthNavItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg relative overflow-hidden",
                        active
                          ? "text-rose-700 font-medium"
                          : "text-slate-500 hover:text-slate-900"
                      )}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeWomensNavBg"
                          className="absolute inset-0 bg-rose-500/10 rounded-lg"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <item.icon className="w-5 h-5 relative z-10" />
                      <span className="text-sm relative z-10">{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-rose-100">
              <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-3 px-3">
                Quick Actions
              </p>
              <div className="space-y-1">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href}>
                    <motion.div
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Heart className="w-4 h-4" />
                      {action.label}
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-rose-100 mt-auto">
              <Link href="/dashboard/messages">
                <motion.div
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Messages
                </motion.div>
              </Link>
              <Link href="/dashboard/settings">
                <motion.div
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-700 mt-1"
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
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-700 mt-1"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <HelpCircle className="w-4 h-4" />
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

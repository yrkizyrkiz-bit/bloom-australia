"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalContext } from "@/hooks/usePortalContext";
import { hasPortalFeature } from "@/components/portal/ProgramFeatureGate";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  FlaskConical,
  Settings,
  LogOut,
  ChevronDown,
  Activity,
  User,
  History,
  Target,
  Home,
  Bean,
  Droplets,
  Heart,
  Flame,
  TestTubes,
  Sparkles,
  LineChart,
  Scale,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Compass,
  CreditCard,
} from "lucide-react";
import { RealTimeNotificationBell } from "./RealTimeNotificationBell";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/weight-management", label: "Weight", icon: Scale },
  { href: "/dashboard/trends", label: "Trends", icon: LineChart },
  { href: "/dashboard/goals", label: "Goals", icon: Target },
  { href: "/dashboard/reports", label: "Reports", icon: History },
];

const biomarkerLinks = [
  { href: "/dashboard/biomarkers", label: "My Biomarkers", icon: FlaskConical, color: "text-[#1D9E75]" },
  { href: "/dashboard/biomarkers/learn", label: "Learn about Biomarkers", icon: BookOpen, color: "text-emerald-600" },
];

const healthTests = [
  { href: "/dashboard/blood-panel", label: "Full Blood Panel", icon: TestTubes, color: "text-[#1D9E75]" },
  { href: "/dashboard/liver-test", label: "Liver Function", icon: Bean, color: "text-lime-600" },
  { href: "/dashboard/kidney-test", label: "Kidney Function", icon: Droplets, color: "text-cyan-600" },
  { href: "/dashboard/heart-test", label: "Heart Health", icon: Heart, color: "text-red-500" },
  { href: "/dashboard/thyroid-test", label: "Thyroid Function", icon: Activity, color: "text-blue-600" },
  { href: "/dashboard/hormone-test", label: "Hormone Health", icon: Sparkles, color: "text-purple-500" },
  { href: "/dashboard/metabolic-panel", label: "Metabolic Panel", icon: Flame, color: "text-orange-500" },
];

export function DashboardNav() {
  const pathname = usePathname() || "";
  const { user, logout } = useAuth();
  const { data: portal } = usePortalContext();
  const biomarkersUnlocked = hasPortalFeature(portal, "biomarkerResults");

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "U";

  const isHealthTestActive = healthTests.some(test => pathname.startsWith(test.href));
  const isBiomarkerActive = pathname.startsWith("/dashboard/biomarkers");

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-[#e6ebe3]/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1D9E75] to-[#178a64] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif text-xl text-[#34412f] group-hover:text-[#1D9E75] transition-colors">
              sanative
            </span>
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {/* Overview */}
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 rounded-xl ${pathname === "/dashboard" ? "bg-[#1D9E75]/10 text-[#1D9E75]" : "text-[#5c7a52] hover:text-[#34412f] hover:bg-[#e6ebe3]/50"}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </Button>
            </Link>

            {/* Explore — biomarkers & tests as upsell when not yet entitled */}
            <Link href="/dashboard/explore">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 rounded-xl ${pathname.startsWith("/dashboard/explore") ? "bg-[#1D9E75]/10 text-[#1D9E75]" : "text-[#5c7a52] hover:text-[#34412f] hover:bg-[#e6ebe3]/50"}`}
              >
                <Compass className="w-4 h-4" />
                Explore
              </Button>
            </Link>

            {/* Biomarkers Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 rounded-xl ${isBiomarkerActive ? "bg-[#1D9E75]/10 text-[#1D9E75]" : "text-[#5c7a52] hover:text-[#34412f] hover:bg-[#e6ebe3]/50"}`}
                >
                  <FlaskConical className="w-4 h-4" />
                  Biomarkers
                  {!biomarkersUnlocked && (
                    <span className="text-[10px] uppercase tracking-wide text-[#7e9a72]">Explore</span>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 rounded-xl border-[#e6ebe3] shadow-lg">
                {!biomarkersUnlocked && (
                  <DropdownMenuLabel className="text-xs text-[#5c7a52] font-normal py-2">
                    Opens with clinician-approved monitoring.{" "}
                    <Link href="/dashboard/explore" className="text-[#1D9E75] underline">
                      Learn more
                    </Link>
                  </DropdownMenuLabel>
                )}
                {biomarkerLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const href = link.href;
                  return (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link
                        href={href}
                        className={`flex items-center gap-2 cursor-pointer rounded-lg ${isActive ? "bg-[#1D9E75]/10" : ""}`}
                      >
                        <link.icon className={`w-4 h-4 ${link.color}`} />
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Health Tests Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 rounded-xl ${isHealthTestActive ? "bg-[#1D9E75]/10 text-[#1D9E75]" : "text-[#5c7a52] hover:text-[#34412f] hover:bg-[#e6ebe3]/50"}`}
                >
                  <TestTubes className="w-4 h-4" />
                  Health Tests
                  {!biomarkersUnlocked && (
                    <span className="text-[10px] uppercase tracking-wide text-[#7e9a72]">Explore</span>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 rounded-xl border-[#e6ebe3] shadow-lg">
                <DropdownMenuLabel className="text-xs text-[#5c7a52] font-medium">
                  {biomarkersUnlocked ? "Organ-Specific Tests" : "Explore health panels"}
                </DropdownMenuLabel>
                {healthTests.map((test) => {
                  const isActive = pathname.startsWith(test.href);
                  const href = test.href;
                  return (
                    <DropdownMenuItem key={test.href} asChild>
                      <Link
                        href={href}
                        className={`flex items-center gap-2 cursor-pointer rounded-lg ${isActive ? "bg-[#1D9E75]/10" : ""}`}
                      >
                        <test.icon className={`w-4 h-4 ${test.color}`} />
                        {test.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {navItems.slice(1).map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 rounded-xl ${isActive ? "bg-[#1D9E75]/10 text-[#1D9E75]" : "text-[#5c7a52] hover:text-[#34412f] hover:bg-[#e6ebe3]/50"}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Notifications & User Menu */}
          <div className="flex items-center gap-2">
            <RealTimeNotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 rounded-xl hover:bg-[#e6ebe3]/50">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1D9E75] to-[#178a64] flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {initials}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-[#34412f]">
                    {user?.firstName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#5c7a52]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl border-[#e6ebe3] shadow-lg">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-[#34412f]">{user?.firstName} {user?.lastName}</span>
                    <span className="text-xs font-normal text-[#5c7a52]">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#e6ebe3]" />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer rounded-lg">
                    <User className="w-4 h-4 text-[#5c7a52]" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/billing" className="flex items-center gap-2 cursor-pointer rounded-lg">
                    <CreditCard className="w-4 h-4 text-[#5c7a52]" />
                    Billing & subscription
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/messages" className="flex items-center gap-2 cursor-pointer rounded-lg">
                    <MessageSquare className="w-4 h-4 text-[#5c7a52]" />
                    Messages
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/reports" className="flex items-center gap-2 cursor-pointer rounded-lg">
                    <History className="w-4 h-4 text-[#5c7a52]" />
                    Reports & History
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#e6ebe3]" />
                <DropdownMenuItem asChild>
                  <Link href="#" className="flex items-center gap-2 cursor-pointer rounded-lg">
                    <HelpCircle className="w-4 h-4 text-[#5c7a52]" />
                    Help & Support
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#e6ebe3]" />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}

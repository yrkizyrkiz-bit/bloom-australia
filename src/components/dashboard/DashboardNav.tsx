"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalContext } from "@/hooks/usePortalContext";
import { hasPortalFeature } from "@/components/portal/ProgramFeatureGate";
import { Button } from "@/components/ui/button";
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
  LogOut,
  ChevronDown,
  User,
  History,
  Target,
  Heart,
  MessageSquare,
  HelpCircle,
  CreditCard,
  Grid3X3,
} from "lucide-react";
import { MEMBER_PROGRAMS_HOME } from "@/lib/portal/member-home";
import { RealTimeNotificationBell } from "./RealTimeNotificationBell";

const navItems = [
  { href: "/dashboard/goals", label: "Goals", icon: Target },
  { href: "/dashboard/reports", label: "Reports", icon: History },
];

export function DashboardNav() {
  const pathname = usePathname() || "";
  const { user, logout } = useAuth();
  const { data: portal } = usePortalContext();
  const biomarkersUnlocked = hasPortalFeature(portal, "biomarkerResults");

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "U";

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-[#e6ebe3]/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={MEMBER_PROGRAMS_HOME} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1D9E75] to-[#178a64] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif text-xl text-[#34412f] group-hover:text-[#1D9E75] transition-colors">
              sanative
            </span>
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {/* Programs hub, default member home */}
            <Link href={MEMBER_PROGRAMS_HOME}>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 rounded-xl ${pathname.startsWith("/dashboard/programs") ? "bg-[#1D9E75]/10 text-[#1D9E75]" : "text-[#5c7a52] hover:text-[#34412f] hover:bg-[#e6ebe3]/50"}`}
              >
                <Grid3X3 className="w-4 h-4" />
                Programs
              </Button>
            </Link>

            {/* Keep this slot in the tree so Radix menu IDs stay stable after portal context loads. */}
            <Link
              href="/dashboard"
              className={biomarkersUnlocked ? undefined : "hidden"}
              tabIndex={biomarkersUnlocked ? undefined : -1}
              aria-hidden={!biomarkersUnlocked}
            >
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 rounded-xl ${pathname === "/dashboard" ? "bg-[#1D9E75]/10 text-[#1D9E75]" : "text-[#5c7a52] hover:text-[#34412f] hover:bg-[#e6ebe3]/50"}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </Button>
            </Link>

            {navItems.map((item) => {
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

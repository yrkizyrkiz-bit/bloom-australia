"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
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
  Users,
  Upload,
  ChevronDown,
  FlaskConical,
  Shield,
  Loader2,
  CreditCard,
  MessageSquare,
  Building2,
  Home,
  Scale,
  Pill,
  Mail,
  Calendar,
  ClipboardList,
  Stethoscope,
  CalendarClock,
  Bell,
  UserCog,
  Sparkles,
  Menu,
  KeyRound,
  DollarSign,
} from "lucide-react";

type AdminNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const dashboardNavItem: AdminNavItem = { href: "/admin", label: "Dashboard", icon: LayoutDashboard };

const crmNavItems: AdminNavItem[] = [
  { href: "/admin/crm", label: "CRM Overview", icon: Building2 },
  { href: "/admin/crm/customers", label: "Members", icon: Users },
  { href: "/admin/staff", label: "Staff", icon: UserCog },
  { href: "/admin/doctor-roster", label: "Roster", icon: CalendarClock },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
];

const clinicalAdminNavItems: AdminNavItem[] = [
  { href: "/admin/doctor", label: "Doctors", icon: Stethoscope },
  { href: "/admin/triage", label: "Triage", icon: ClipboardList },
  { href: "/admin/prescriptions", label: "Prescriptions", icon: Pill },
  { href: "/admin/welcome-calls", label: "Welcome Calls", icon: Sparkles },
];

const doctorClinicalAdminNavItems: AdminNavItem[] = [
  { href: "/admin/doctor", label: "Doctors", icon: Stethoscope },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/prescriptions", label: "Prescriptions", icon: Pill },
  { href: "/admin/welcome-calls", label: "Welcome Calls", icon: Sparkles },
];

const adminUtilityNavItems: AdminNavItem[] = [
  { href: "/admin/chat", label: "Live Chat", icon: MessageSquare },
  { href: "/admin/membership-pricing", label: "Membership Pricing", icon: DollarSign },
  { href: "/admin/weight-management", label: "Weight", icon: Scale },
  { href: "/admin/crm/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/email-preview", label: "Emails", icon: Mail },
  { href: "/admin/upload", label: "Upload", icon: Upload },
];

const doctorMobileNavItems: AdminNavItem[] = [
  { href: "/admin/doctor", label: "Consults", icon: Stethoscope },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/prescriptions", label: "Scripts", icon: Pill },
  { href: "/admin/welcome-calls", label: "Calls", icon: Sparkles },
];

// Health Tests moved to customer form sidebar as "Holistic Insights"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "";
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Roles that can access admin panel
  const adminRoles = ["admin", "ADMIN", "CARE_PARTNER", "DOCTOR"];

  useEffect(() => {
    // Give session time to sync after login
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsCheckingAuth(false);
        if (!user) {
          router.push("/");
        } else if (!adminRoles.includes(user.role)) {
          router.push("/dashboard");
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router]);

  if (isLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || !adminRoles.includes(user.role)) {
    return null;
  }

  const isNavActive = (item: AdminNavItem) =>
    pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

  const isGroupActive = (items: AdminNavItem[]) =>
    items.some((item) => isNavActive(item));
  const isDoctor = user.role === "DOCTOR";
  const displayedClinicalAdminNavItems = isDoctor
    ? doctorClinicalAdminNavItems
    : clinicalAdminNavItems;
  const bottomNavItems = isDoctor ? doctorMobileNavItems : [
    dashboardNavItem,
    crmNavItems[1],
    clinicalAdminNavItems[1],
    adminUtilityNavItems[0],
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Admin Nav */}
      <nav className="border-b border-border bg-slate-900 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif text-xl font-semibold">
                sanative
              </span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-orange-500 rounded-full font-medium">
                Admin
              </span>
            </Link>

            {/* Desktop Nav Items */}
            <div className="hidden md:flex items-center gap-1">
              <Link href={dashboardNavItem.href}>
                <Button
                  variant={isNavActive(dashboardNavItem) ? "secondary" : "ghost"}
                  size="sm"
                  className={`gap-2 ${!isNavActive(dashboardNavItem) && "text-slate-300 hover:text-white hover:bg-slate-800"}`}
                >
                  <dashboardNavItem.icon className="w-4 h-4" />
                  {dashboardNavItem.label}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isGroupActive(crmNavItems) ? "secondary" : "ghost"}
                    size="sm"
                    className={`gap-2 ${!isGroupActive(crmNavItems) && "text-slate-300 hover:text-white hover:bg-slate-800"}`}
                  >
                    <Building2 className="w-4 h-4" />
                    CRM
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuLabel>CRM</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {crmNavItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="cursor-pointer">
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isGroupActive(displayedClinicalAdminNavItems) ? "secondary" : "ghost"}
                    size="sm"
                    className={`gap-2 ${!isGroupActive(displayedClinicalAdminNavItems) && "text-slate-300 hover:text-white hover:bg-slate-800"}`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    Clinical Admin
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Clinical Admin</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {displayedClinicalAdminNavItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="cursor-pointer">
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {adminUtilityNavItems.map((item) => {
                const isActive = isNavActive(item);
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={`gap-2 ${!isActive && "text-slate-300 hover:text-white hover:bg-slate-800"}`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-1">
              {/* Mobile Nav */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-slate-300 hover:text-white hover:bg-slate-800">
                    <Menu className="w-5 h-5" />
                    <span className="sr-only">Open admin navigation</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-h-[80vh] overflow-y-auto">
                  <DropdownMenuLabel>Admin Navigation</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={dashboardNavItem.href} className="cursor-pointer">
                      <dashboardNavItem.icon className="w-4 h-4" />
                      {dashboardNavItem.label}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">CRM</DropdownMenuLabel>
                  {crmNavItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="cursor-pointer">
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Clinical Admin</DropdownMenuLabel>
                  {displayedClinicalAdminNavItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="cursor-pointer">
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  {adminUtilityNavItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="cursor-pointer">
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-slate-300 hover:text-white hover:bg-slate-800 px-2 sm:px-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-orange-500/20 text-orange-500 text-sm">
                        <Shield className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">
                      Admin
                    </span>
                    <ChevronDown className="w-4 h-4 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>Administrator</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isDoctor && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/doctor/account" className="cursor-pointer">
                          <Stethoscope className="w-4 h-4 mr-2" />
                          Doctor Account Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/doctor/account#reset-password" className="cursor-pointer">
                          <KeyRound className="w-4 h-4 mr-2" />
                          Reset Password
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Back to Main Website
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-4 px-1">
          {bottomNavItems.map((item) => {
            const isActive = isNavActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "text-slate-950"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${isActive ? "text-orange-500" : ""}`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

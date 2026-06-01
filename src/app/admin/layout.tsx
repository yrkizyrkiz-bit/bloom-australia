"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/doctor", label: "Doctor", icon: Stethoscope },
  { href: "/admin/doctor-roster", label: "Roster", icon: CalendarClock },
  { href: "/admin/chat", label: "Live Chat", icon: MessageSquare },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/crm", label: "CRM", icon: Building2 },
  { href: "/admin/crm/customers", label: "Customers", icon: Users },
  { href: "/admin/staff", label: "Staff", icon: UserCog },
  { href: "/admin/triage", label: "Triage", icon: ClipboardList },
  { href: "/admin/prescriptions", label: "Prescriptions", icon: Pill },
  { href: "/admin/weight-management", label: "Weight", icon: Scale },
  { href: "/admin/crm/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/email-preview", label: "Emails", icon: Mail },
  { href: "/admin/upload", label: "Upload", icon: Upload },
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

            {/* Nav Items */}
            <div className="hidden md:flex items-center gap-1">
              {adminNavItems.slice(0, 1).map((item) => {
                const isActive = pathname === item.href;
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

              {adminNavItems.slice(1).map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
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

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 text-slate-300 hover:text-white hover:bg-slate-800">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-orange-500/20 text-orange-500 text-sm">
                      <Shield className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">
                    Admin
                  </span>
                  <ChevronDown className="w-4 h-4" />
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
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

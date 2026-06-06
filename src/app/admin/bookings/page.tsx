"use client";

import { useState, useEffect, useMemo, type ComponentType } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  User,
  Video,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  RefreshCw,
  Stethoscope,
  CalendarDays,
  List,
  CalendarClock,
} from "lucide-react";
import { RescheduleBookingDialog } from "@/components/admin/RescheduleBookingDialog";
import { CancelBookingDialog } from "@/components/admin/CancelBookingDialog";
import { BookingChangeHistory } from "@/components/admin/BookingChangeHistory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  addSydneyDays,
  formatSydneyDate,
  formatSydneyTime,
  getSydneyDateKey,
  getSydneyDayOfWeek,
  getSydneyWeekEnd,
  getSydneyWeekStart,
  getSydneyYmd,
  isSameSydneyDay,
  sydneyLocalToUtc,
} from "@/lib/sydney-time";

interface Booking {
  id: string;
  userId: string;
  patientName: string;
  patientEmail: string;
  type: string;
  title: string;
  scheduledAt: string;
  duration: number;
  location: string;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "BOOKING_CONFIRMED" | "SLOT_HELD" | "BOOKING_CANCELLED" | "BOOKING_COMPLETED" | "BOOKING_NO_SHOW" | "BOOKING_RESCHEDULED";
  notes?: string;
  doctorName?: string;
  doctorId?: string | null;
  program?: string;
  source?: "consultation" | "appointment";
}

interface DoctorOption {
  id: string;
  firstName: string;
  lastName: string;
}

const CANCELLED_STATUSES = new Set(["CANCELLED", "BOOKING_CANCELLED"]);
const COMPLETED_STATUSES = new Set(["COMPLETED", "BOOKING_COMPLETED"]);

function canManageBooking(booking: Booking): boolean {
  return !CANCELLED_STATUSES.has(booking.status) && !COMPLETED_STATUSES.has(booking.status);
}

interface DayBookings {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
  bookings: Booking[];
}

const CONFIRMED_STATUSES = new Set(["CONFIRMED", "BOOKING_CONFIRMED"]);
const PENDING_STATUSES = new Set(["SCHEDULED", "SLOT_HELD", "BOOKING_RESCHEDULED"]);

const BOOKING_STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "BOOKING_CONFIRMED", label: "Booking Confirmed" },
  { value: "SLOT_HELD", label: "Slot Held" },
  { value: "BOOKING_RESCHEDULED", label: "Rescheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "BOOKING_COMPLETED", label: "Booking Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "BOOKING_CANCELLED", label: "Booking Cancelled" },
  { value: "NO_SHOW", label: "No Show" },
  { value: "BOOKING_NO_SHOW", label: "Booking No Show" },
] as const;

function formatStatusLabel(status: string): string {
  return (
    BOOKING_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function patientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: ComponentType<{ className?: string }> }> = {
  SCHEDULED: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock },
  CONFIRMED: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  COMPLETED: { bg: "bg-gray-100", text: "text-gray-700", icon: CheckCircle },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
  NO_SHOW: { bg: "bg-orange-100", text: "text-orange-700", icon: AlertCircle },
  SLOT_HELD: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  BOOKING_CONFIRMED: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  BOOKING_CANCELLED: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
  BOOKING_COMPLETED: { bg: "bg-gray-100", text: "text-gray-700", icon: CheckCircle },
  BOOKING_NO_SHOW: { bg: "bg-orange-100", text: "text-orange-700", icon: AlertCircle },
  BOOKING_RESCHEDULED: { bg: "bg-purple-100", text: "text-purple-700", icon: Calendar },
};

const CONSULTATION_TYPES = [
  { value: "all", label: "All Types" },
  { value: "CONSULTATION", label: "Initial Consultation" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "REVIEW", label: "Review" },
  { value: "URGENT", label: "Urgent" },
];

const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => {
  const hour = 9 + i;
  return `${hour.toString().padStart(2, "0")}:00`;
});

export default function BookingsCalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"week" | "day" | "list">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [assigningDoctor, setAssigningDoctor] = useState(false);

  // Fetch bookings
  useEffect(() => {
    fetchBookings();
  }, [currentDate]);

  useEffect(() => {
    fetch("/api/admin/staff")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.staff) {
          setDoctors(
            data.staff
              .filter((s: { role: string }) => s.role === "DOCTOR")
              .map((s: { id: string; firstName: string; lastName: string }) => ({
                id: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
              }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const startOfWeek = getSydneyWeekStart(currentDate);
      const endOfWeek = getSydneyWeekEnd(startOfWeek);

      const response = await fetch(
        `/api/admin/bookings?start=${startOfWeek.toISOString()}&end=${endOfWeek.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      } else {
        const body = await response.json().catch(() => null);
        const message = body?.error || `Failed to load bookings (${response.status})`;
        setFetchError(message);
        setBookings([]);
        toast.error(message);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      const message = "Unable to load bookings. Please refresh and try again.";
      setFetchError(message);
      setBookings([]);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (filterStatus !== "all" && booking.status !== filterStatus) return false;
      if (filterType !== "all" && booking.type !== filterType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (booking.patientName || "").toLowerCase().includes(query) ||
          (booking.patientEmail || "").toLowerCase().includes(query) ||
          (booking.title || "").toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [bookings, filterStatus, filterType, searchQuery]);

  // Get week days for calendar
  const weekDays = useMemo((): DayBookings[] => {
    const days: DayBookings[] = [];
    const weekStart = getSydneyWeekStart(currentDate);
    const weekStartYmd = getSydneyYmd(weekStart);

    for (let i = 0; i < 7; i++) {
      const ymd = addSydneyDays(weekStartYmd, i);
      const dayAnchor = sydneyLocalToUtc(ymd.year, ymd.month, ymd.day, 12, 0);
      const dayKey = getSydneyDateKey(dayAnchor);

      const dayBookings = filteredBookings.filter(
        (b) => getSydneyDateKey(b.scheduledAt) === dayKey
      );

      const dow = getSydneyDayOfWeek(dayAnchor);

      days.push({
        date: dayAnchor.toISOString(),
        dayName: formatSydneyDate(dayAnchor, { weekday: "short" }),
        dayNumber: ymd.day,
        isToday: isSameSydneyDay(dayAnchor, new Date()),
        isWeekend: dow === 0 || dow === 6,
        bookings: dayBookings,
      });
    }

    return days;
  }, [currentDate, filteredBookings]);

  // Navigation
  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Stats
  const stats = useMemo(() => {
    const todayBookings = bookings.filter((b) =>
      isSameSydneyDay(b.scheduledAt, new Date())
    );

    return {
      todayCount: todayBookings.length,
      weekCount: bookings.length,
      confirmedCount: bookings.filter((b) => CONFIRMED_STATUSES.has(b.status)).length,
      pendingCount: bookings.filter((b) => PENDING_STATUSES.has(b.status)).length,
    };
  }, [bookings]);

  const getWeekDateRange = () => {
    const startOfWeek = getSydneyWeekStart(currentDate);
    const endYmd = addSydneyDays(getSydneyYmd(startOfWeek), 6);
    const endOfWeek = sydneyLocalToUtc(endYmd.year, endYmd.month, endYmd.day, 12, 0);

    return `${formatSydneyDate(startOfWeek, {
      day: "numeric",
      month: "short",
    })} - ${formatSydneyDate(endOfWeek, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  };

  const handleAssignDoctor = async (bookingId: string, doctorId: string) => {
    if (!doctorId) return;
    setAssigningDoctor(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_doctor", doctorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign doctor");

      const doctor = doctors.find((d) => d.id === doctorId);
      const doctorName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "Assigned";
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, doctorId, doctorName } : b
        )
      );
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, doctorId, doctorName });
      }
      toast.success(`Assigned ${doctorName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign doctor");
    } finally {
      setAssigningDoctor(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus as Booking["status"] } : b))
      );
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus as Booking["status"] });
      }
      toast.success(`Booking status updated to ${formatStatusLabel(newStatus)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary" />
            Bookings Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all consultations and appointments across patients
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBookings}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-3xl font-bold">{stats.todayCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-3xl font-bold">{stats.weekCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-3xl font-bold text-green-600">{stats.confirmedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pendingCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {fetchError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-destructive">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchBookings}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Week Navigation */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center min-w-[200px]">
                <p className="font-semibold">{getWeekDateRange()}</p>
              </div>
              <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {BOOKING_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {CONSULTATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border rounded-lg p-1">
                <Button
                  variant={viewMode === "week" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                  className="gap-1"
                >
                  <CalendarDays className="w-4 h-4" />
                  Week
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="gap-1"
                >
                  <List className="w-4 h-4" />
                  List
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      {viewMode === "week" && (
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b">
              {weekDays.map((day) => (
                <div
                  key={day.date}
                  className={`p-3 text-center border-r last:border-r-0 ${
                    day.isToday ? "bg-primary/5" : day.isWeekend ? "bg-muted/30" : ""
                  }`}
                >
                  <p className="text-xs text-muted-foreground uppercase">{day.dayName}</p>
                  <p
                    className={`text-lg font-semibold ${
                      day.isToday ? "text-primary" : day.isWeekend ? "text-muted-foreground" : ""
                    }`}
                  >
                    {day.dayNumber}
                  </p>
                  {day.bookings.length > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      {day.bookings.length}
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 min-h-[500px]">
              {weekDays.map((day) => (
                <div
                  key={day.date}
                  className={`border-r last:border-r-0 p-2 ${
                    day.isToday ? "bg-primary/5" : day.isWeekend ? "bg-muted/20" : ""
                  }`}
                >
                  <ScrollArea className="h-[480px]">
                    <div className="space-y-2">
                      {day.bookings.map((booking) => {
                        const StatusIcon = STATUS_STYLES[booking.status]?.icon || Clock;
                        const time = formatSydneyTime(booking.scheduledAt);

                        return (
                          <div
                            key={booking.id}
                            onClick={() => setSelectedBooking(booking)}
                            className={`p-2 rounded-lg cursor-pointer hover:shadow-md transition-all border ${
                              STATUS_STYLES[booking.status]?.bg || "bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs font-medium">{time}</span>
                            </div>
                            <p className="text-sm font-medium truncate">{booking.patientName}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {booking.location === "Video" ? (
                                <Video className="w-3 h-3 text-muted-foreground" />
                              ) : (
                                <Phone className="w-3 h-3 text-muted-foreground" />
                              )}
                              <span className="text-xs text-muted-foreground">{booking.duration}min</span>
                            </div>
                          </div>
                        );
                      })}

                      {day.bookings.length === 0 && !day.isWeekend && (
                        <div className="text-center py-8 text-muted-foreground text-xs">
                          No bookings
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Bookings</CardTitle>
            <CardDescription>{filteredBookings.length} bookings found</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="divide-y">
                {filteredBookings.map((booking) => {
                  const StatusIcon = STATUS_STYLES[booking.status]?.icon || Clock;
                  const statusStyle = STATUS_STYLES[booking.status];

                  return (
                    <div
                      key={booking.id}
                      className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {patientInitials(booking.patientName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link
                            href={`/admin/crm/customers/${booking.userId}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {booking.patientName}
                          </Link>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatSydneyDate(booking.scheduledAt, {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatSydneyTime(booking.scheduledAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              {booking.location === "Video" ? (
                                <Video className="w-3 h-3" />
                              ) : (
                                <Phone className="w-3 h-3" />
                              )}
                              {booking.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{booking.type.replace("_", " ")}</Badge>
                        <Badge className={`${statusStyle?.bg} ${statusStyle?.text}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {formatStatusLabel(booking.status)}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
                              View Details
                            </DropdownMenuItem>
                            {canManageBooking(booking) && (
                              <DropdownMenuItem onClick={() => setRescheduleTarget(booking)}>
                                <CalendarClock className="w-4 h-4 mr-2" />
                                Reschedule
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(booking.id, "CONFIRMED")}
                            >
                              Mark Confirmed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(booking.id, "COMPLETED")}
                            >
                              Mark Completed
                            </DropdownMenuItem>
                            {canManageBooking(booking) && (
                              <DropdownMenuItem
                                onClick={() => setCancelTarget(booking)}
                                className="text-red-600"
                              >
                                Cancel Booking
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}

                {filteredBookings.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No bookings found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              Booking Details
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {patientInitials(selectedBooking.patientName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedBooking.patientName}</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.patientEmail}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="outline">{selectedBooking.type.replace("_", " ")}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {formatSydneyDate(selectedBooking.scheduledAt, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time (AEST/AEDT)</span>
                  <span className="font-medium">
                    {formatSydneyTime(selectedBooking.scheduledAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-medium">{selectedBooking.duration} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="font-medium flex items-center gap-1">
                    {selectedBooking.location === "Video" ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                    {selectedBooking.location}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Select
                    value={selectedBooking.status}
                    onValueChange={(value) => {
                      handleStatusChange(selectedBooking.id, value);
                      setSelectedBooking({ ...selectedBooking, status: value as Booking["status"] });
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOKING_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedBooking.program && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Program</span>
                    <span className="font-medium">{selectedBooking.program}</span>
                  </div>
                )}
                {selectedBooking.source === "consultation" && canManageBooking(selectedBooking) && (
                  <div className="space-y-2 pt-1">
                    <Label className="text-sm text-muted-foreground">Assigned doctor</Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedBooking.doctorId || ""}
                        onValueChange={(doctorId) =>
                          handleAssignDoctor(selectedBooking.id, doctorId)
                        }
                        disabled={assigningDoctor}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select doctor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              Dr. {doc.firstName} {doc.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedBooking.doctorName && (
                      <p className="text-xs text-muted-foreground">
                        Current: {selectedBooking.doctorName}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {selectedBooking.source === "consultation" && (
                <BookingChangeHistory bookingId={selectedBooking.id} />
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-4 border-t">
                {canManageBooking(selectedBooking) && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setRescheduleTarget(selectedBooking)}
                    >
                      <CalendarClock className="w-4 h-4 mr-2" />
                      Reschedule
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700"
                      onClick={() => setCancelTarget(selectedBooking)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Link href={`/admin/crm/customers/${selectedBooking.userId}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <User className="w-4 h-4 mr-2" />
                      View Patient
                    </Button>
                  </Link>
                  <Button className="flex-1">
                    {selectedBooking.location === "Video" ? (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Start Call
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        Call Patient
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {rescheduleTarget && (
        <RescheduleBookingDialog
          open={!!rescheduleTarget}
          onOpenChange={(open) => !open && setRescheduleTarget(null)}
          bookingId={rescheduleTarget.id}
          patientName={rescheduleTarget.patientName}
          currentScheduledAt={rescheduleTarget.scheduledAt}
          onSuccess={() => {
            setRescheduleTarget(null);
            setSelectedBooking(null);
            fetchBookings();
          }}
        />
      )}

      {cancelTarget && (
        <CancelBookingDialog
          open={!!cancelTarget}
          onOpenChange={(open) => !open && setCancelTarget(null)}
          bookingId={cancelTarget.id}
          patientName={cancelTarget.patientName}
          scheduledAt={cancelTarget.scheduledAt}
          onSuccess={() => {
            setCancelTarget(null);
            setSelectedBooking(null);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
}

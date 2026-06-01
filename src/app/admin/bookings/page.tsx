"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  doctorName?: string;
  program?: string;
}

interface DayBookings {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
  bookings: Booking[];
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  SCHEDULED: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock },
  CONFIRMED: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  COMPLETED: { bg: "bg-gray-100", text: "text-gray-700", icon: CheckCircle },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
  NO_SHOW: { bg: "bg-orange-100", text: "text-orange-700", icon: AlertCircle },
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

  // Fetch bookings
  useEffect(() => {
    fetchBookings();
  }, [currentDate]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      // Calculate date range for the current week view
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

      const response = await fetch(
        `/api/admin/bookings?start=${startOfWeek.toISOString()}&end=${endOfWeek.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      } else {
        // Use mock data for demo
        setBookings(generateMockBookings());
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      // Use mock data for demo
      setBookings(generateMockBookings());
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock bookings for demo
  const generateMockBookings = (): Booking[] => {
    const today = new Date();
    const bookings: Booking[] = [];
    const names = [
      { first: "Sarah", last: "Mitchell" },
      { first: "James", last: "Wilson" },
      { first: "Emma", last: "Thompson" },
      { first: "Michael", last: "Brown" },
      { first: "Lisa", last: "Anderson" },
      { first: "David", last: "Taylor" },
    ];
    const types = ["CONSULTATION", "FOLLOW_UP", "REVIEW"];
    const statuses: Array<"SCHEDULED" | "CONFIRMED" | "COMPLETED"> = ["SCHEDULED", "CONFIRMED", "COMPLETED"];

    // Generate bookings for this week
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + 1 + dayOffset); // Start from Monday

      // Skip weekends for most bookings
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // 2-4 bookings per day
      const numBookings = Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < numBookings; i++) {
        const name = names[Math.floor(Math.random() * names.length)];
        const hour = 9 + Math.floor(Math.random() * 9); // 9am-5pm
        const scheduledDate = new Date(date);
        scheduledDate.setHours(hour, 0, 0, 0);

        const status = date < today ? "COMPLETED" : statuses[Math.floor(Math.random() * 2)];

        bookings.push({
          id: `booking-${dayOffset}-${i}`,
          userId: `user-${Math.random().toString(36).substr(2, 9)}`,
          patientName: `${name.first} ${name.last}`,
          patientEmail: `${name.first.toLowerCase()}.${name.last.toLowerCase()}@email.com`,
          type: types[Math.floor(Math.random() * types.length)],
          title: `Weight Management ${types[Math.floor(Math.random() * types.length)].replace("_", " ")}`,
          scheduledAt: scheduledDate.toISOString(),
          duration: 30,
          location: Math.random() > 0.3 ? "Video" : "Phone",
          status,
          doctorName: "Dr. Smith",
          program: "Weight Management",
        });
      }
    }

    return bookings.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  };

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (filterStatus !== "all" && booking.status !== filterStatus) return false;
      if (filterType !== "all" && booking.type !== filterType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          booking.patientName.toLowerCase().includes(query) ||
          booking.patientEmail.toLowerCase().includes(query) ||
          booking.title.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [bookings, filterStatus, filterType, searchQuery]);

  // Get week days for calendar
  const weekDays = useMemo((): DayBookings[] => {
    const days: DayBookings[] = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      const dayBookings = filteredBookings.filter((b) => {
        const bookingDate = new Date(b.scheduledAt);
        return (
          bookingDate.getDate() === date.getDate() &&
          bookingDate.getMonth() === date.getMonth() &&
          bookingDate.getFullYear() === date.getFullYear()
        );
      });

      const today = new Date();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      days.push({
        date: date.toISOString(),
        dayName: date.toLocaleDateString("en-AU", { weekday: "short" }),
        dayNumber: date.getDate(),
        isToday,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
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
    const today = new Date();
    const todayBookings = bookings.filter((b) => {
      const d = new Date(b.scheduledAt);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    });

    return {
      todayCount: todayBookings.length,
      weekCount: bookings.length,
      confirmedCount: bookings.filter((b) => b.status === "CONFIRMED").length,
      pendingCount: bookings.filter((b) => b.status === "SCHEDULED").length,
    };
  }, [bookings]);

  const getWeekDateRange = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return `${startOfWeek.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
    })} - ${endOfWeek.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      // Update locally first for instant feedback
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus as Booking["status"] } : b))
      );

      // API call would go here
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
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
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                        const time = new Date(booking.scheduledAt).toLocaleTimeString("en-AU", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        });

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
                            {booking.patientName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
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
                              {new Date(booking.scheduledAt).toLocaleDateString("en-AU", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(booking.scheduledAt).toLocaleTimeString("en-AU", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
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
                          {booking.status}
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
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(booking.id, "CANCELLED")}
                              className="text-red-600"
                            >
                              Cancel Booking
                            </DropdownMenuItem>
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
                    {selectedBooking.patientName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
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
                    {new Date(selectedBooking.scheduledAt).toLocaleDateString("en-AU", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time</span>
                  <span className="font-medium">
                    {new Date(selectedBooking.scheduledAt).toLocaleTimeString("en-AU", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
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
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="NO_SHOW">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedBooking.program && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Program</span>
                    <span className="font-medium">{selectedBooking.program}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

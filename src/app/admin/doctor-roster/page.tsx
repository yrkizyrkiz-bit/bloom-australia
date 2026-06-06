"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  RefreshCw,
  User,
  CalendarX,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Zap,
} from "lucide-react";

interface DoctorSchedule {
  doctor: {
    id: string;
    name: string;
    email: string;
  };
  availability: Array<{
    id: string;
    dayOfWeek: number;
    dayName: string;
    startTime: string;
    endTime: string;
    slotDuration: number;
    isRecurring: boolean;
    specificDate: string | null;
    maxBookings: number;
    status: string;
    notes: string | null;
  }>;
  blockedDates: Array<{
    id: string;
    date: string;
    reason: string | null;
  }>;
  hasSchedule: boolean;
}

interface Stats {
  totalDoctors: number;
  doctorsWithSchedule: number;
  totalAvailabilitySlots: number;
  upcomingBlockedDates: number;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const STATUS_OPTIONS = ["AVAILABLE", "LIMITED", "UNAVAILABLE"];

const MANAGE_ROLES = ["ADMIN", "SUPER_ADMIN"];

export default function DoctorRosterPage() {
  const { user } = useAuth();
  const canManageRoster = MANAGE_ROLES.includes(user?.role || "");
  const [doctors, setDoctors] = useState<DoctorSchedule[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDoctors, setExpandedDoctors] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Form state for new availability
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 4,
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
    status: "AVAILABLE",
    notes: "",
  });

  // Form state for blocked date
  const [newBlock, setNewBlock] = useState({
    blockedDate: "",
    reason: "",
  });

  const fetchRoster = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/doctor-roster?includeBlocked=true");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch roster");
      }
      const data = await response.json();
      setDoctors(data.doctors || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Error fetching roster:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load doctor roster");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const toggleDoctor = (doctorId: string) => {
    setExpandedDoctors((prev) => {
      const next = new Set(prev);
      if (next.has(doctorId)) {
        next.delete(doctorId);
      } else {
        next.add(doctorId);
      }
      return next;
    });
  };

  const handleSeedAll = async () => {
    if (!confirm("This will create default schedules (Thu/Fri/Sat 9am-7pm) for all doctors without existing schedules. Continue?")) {
      return;
    }

    setSeeding(true);
    try {
      const response = await fetch("/api/admin/doctor-roster/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(`Seeded ${data.summary.doctorsSeeded} doctors with ${data.summary.totalSlotsCreated} slots`);
        fetchRoster();
      } else {
        toast.error(data.error || "Failed to seed roster");
      }
    } catch (error) {
      console.error("Error seeding:", error);
      toast.error("Failed to seed roster");
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateAvailability = async () => {
    if (!selectedDoctor) return;

    try {
      const response = await fetch("/api/admin/doctor-roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_AVAILABILITY",
          doctorId: selectedDoctor,
          ...newSlot,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Availability created");
        setShowAddModal(false);
        setNewSlot({
          dayOfWeek: 4,
          startTime: "09:00",
          endTime: "17:00",
          slotDuration: 30,
          status: "AVAILABLE",
          notes: "",
        });
        fetchRoster();
      } else {
        toast.error(data.error || "Failed to create availability");
      }
    } catch (error) {
      console.error("Error creating availability:", error);
      toast.error("Failed to create availability");
    }
  };

  const handleCreateBlockedDate = async () => {
    if (!selectedDoctor || !newBlock.blockedDate) return;

    try {
      const response = await fetch("/api/admin/doctor-roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_BLOCKED_DATE",
          doctorId: selectedDoctor,
          ...newBlock,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Date blocked");
        setShowBlockModal(false);
        setNewBlock({ blockedDate: "", reason: "" });
        fetchRoster();
      } else {
        toast.error(data.error || "Failed to block date");
      }
    } catch (error) {
      console.error("Error blocking date:", error);
      toast.error("Failed to block date");
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    if (!confirm("Delete this availability slot?")) return;

    try {
      const response = await fetch(`/api/admin/doctor-roster?id=${id}&type=availability`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Availability deleted");
        fetchRoster();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  const handleDeleteBlockedDate = async (id: string) => {
    if (!confirm("Remove this blocked date?")) return;

    try {
      const response = await fetch(`/api/admin/doctor-roster?id=${id}&type=blockedDate`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Blocked date removed");
        fetchRoster();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to remove");
      }
    } catch (error) {
      console.error("Error removing:", error);
      toast.error("Failed to remove");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading doctor roster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-7 h-7 text-emerald-600" />
                Doctor Roster Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage doctor availability schedules and blocked dates
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchRoster}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              {canManageRoster && (
                <button
                  onClick={handleSeedAll}
                  disabled={seeding}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {seeding ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Seed Default Schedules
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDoctors}</p>
                  <p className="text-sm text-gray-500">Total Doctors</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.doctorsWithSchedule}</p>
                  <p className="text-sm text-gray-500">With Schedules</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAvailabilitySlots}</p>
                  <p className="text-sm text-gray-500">Availability Slots</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <CalendarX className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingBlockedDates}</p>
                  <p className="text-sm text-gray-500">Blocked Dates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {doctors.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Doctors Found</h3>
            <p className="text-gray-500">
              Create doctor users with role "DOCTOR" to manage their schedules.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {doctors.map((doc) => (
              <div key={doc.doctor.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Doctor Header */}
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleDoctor(doc.doctor.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{doc.doctor.name}</h3>
                      <p className="text-sm text-gray-500">{doc.doctor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {doc.hasSchedule ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                        {doc.availability.length} slots
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                        No schedule
                      </span>
                    )}
                    {doc.blockedDates.length > 0 && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                        {doc.blockedDates.length} blocked
                      </span>
                    )}
                    {expandedDoctors.has(doc.doctor.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedDoctors.has(doc.doctor.id) && (
                  <div className="border-t border-gray-200 px-6 py-4">
                    {canManageRoster && (
                      <div className="flex gap-3 mb-6">
                        <button
                          onClick={() => {
                            setSelectedDoctor(doc.doctor.id);
                            setShowAddModal(true);
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add Availability
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDoctor(doc.doctor.id);
                            setShowBlockModal(true);
                          }}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 text-sm"
                        >
                          <CalendarX className="w-4 h-4" />
                          Block Date
                        </button>
                      </div>
                    )}

                    {/* Availability Table */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        Weekly Availability
                      </h4>
                      {doc.availability.length === 0 ? (
                        <p className="text-gray-500 text-sm bg-gray-50 rounded-lg p-4">
                          {canManageRoster
                            ? 'No availability configured. Click "Add Availability" or "Seed Default Schedules".'
                            : "No availability configured for this doctor yet."}
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Day</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Hours</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Slot Duration</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                                {canManageRoster && (
                                  <th className="px-4 py-2 text-right font-medium text-gray-600">Actions</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {doc.availability
                                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                                .map((slot) => (
                                  <tr key={slot.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{slot.dayName}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                      {slot.startTime} - {slot.endTime}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{slot.slotDuration} min</td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          slot.status === "AVAILABLE"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : slot.status === "LIMITED"
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-red-100 text-red-700"
                                        }`}
                                      >
                                        {slot.status}
                                      </span>
                                    </td>
                                    {canManageRoster && (
                                      <td className="px-4 py-3 text-right">
                                        <button
                                          onClick={() => handleDeleteAvailability(slot.id)}
                                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Blocked Dates */}
                    {doc.blockedDates.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <CalendarX className="w-4 h-4 text-red-600" />
                          Blocked Dates
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {doc.blockedDates.map((block) => (
                            <div
                              key={block.id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg"
                            >
                              <span className="text-sm text-red-700">
                                {new Date(block.date).toLocaleDateString("en-AU", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                              {block.reason && (
                                <span className="text-xs text-red-500">({block.reason})</span>
                              )}
                              {canManageRoster && (
                                <button
                                  onClick={() => handleDeleteBlockedDate(block.id)}
                                  className="p-0.5 text-red-500 hover:text-red-700"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Availability Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Add Availability</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                <select
                  value={newSlot.dayOfWeek}
                  onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration (min)</label>
                  <select
                    value={newSlot.slotDuration}
                    onChange={(e) => setNewSlot({ ...newSlot, slotDuration: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newSlot.status}
                    onChange={(e) => setNewSlot({ ...newSlot, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={newSlot.notes}
                  onChange={(e) => setNewSlot({ ...newSlot, notes: e.target.value })}
                  placeholder="e.g., Telehealth only"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAvailability}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Add Availability
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Date Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Block Date</h3>
              <button onClick={() => setShowBlockModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date to Block</label>
                <input
                  type="date"
                  value={newBlock.blockedDate}
                  onChange={(e) => setNewBlock({ ...newBlock, blockedDate: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                  placeholder="e.g., Annual leave, Conference"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBlockedDate}
                disabled={!newBlock.blockedDate}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Block Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

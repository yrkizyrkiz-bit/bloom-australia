"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Users,
  Activity,
  Calendar,
  UserPlus,
  Bell,
  ChevronRight,
  Search,
  Filter,
  Loader2,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { QRCodePanel } from "@/components/gp/QRCodePanel";

interface Patient {
  id: string;
  name: string;
  fullName: string;
  program: string;
  enrolled: string;
  lastCheckIn: string | null;
  biomarkerStatus: "normal" | "review" | "action";
  membershipStatus: string;
  carePartner: string | null;
  nextConsult: string | null;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  patientName: string | null;
  patientId: string | null;
  timestamp: string;
  read: boolean;
}

interface Stats {
  totalPatients: number;
  activePatients: number;
  recentlyActivePatients: number;
  upcomingConsults: number;
  patientsWithFlags: number;
  unreadNotifications: number;
}

interface ClinicInfo {
  name: string;
  gpName: string;
  status: string;
}

export default function GPDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Referral form state
  const [referralForm, setReferralForm] = useState({
    patientFirstName: "",
    patientLastName: "",
    patientEmail: "",
    patientMobile: "",
    program: "",
    clinicalNote: "",
  });
  const [referralSubmitting, setReferralSubmitting] = useState(false);
  const [referralSuccess, setReferralSuccess] = useState(false);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch stats
      const statsRes = await fetch("/api/gp/stats");
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data.overview);
        setClinicInfo(statsData.data.clinic);
      }

      // Fetch patients
      const patientsRes = await fetch("/api/gp/patients");
      const patientsData = await patientsRes.json();
      if (patientsData.success) {
        setPatients(patientsData.data.patients);
      }

      // Fetch notifications
      const notificationsRes = await fetch("/api/gp/notifications");
      const notificationsData = await notificationsRes.json();
      if (notificationsData.success) {
        setNotifications(notificationsData.data.notifications);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchData();
    }
  }, [sessionStatus, fetchData]);

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReferralSubmitting(true);

    try {
      const res = await fetch("/api/referrals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(referralForm),
      });

      const data = await res.json();
      if (data.success) {
        setReferralSuccess(true);
        setReferralForm({
          patientFirstName: "",
          patientLastName: "",
          patientEmail: "",
          patientMobile: "",
          program: "",
          clinicalNote: "",
        });
        setTimeout(() => {
          setReferralSuccess(false);
          setShowReferralForm(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Referral error:", err);
    } finally {
      setReferralSubmitting(false);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await fetch("/api/gp/notifications", { method: "PUT" });
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking notifications read:", err);
    }
  };

  const getBiomarkerStatusBadge = (status: Patient["biomarkerStatus"]) => {
    const styles = {
      normal: "bg-green-100 text-green-700",
      review: "bg-amber-100 text-amber-700",
      action: "bg-red-100 text-red-700",
    };
    const labels = {
      normal: "All normal",
      review: "Review recommended",
      action: "Action required",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1D9E75]" />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#5c7a52] mb-4">Please log in to access the dashboard</p>
          <Link href="/gp/login" className="text-[#1D9E75] hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const displayName = clinicInfo?.gpName || session?.user?.name || "Doctor";
  const displayClinicName = clinicInfo?.name || session?.user?.clinicName || "Your Clinic";

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="bg-white border-b border-[#e6ebe3] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-serif text-[#34412f]">
                sanative
              </Link>
              <span className="hidden sm:block px-2 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-xs font-medium rounded">
                GP Portal
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden md:block text-sm text-[#34412f]">
                {displayName}
              </span>
              <div className="relative">
                <button className="p-2 hover:bg-[#e6ebe3] rounded-full relative">
                  <Bell className="w-5 h-5 text-[#5c7a52]" />
                  {(stats?.unreadNotifications || 0) > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-2 hover:bg-[#e6ebe3] rounded-full"
              >
                <LogOut className="w-5 h-5 text-[#5c7a52]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-serif text-[#34412f]">
            {displayClinicName}
          </h1>
          <p className="text-[#5c7a52]">Welcome back, {displayName}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchData}
              className="text-red-700 underline text-sm mt-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-[#e6ebe3]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#1D9E75]/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#1D9E75]" />
              </div>
              <span className="text-sm text-[#5c7a52]">Total enrolled</span>
            </div>
            <p className="text-3xl font-bold text-[#34412f]">
              {stats?.totalPatients || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#e6ebe3]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#1D9E75]/10 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#1D9E75]" />
              </div>
              <span className="text-sm text-[#5c7a52]">Active (30 days)</span>
            </div>
            <p className="text-3xl font-bold text-[#34412f]">
              {stats?.recentlyActivePatients || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#e6ebe3]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#1D9E75]/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#1D9E75]" />
              </div>
              <span className="text-sm text-[#5c7a52]">Upcoming consults</span>
            </div>
            <p className="text-3xl font-bold text-[#34412f]">
              {stats?.upcomingConsults || 0}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* QR Code Panel */}
            <QRCodePanel />

            {/* Manual Referral */}
            <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#34412f]">
                  Refer a patient
                </h2>
                <button
                  onClick={() => setShowReferralForm(!showReferralForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1D9E75]/10 text-[#1D9E75] rounded-lg text-sm hover:bg-[#1D9E75]/20 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  New referral
                </button>
              </div>

              {showReferralForm && (
                <div className="border-t border-[#e6ebe3] pt-4 mt-4">
                  {referralSuccess ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center">
                      Referral sent successfully!
                    </div>
                  ) : (
                    <form onSubmit={handleReferralSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Patient first name"
                          value={referralForm.patientFirstName}
                          onChange={(e) =>
                            setReferralForm({ ...referralForm, patientFirstName: e.target.value })
                          }
                          required
                          className="px-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75] text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Patient last name"
                          value={referralForm.patientLastName}
                          onChange={(e) =>
                            setReferralForm({ ...referralForm, patientLastName: e.target.value })
                          }
                          className="px-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75] text-sm"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={referralForm.patientEmail}
                          onChange={(e) =>
                            setReferralForm({ ...referralForm, patientEmail: e.target.value })
                          }
                          required
                          className="px-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75] text-sm"
                        />
                        <input
                          type="tel"
                          placeholder="Mobile"
                          value={referralForm.patientMobile}
                          onChange={(e) =>
                            setReferralForm({ ...referralForm, patientMobile: e.target.value })
                          }
                          required
                          className="px-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75] text-sm"
                        />
                      </div>
                      <select
                        value={referralForm.program}
                        onChange={(e) =>
                          setReferralForm({ ...referralForm, program: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75] text-sm bg-white"
                      >
                        <option value="">Select program</option>
                        <option value="kidney-health">Kidney Health</option>
                        <option value="fatty-liver">Fatty Liver</option>
                        <option value="weight-management">Weight Management</option>
                        <option value="heart-health">Heart Health</option>
                        <option value="diabetes-care">Diabetes Care</option>
                      </select>
                      <textarea
                        placeholder="Clinical note (optional)"
                        rows={2}
                        value={referralForm.clinicalNote}
                        onChange={(e) =>
                          setReferralForm({ ...referralForm, clinicalNote: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75] text-sm resize-none"
                      />
                      <button
                        type="submit"
                        disabled={referralSubmitting}
                        className="px-6 py-2 bg-[#1D9E75] text-white rounded-lg text-sm hover:bg-[#178a64] transition-colors disabled:opacity-50"
                      >
                        {referralSubmitting ? "Sending..." : "Send referral"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Patient List */}
            <div className="bg-white rounded-2xl border border-[#e6ebe3]">
              <div className="p-6 border-b border-[#e6ebe3]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-[#34412f]">
                    Enrolled patients
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search patients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75] text-sm w-48"
                      />
                    </div>
                    <button className="p-2 border border-[#e6ebe3] rounded-lg hover:border-[#1D9E75]">
                      <Filter className="w-4 h-4 text-[#5c7a52]" />
                    </button>
                  </div>
                </div>
              </div>

              {filteredPatients.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-[#5c7a52]">
                    {patients.length === 0
                      ? "No patients enrolled yet"
                      : "No patients match your search"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-[#5c7a52] uppercase tracking-wider border-b border-[#e6ebe3]">
                        <th className="px-6 py-3">Patient</th>
                        <th className="px-6 py-3">Program</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Next consult</th>
                        <th className="px-6 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((patient) => (
                        <tr
                          key={patient.id}
                          className="border-b border-[#e6ebe3] hover:bg-[#fdfbf7]"
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium text-[#34412f]">
                              {patient.name}
                            </p>
                            <p className="text-xs text-[#5c7a52]">
                              Enrolled{" "}
                              {new Date(patient.enrolled).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-[#34412f]">
                              {patient.program}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {getBiomarkerStatusBadge(patient.biomarkerStatus)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-[#5c7a52]">
                              {patient.nextConsult
                                ? new Date(patient.nextConsult).toLocaleDateString()
                                : "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/gp/patients/${patient.id}`}
                              className="text-[#1D9E75] hover:text-[#178a64] text-sm"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#34412f]">
                  Notifications
                </h2>
                {notifications.some((n) => !n.read) && (
                  <button
                    onClick={handleMarkNotificationsRead}
                    className="text-xs text-[#1D9E75] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-sm text-[#5c7a52] text-center py-4">
                  No notifications
                </p>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${
                        notification.read
                          ? "border-[#e6ebe3] bg-white"
                          : "border-[#1D9E75]/20 bg-[#1D9E75]/5"
                      }`}
                    >
                      <p className="text-sm text-[#34412f]">
                        {notification.message}
                      </p>
                      <p className="text-xs text-[#5c7a52] mt-1">
                        {notification.timestamp}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
              <h2 className="text-lg font-semibold text-[#34412f] mb-4">
                Quick links
              </h2>
              <div className="space-y-2">
                <Link
                  href="/for-doctors"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#fdfbf7] group"
                >
                  <span className="text-sm text-[#34412f]">
                    About the program
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#5c7a52] group-hover:text-[#1D9E75]" />
                </Link>
                <Link
                  href="#"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#fdfbf7] group"
                >
                  <span className="text-sm text-[#34412f]">
                    Download info pack
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#5c7a52] group-hover:text-[#1D9E75]" />
                </Link>
                <Link
                  href="#"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#fdfbf7] group"
                >
                  <span className="text-sm text-[#34412f]">Get support</span>
                  <ChevronRight className="w-4 h-4 text-[#5c7a52] group-hover:text-[#1D9E75]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

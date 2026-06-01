"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserPlus,
  Stethoscope,
  Shield,
  HeartHandshake,
  Loader2,
  RefreshCw,
  MoreVertical,
  KeyRound,
  Pencil,
  Trash2,
  Copy,
  Check,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: "ADMIN" | "DOCTOR" | "CARE_PARTNER";
  createdAt: string;
  updatedAt: string;
  subscriptionStatus?: string;
  consultationCount?: number;
  assignedPatientCount?: number;
}

interface StaffCounts {
  admins: number;
  doctors: number;
  carePartners: number;
  total: number;
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [counts, setCounts] = useState<StaffCounts>({ admins: 0, doctors: 0, carePartners: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Create dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newStaff, setNewStaff] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "DOCTOR" as "ADMIN" | "DOCTOR" | "CARE_PARTNER",
    password: "",
    autoGeneratePassword: true,
  });
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    role: "DOCTOR" as "ADMIN" | "DOCTOR" | "CARE_PARTNER",
  });
  const [saving, setSaving] = useState(false);

  // Reset password dialog
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetStaff, setResetStaff] = useState<StaffMember | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const [accessError, setAccessError] = useState<string | null>(null);
  const [sessionDebug, setSessionDebug] = useState<Record<string, unknown> | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setAccessError(null);

      // Also fetch session debug info
      const debugRes = await fetch("/api/admin/debug-session");
      if (debugRes.ok) {
        const debugData = await debugRes.json();
        setSessionDebug(debugData);
        console.log("[Staff Page] Session debug:", debugData);
      }

      const res = await fetch("/api/admin/staff");
      console.log("[Staff Page] API response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("[Staff Page] Staff data:", data);
        setStaff(data.staff);
        setCounts(data.counts);
      } else {
        const error = await res.json();
        console.log("[Staff Page] API error:", error);
        if (res.status === 403) {
          setAccessError(error.error || "You don't have permission to access this page");
        } else {
          toast.error(error.error || "Failed to load staff");
        }
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async () => {
    if (!newStaff.email || !newStaff.firstName || !newStaff.lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newStaff,
          password: newStaff.autoGeneratePassword ? undefined : newStaff.password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);

        // Show the generated password if auto-generated
        if (data.temporaryPassword) {
          setCreatedPassword(data.temporaryPassword);
        } else {
          setShowCreateDialog(false);
          resetCreateForm();
          fetchStaff();
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create staff member");
      }
    } catch (error) {
      console.error("Error creating staff:", error);
      toast.error("Failed to create staff member");
    } finally {
      setCreating(false);
    }
  };

  const handleEditStaff = async () => {
    if (!editingStaff) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: editingStaff.id,
          ...editForm,
        }),
      });

      if (res.ok) {
        toast.success("Staff member updated");
        setShowEditDialog(false);
        setEditingStaff(null);
        fetchStaff();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update staff member");
      }
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error("Failed to update staff member");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetStaff) return;

    setResetting(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: resetStaff.id,
          resetPassword: true,
          newPassword: newPassword || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.newPassword) {
          setGeneratedPassword(data.newPassword);
          toast.success("Password reset successfully");
        } else {
          toast.success("Password updated");
          setShowResetDialog(false);
          setResetStaff(null);
          setNewPassword("");
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/staff?staffId=${deletingStaff.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Staff member deactivated");
        setShowDeleteDialog(false);
        setDeletingStaff(null);
        fetchStaff();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to deactivate staff member");
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Failed to deactivate staff member");
    } finally {
      setDeleting(false);
    }
  };

  const resetCreateForm = () => {
    setNewStaff({
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "DOCTOR",
      password: "",
      autoGeneratePassword: true,
    });
    setCreatedPassword(null);
    setCopiedPassword(false);
  };

  const copyPassword = async (password: string) => {
    await navigator.clipboard.writeText(password);
    setCopiedPassword(true);
    toast.success("Password copied to clipboard");
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const openEditDialog = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setEditForm({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      phone: staffMember.phone || "",
      role: staffMember.role,
    });
    setShowEditDialog(true);
  };

  const openResetDialog = (staffMember: StaffMember) => {
    setResetStaff(staffMember);
    setNewPassword("");
    setGeneratedPassword(null);
    setShowResetDialog(true);
  };

  const openDeleteDialog = (staffMember: StaffMember) => {
    setDeletingStaff(staffMember);
    setShowDeleteDialog(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-purple-100 text-purple-700"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case "DOCTOR":
        return <Badge className="bg-blue-100 text-blue-700"><Stethoscope className="w-3 h-3 mr-1" />Doctor</Badge>;
      case "CARE_PARTNER":
        return <Badge className="bg-green-100 text-green-700"><HeartHandshake className="w-3 h-3 mr-1" />Care Partner</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const filteredStaff = staff.filter(s => {
    if (activeTab === "all") return true;
    if (activeTab === "admins") return s.role === "ADMIN";
    if (activeTab === "doctors") return s.role === "DOCTOR";
    if (activeTab === "care-partners") return s.role === "CARE_PARTNER";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-md mx-auto mt-20">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
              <p className="text-slate-500 mb-4">{accessError}</p>
              <p className="text-sm text-slate-400 mb-6">
                Only users with the ADMIN role can manage staff accounts.
              </p>
              {sessionDebug && (
                <div className="text-left bg-slate-100 rounded-lg p-4 mb-6 text-xs font-mono">
                  <p className="font-bold mb-2">Session Debug:</p>
                  <pre className="overflow-auto">{JSON.stringify(sessionDebug, null, 2)}</pre>
                </div>
              )}
              <div className="space-y-3">
                <Button asChild>
                  <a href="/admin">Back to Dashboard</a>
                </Button>
                <p className="text-xs text-slate-400">
                  If you believe you should have access, try logging out and logging back in as admin@sanative.com.au
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
            <p className="text-slate-500">Manage doctors, admins, and care partners</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={fetchStaff} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />Refresh
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />Add Staff Member
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Users className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts.total}</p>
                  <p className="text-sm text-slate-500">Total Staff</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts.admins}</p>
                  <p className="text-sm text-slate-500">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts.doctors}</p>
                  <p className="text-sm text-slate-500">Doctors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <HeartHandshake className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts.carePartners}</p>
                  <p className="text-sm text-slate-500">Care Partners</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.total})</TabsTrigger>
            <TabsTrigger value="admins">Admins ({counts.admins})</TabsTrigger>
            <TabsTrigger value="doctors">Doctors ({counts.doctors})</TabsTrigger>
            <TabsTrigger value="care-partners">Care Partners ({counts.carePartners})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Staff List */}
        <Card>
          <CardContent className="p-0">
            {filteredStaff.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No staff members found</p>
                <p className="text-sm mt-1">Click "Add Staff Member" to create one</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredStaff.map((staffMember) => (
                  <div key={staffMember.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-slate-200 text-slate-700">
                            {staffMember.firstName[0]}{staffMember.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">
                              {staffMember.firstName} {staffMember.lastName}
                            </p>
                            {getRoleBadge(staffMember.role)}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5" />
                              {staffMember.email}
                            </span>
                            {staffMember.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" />
                                {staffMember.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm text-slate-500">
                          {staffMember.role === "DOCTOR" && staffMember.consultationCount !== undefined && (
                            <p>{staffMember.consultationCount} consultations</p>
                          )}
                          {staffMember.role === "CARE_PARTNER" && staffMember.assignedPatientCount !== undefined && (
                            <p>{staffMember.assignedPatientCount} patients assigned</p>
                          )}
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Joined {format(new Date(staffMember.createdAt), "d MMM yyyy")}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(staffMember)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openResetDialog(staffMember)}>
                              <KeyRound className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(staffMember)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Staff Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        if (!open) {
          resetCreateForm();
        }
        setShowCreateDialog(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Create a new admin, doctor, or care partner account.
            </DialogDescription>
          </DialogHeader>

          {createdPassword ? (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-800">Account Created Successfully!</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 mb-2">Temporary Password</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                    {createdPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyPassword(createdPassword)}
                  >
                    {copiedPassword ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-amber-700 mt-2">
                  Share this password securely with the staff member. They should change it after first login.
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetCreateForm();
                  fetchStaff();
                }}
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select
                    value={newStaff.role}
                    onValueChange={(v) => setNewStaff({ ...newStaff, role: v as typeof newStaff.role })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCTOR">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-blue-600" />
                          Doctor
                        </div>
                      </SelectItem>
                      <SelectItem value="CARE_PARTNER">
                        <div className="flex items-center gap-2">
                          <HeartHandshake className="w-4 h-4 text-green-600" />
                          Care Partner
                        </div>
                      </SelectItem>
                      <SelectItem value="ADMIN">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-600" />
                          Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input
                      value={newStaff.firstName}
                      onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input
                      value={newStaff.lastName}
                      onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="john.smith@sanative.com.au"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="0400 000 000"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Password</Label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newStaff.autoGeneratePassword}
                        onChange={(e) => setNewStaff({ ...newStaff, autoGeneratePassword: e.target.checked })}
                        className="rounded"
                      />
                      Auto-generate
                    </label>
                  </div>
                  {!newStaff.autoGeneratePassword && (
                    <Input
                      type="password"
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      placeholder="Enter password"
                    />
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateStaff} disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Account
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update {editingStaff?.firstName} {editingStaff?.lastName}'s details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm({ ...editForm, role: v as typeof editForm.role })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOCTOR">Doctor</SelectItem>
                  <SelectItem value="CARE_PARTNER">Care Partner</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStaff} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={(open) => {
        if (!open) {
          setGeneratedPassword(null);
          setNewPassword("");
        }
        setShowResetDialog(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {resetStaff?.firstName} {resetStaff?.lastName}.
            </DialogDescription>
          </DialogHeader>

          {generatedPassword ? (
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 mb-2">New Password</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                    {generatedPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyPassword(generatedPassword)}
                  >
                    {copiedPassword ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-amber-700 mt-2">
                  Share this password securely. They should change it after login.
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setShowResetDialog(false);
                  setResetStaff(null);
                  setGeneratedPassword(null);
                }}
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>New Password (leave empty to auto-generate)</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password or leave empty"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleResetPassword} disabled={resetting}>
                  {resetting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Reset Password
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Deactivate Staff Member
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {deletingStaff?.firstName} {deletingStaff?.lastName}?
              They will no longer be able to access the admin portal.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStaff} disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

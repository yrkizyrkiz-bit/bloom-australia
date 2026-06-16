"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface DoctorAccount {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
  role: string;
  registrationNumber: string | null;
  registrationSource: string | null;
  updatedAt: string;
}

function formatAddress(doctor: DoctorAccount): string {
  const structured = [
    doctor.addressLine1,
    doctor.addressLine2,
    [doctor.suburb, doctor.state, doctor.postcode].filter(Boolean).join(" "),
    doctor.country,
  ].filter(Boolean);

  if (structured.length > 0) return structured.join(", ");
  return doctor.address || "Not recorded";
}

export default function DoctorAccountPage() {
  const [doctor, setDoctor] = useState<DoctorAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      try {
        const res = await fetch("/api/admin/doctor/account");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load account");
        setDoctor(data.doctor);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load account");
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, []);

  const resetPassword = async () => {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setResetting(true);
    try {
      const res = await fetch("/api/admin/doctor/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      toast.success("Password reset successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Doctor account details could not be loaded.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/doctor">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
              Doctor Account Details
            </h1>
            <p className="text-muted-foreground">
              Contact details, registration information, and password reset.
            </p>
          </div>
        </div>
        <Badge className="w-fit bg-emerald-100 text-emerald-700 border-emerald-200">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Doctor account
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              Doctor Contact Details
            </CardTitle>
            <CardDescription>
              These details identify the doctor account used for consultations and prescribing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{doctor.fullName}</p>
                  <p className="text-sm text-muted-foreground">{doctor.role.replace(/_/g, " ")}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
                <p className="mt-1 font-medium break-all">{doctor.email}</p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  Phone
                </div>
                <p className="mt-1 font-medium">{doctor.phone || "Not recorded"}</p>
              </div>
              <div className="rounded-lg border p-3 sm:col-span-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  Contact address
                </div>
                <p className="mt-1 font-medium">{formatAddress(doctor)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-blue-700 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Registration number</p>
                  <p className="text-sm text-blue-800 mt-1">
                    {doctor.registrationNumber || "Not recorded"}
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    {doctor.registrationSource
                      ? `Source: ${doctor.registrationSource}`
                      : "Add a dedicated AHPRA / registration field to the staff profile if this must be stored directly on the doctor account."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="reset-password">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Reset Password
            </CardTitle>
            <CardDescription>
              Set a new password for this doctor login.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
            <Button
              className="w-full"
              onClick={resetPassword}
              disabled={resetting || !newPassword || !confirmPassword}
            >
              {resetting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4 mr-2" />
              )}
              Reset Password
            </Button>
            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              <Building2 className="w-4 h-4 inline mr-1" />
              Password resets are logged for account audit purposes.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

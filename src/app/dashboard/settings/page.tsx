"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Bell,
  Download,
  CreditCard,
  CheckCircle,
  Edit2,
  Save,
  X,
  Loader2
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { update: updateSession } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileData, setProfileData] = useState<{
    dateOfBirth: string | null;
    phone: string | null;
    gender: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
    gender: "",
    phone: "",
  });

  // Fetch full user profile from API (includes DOB)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setProfileData({
            dateOfBirth: data.user?.dateOfBirth || null,
            phone: data.user?.phone || null,
            gender: data.user?.gender || "OTHER",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Initialize form data when user and profile loads
  useEffect(() => {
    if (user) {
      const dob = profileData?.dateOfBirth ? new Date(profileData.dateOfBirth) : null;
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        dobDay: dob ? String(dob.getDate()) : "",
        dobMonth: dob ? String(dob.getMonth() + 1) : "",
        dobYear: dob ? String(dob.getFullYear()) : "",
        gender: profileData?.gender?.toLowerCase() || user.gender?.toLowerCase() || "",
        phone: profileData?.phone || "",
      });
    }
  }, [user, profileData]);

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "U";

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("User not found");
      return;
    }

    setIsSaving(true);

    try {
      // Construct date from day/month/year
      let dateOfBirth = null;
      if (formData.dobDay && formData.dobMonth && formData.dobYear) {
        dateOfBirth = `${formData.dobYear}-${formData.dobMonth.padStart(2, '0')}-${formData.dobDay.padStart(2, '0')}`;
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: dateOfBirth,
          gender: formData.gender || null,
          phone: formData.phone || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully", {
        description: "Your changes have been saved."
      });
      setIsEditing(false);

      // Update local profile data immediately
      setProfileData({
        dateOfBirth: dateOfBirth,
        phone: formData.phone || null,
        gender: formData.gender?.toUpperCase() || "OTHER",
      });

      // Refresh the session to get updated user data
      await updateSession();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile", {
        description: error instanceof Error ? error.message : "Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      const dob = profileData?.dateOfBirth ? new Date(profileData.dateOfBirth) : null;
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        dobDay: dob ? String(dob.getDate()) : "",
        dobMonth: dob ? String(dob.getMonth() + 1) : "",
        dobYear: dob ? String(dob.getFullYear()) : "",
        gender: profileData?.gender?.toLowerCase() || user.gender?.toLowerCase() || "",
        phone: profileData?.phone || "",
      });
    }
    setIsEditing(false);
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">
                  {user?.firstName} {user?.lastName}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </CardDescription>
              </div>
            </div>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              {isEditing ? (
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">{user?.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              {isEditing ? (
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">{user?.lastName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <p className="text-sm py-2 px-3 bg-muted rounded-md">{user?.email}</p>
              {isEditing && (
                <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              {isEditing ? (
                <div className="flex gap-2">
                  <Select
                    value={formData.dobDay}
                    onValueChange={(value) => setFormData({ ...formData, dobDay: value })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.dobMonth}
                    onValueChange={(value) => setFormData({ ...formData, dobMonth: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        { value: "1", label: "January" },
                        { value: "2", label: "February" },
                        { value: "3", label: "March" },
                        { value: "4", label: "April" },
                        { value: "5", label: "May" },
                        { value: "6", label: "June" },
                        { value: "7", label: "July" },
                        { value: "8", label: "August" },
                        { value: "9", label: "September" },
                        { value: "10", label: "October" },
                        { value: "11", label: "November" },
                        { value: "12", label: "December" },
                      ].map(month => (
                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.dobYear}
                    onValueChange={(value) => setFormData({ ...formData, dobYear: value })}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {profileData?.dateOfBirth ? (
                    <>
                      {new Date(profileData.dateOfBirth).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                      {` (${calculateAge(profileData.dateOfBirth)} years old)`}
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">Not set</span>
                  )}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              {isEditing ? (
                <Select
                  value={formData.gender.toLowerCase()}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md capitalize">
                  {profileData?.gender?.toLowerCase() || user?.gender?.toLowerCase() || <span className="text-muted-foreground italic">Not set</span>}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  type="tel"
                  placeholder="04XX XXX XXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {profileData?.phone || <span className="text-muted-foreground italic">Not set</span>}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Member Since</Label>
              <p className="text-sm py-2 px-3 bg-muted rounded-md">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Subscription</CardTitle>
              <CardDescription>Manage your membership plan</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Premium Member</h4>
                <p className="text-sm text-muted-foreground">Full access to all biomarker tracking features</p>
              </div>
            </div>
            <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
              {user?.subscriptionStatus || 'Active'}
            </Badge>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-serif font-bold text-foreground">80+</p>
              <p className="text-xs text-muted-foreground mt-1">Biomarkers Tracked</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-serif font-bold text-foreground">Unlimited</p>
              <p className="text-xs text-muted-foreground mt-1">History Access</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-serif font-bold text-foreground">AI</p>
              <p className="text-xs text-muted-foreground mt-1">Powered Reports</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { title: "New Results Available", desc: "Get notified when new biomarker results are uploaded" },
            { title: "Health Insights", desc: "Receive personalized health insights and recommendations" },
            { title: "Monthly Summary", desc: "Get a monthly overview of your health trends" },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Button variant="outline" size="sm">
                Enabled
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Data & Privacy</CardTitle>
              <CardDescription>Manage your data and privacy settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Export Your Data</p>
                <p className="text-xs text-muted-foreground">Download all your biomarker data and reports</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Download
            </Button>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Your data is encrypted and stored securely in compliance with Australian privacy laws.
              We never share your health information with third parties without your explicit consent.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

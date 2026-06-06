"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";

interface AccountData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dob: string;
}

interface NotificationSettings {
  emailResults: boolean;
  smsReminders: boolean;
  carePartnerMessages: boolean;
}

export default function DashboardAccountPage() {
  const [accountData, setAccountData] = useState<AccountData>({
    firstName: "Sarah",
    lastName: "Mitchell",
    email: "sarah.m@example.com",
    mobile: "0412 345 678",
    dob: "1985-06-15",
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailResults: true,
    smsReminders: true,
    carePartnerMessages: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mock membership data
  const membership = {
    status: "Active",
    renewalDate: "January 15, 2025",
    program: "Kidney Health",
    referringClinic: "Greenfield Medical Centre",
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountData({
      ...accountData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key],
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-serif text-[#34412f] mb-2">
        Account Settings
      </h1>
      <p className="text-[#5c7a52] mb-8">
        Manage your personal details and preferences
      </p>

      <div className="space-y-6">
        {/* Personal Details */}
        <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
          <h2 className="text-lg font-semibold text-[#34412f] mb-4">
            Personal details
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#34412f] mb-1">
                First name
              </label>
              <input
                type="text"
                name="firstName"
                value={accountData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#34412f] mb-1">
                Last name
              </label>
              <input
                type="text"
                name="lastName"
                value={accountData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#34412f] mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={accountData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#34412f] mb-1">
                Mobile
              </label>
              <input
                type="tel"
                name="mobile"
                value={accountData.mobile}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#34412f] mb-1">
                Date of birth
              </label>
              <input
                type="date"
                name="dob"
                value={accountData.dob}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
          </div>
        </div>

        {/* Membership */}
        <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
          <h2 className="text-lg font-semibold text-[#34412f] mb-4">
            Membership
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#e6ebe3]">
              <span className="text-[#5c7a52]">Status</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {membership.status}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#e6ebe3]">
              <span className="text-[#5c7a52]">Program</span>
              <span className="text-[#34412f] font-medium">
                {membership.program}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#e6ebe3]">
              <span className="text-[#5c7a52]">Renewal date</span>
              <span className="text-[#34412f]">{membership.renewalDate}</span>
            </div>
            <div className="pt-2">
              <button className="text-red-600 text-sm hover:underline">
                Cancel membership
              </button>
            </div>
          </div>
        </div>

        {/* Referring Clinic */}
        <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
          <h2 className="text-lg font-semibold text-[#34412f] mb-4">
            Referring clinic
          </h2>
          <p className="text-[#34412f]">{membership.referringClinic}</p>
          <p className="text-sm text-[#5c7a52] mt-1">
            You were enrolled via QR code from this clinic
          </p>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
          <h2 className="text-lg font-semibold text-[#34412f] mb-4">
            Notifications
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-[#34412f]">Email results</span>
                <p className="text-sm text-[#5c7a52]">
                  Receive email when new results are ready
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationChange("emailResults")}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications.emailResults ? "bg-[#1D9E75]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    notifications.emailResults
                      ? "translate-x-6"
                      : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-[#34412f]">SMS reminders</span>
                <p className="text-sm text-[#5c7a52]">
                  Receive SMS for appointments and check-ins
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationChange("smsReminders")}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications.smsReminders ? "bg-[#1D9E75]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    notifications.smsReminders
                      ? "translate-x-6"
                      : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-[#34412f]">Care partner messages</span>
                <p className="text-sm text-[#5c7a52]">
                  Get notified when your care partner sends a message
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationChange("carePartnerMessages")}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications.carePartnerMessages
                    ? "bg-[#1D9E75]"
                    : "bg-gray-200"
                }`}
              >
                <span
                  className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    notifications.carePartnerMessages
                      ? "translate-x-6"
                      : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
          <h2 className="text-lg font-semibold text-[#34412f] mb-4">
            Password
          </h2>
          <button className="px-4 py-2 border border-[#e6ebe3] rounded-lg text-sm hover:border-[#1D9E75] transition-colors text-[#34412f]">
            Change password
          </button>
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
          <h2 className="text-lg font-semibold text-[#34412f] mb-4">Privacy</h2>
          <div className="flex gap-4">
            <button className="text-sm text-[#1D9E75] hover:underline">
              Download my data
            </button>
            <button className="text-sm text-red-600 hover:underline">
              Delete my account
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-[#1D9E75] text-white rounded-lg hover:bg-[#178a64] transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save changes
              </>
            )}
          </button>
          {saveSuccess && (
            <span className="text-green-600 text-sm">Changes saved!</span>
          )}
        </div>
      </div>
    </div>
  );
}

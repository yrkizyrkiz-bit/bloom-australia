"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Droplets,
  Brain,
  Zap,
  FlaskConical,
  User,
  Mail,
  Phone,
  Loader2,
  Shield,
  Heart,
  AlertCircle,
} from "lucide-react";

// Panel configurations
const PANELS = {
  pcos: {
    id: "pcos",
    name: "PCOS & Hormone Panel",
    description: "Complete hormonal and metabolic assessment for PCOS",
    price: 199,
    icon: Droplets,
    color: "from-rose-500 to-purple-500",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    biomarkers: [
      "Fasting Insulin",
      "HOMA-IR (Insulin Resistance Index)",
      "HbA1c",
      "Fasting Glucose",
      "Testosterone (Free & Total)",
      "DHEA-S",
      "LH (Luteinizing Hormone)",
      "FSH (Follicle Stimulating Hormone)",
      "SHBG (Sex Hormone Binding Globulin)",
      "Estradiol",
      "Prolactin",
      "TSH",
      "Free T4",
      "AMH (Anti-Mullerian Hormone)",
    ],
  },
  metabolic: {
    id: "metabolic",
    name: "Metabolic Health Panel",
    description: "Insulin resistance and blood sugar assessment",
    price: 149,
    icon: Zap,
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    biomarkers: [
      "Fasting Glucose",
      "HbA1c",
      "Fasting Insulin",
      "HOMA-IR",
      "Total Cholesterol",
      "LDL Cholesterol",
      "HDL Cholesterol",
      "Triglycerides",
      "ALT",
      "AST",
      "GGT",
    ],
  },
  hormones: {
    id: "hormones",
    name: "Hormone Balance Panel",
    description: "Comprehensive hormone assessment",
    price: 169,
    icon: Brain,
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    biomarkers: [
      "Testosterone (Free & Total)",
      "Estradiol",
      "Progesterone",
      "DHEA-S",
      "Cortisol",
      "LH",
      "FSH",
      "SHBG",
      "Prolactin",
    ],
  },
};

// Time slots
const TIME_SLOTS = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
];

// Generate next 14 days for date selection
function getAvailableDates() {
  const dates = [];
  const today = new Date();

  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Skip Sundays
    if (date.getDay() !== 0) {
      dates.push(date);
    }
  }

  return dates;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function BookingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const panelParam = searchParams.get("panel") || "pcos";
  const quizScore = searchParams.get("score");
  const riskLevel = searchParams.get("risk");

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPanel, setSelectedPanel] = useState(panelParam);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    concerns: "",
    consultationRequired: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  const panel = PANELS[selectedPanel as keyof typeof PANELS] || PANELS.pcos;
  const availableDates = getAvailableDates();

  const locations = [
    { id: "sydney-cbd", name: "Sydney CBD", address: "123 George St, Sydney NSW 2000" },
    { id: "parramatta", name: "Parramatta", address: "45 Church St, Parramatta NSW 2150" },
    { id: "bondi", name: "Bondi Junction", address: "78 Oxford St, Bondi Junction NSW 2022" },
    { id: "melbourne-cbd", name: "Melbourne CBD", address: "200 Collins St, Melbourne VIC 3000" },
    { id: "brisbane-cbd", name: "Brisbane CBD", address: "100 Queen St, Brisbane QLD 4000" },
  ];

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const canProceedToStep2 = selectedPanel !== null;
  const canProceedToStep3 = selectedDate !== null && selectedTime !== null && selectedLocation !== null;
  const canSubmit = formData.firstName && formData.lastName && formData.email && formData.phone;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate booking submission
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setBookingComplete(true);
  };

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
        <Header />
        <main className="py-20">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-serif text-gray-900 mb-4">Booking Confirmed!</h1>
            <p className="text-lg text-gray-600 mb-8">
              Your {panel.name} appointment has been scheduled.
            </p>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">Appointment Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FlaskConical className="w-5 h-5 text-rose-500" />
                  <span className="text-gray-700">{panel.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-rose-500" />
                  <span className="text-gray-700">{selectedDate && formatDate(selectedDate)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-rose-500" />
                  <span className="text-gray-700">{selectedTime}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  <span className="text-gray-700">
                    {locations.find(l => l.id === selectedLocation)?.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-rose-50 rounded-xl p-6 mb-8">
              <h4 className="font-semibold text-gray-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-rose-500 mt-0.5" />
                  <span>You'll receive a confirmation email with preparation instructions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-rose-500 mt-0.5" />
                  <span>Fast for 10-12 hours before your appointment (water is okay)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-rose-500 mt-0.5" />
                  <span>Results will be available in your portal within 48-72 hours</span>
                </li>
                {formData.consultationRequired && (
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-rose-500 mt-0.5" />
                    <span>Our care team will contact you to schedule your consultation</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/metabolic-care/pcos"
                className="px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to PCOS Info
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <Header />

      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quiz Result Banner */}
          {quizScore && riskLevel && (
            <div className={`mb-8 p-4 rounded-xl border ${
              riskLevel === "High" ? "bg-rose-50 border-rose-200" :
              riskLevel === "Moderate" ? "bg-amber-50 border-amber-200" :
              "bg-green-50 border-green-200"
            }`}>
              <div className="flex items-center gap-3">
                <AlertCircle className={`w-5 h-5 ${
                  riskLevel === "High" ? "text-rose-600" :
                  riskLevel === "Moderate" ? "text-amber-600" :
                  "text-green-600"
                }`} />
                <div>
                  <p className="font-medium text-gray-900">
                    Based on your quiz results ({riskLevel} risk indication)
                  </p>
                  <p className="text-sm text-gray-600">
                    We recommend the {panel.name} to get comprehensive insights into your health.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Steps */}
          <div className="mb-10">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step
                      ? "bg-rose-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {currentStep > step ? <Check className="w-5 h-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 sm:w-24 h-1 mx-2 rounded ${
                      currentStep > step ? "bg-rose-600" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between max-w-md mx-auto mt-2 text-sm text-gray-500">
              <span>Select Panel</span>
              <span>Choose Time</span>
              <span>Your Details</span>
            </div>
          </div>

          {/* Step 1: Select Panel */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif text-gray-900 mb-2">Choose Your Testing Panel</h1>
                <p className="text-gray-600">Select the panel that best matches your health goals</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {Object.values(PANELS).map((p) => {
                  const Icon = p.icon;
                  const isSelected = selectedPanel === p.id;

                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPanel(p.id)}
                      className={`p-6 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? `${p.borderColor} ${p.bgColor} ring-2 ring-rose-500`
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{p.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{p.description}</p>
                      <p className="text-2xl font-serif text-gray-900">${p.price}</p>
                      {isSelected && (
                        <div className="mt-3 flex items-center gap-2 text-rose-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>Selected</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Panel Details */}
              {selectedPanel && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 mt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {panel.name} includes {panel.biomarkers.length} biomarkers:
                  </h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {panel.biomarkers.map((biomarker, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{biomarker}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedToStep2}
                  className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Scheduling
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Choose Date & Time */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif text-gray-900 mb-2">Schedule Your Appointment</h1>
                <p className="text-gray-600">Choose a convenient date, time, and location</p>
              </div>

              {/* Location Selection */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  Select Collection Centre
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {locations.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => setSelectedLocation(location.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedLocation === location.id
                          ? "border-rose-500 bg-rose-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-medium text-gray-900">{location.name}</p>
                      <p className="text-sm text-gray-500">{location.address}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-rose-500" />
                  Select Date
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {availableDates.map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 px-4 py-3 rounded-xl border text-center transition-all ${
                        selectedDate?.toDateString() === date.toDateString()
                          ? "border-rose-500 bg-rose-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="text-xs text-gray-500">
                        {date.toLocaleDateString("en-AU", { weekday: "short" })}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {date.getDate()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {date.toLocaleDateString("en-AU", { month: "short" })}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-rose-500" />
                  Select Time
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 px-3 rounded-lg border text-sm transition-all ${
                        selectedTime === time
                          ? "border-rose-500 bg-rose-50 text-rose-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedToStep3}
                  className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Details
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Personal Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif text-gray-900 mb-2">Your Details</h1>
                <p className="text-gray-600">Complete your booking information</p>
              </div>

              {/* Booking Summary */}
              <div className="bg-rose-50 rounded-2xl p-6 border border-rose-200">
                <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <FlaskConical className="w-5 h-5 text-rose-600" />
                    <div>
                      <p className="text-sm text-gray-500">Panel</p>
                      <p className="font-medium text-gray-900">{panel.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-rose-600" />
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-medium text-gray-900">
                        {selectedDate && formatDate(selectedDate)} at {selectedTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-rose-600" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">
                        {locations.find(l => l.id === selectedLocation)?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-rose-600" />
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium text-gray-900">${panel.price}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information Form */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleFormChange("firstName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleFormChange("lastName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange("email", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleFormChange("phone", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                      placeholder="0400 000 000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleFormChange("dateOfBirth", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Health Concerns (Optional)
                  </label>
                  <textarea
                    value={formData.concerns}
                    onChange={(e) => handleFormChange("concerns", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    rows={3}
                    placeholder="Any specific health concerns or symptoms you'd like us to know about..."
                  />
                </div>

                <div className="mt-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.consultationRequired}
                      onChange={(e) => handleFormChange("consultationRequired", e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900">
                        Add doctor consultation (+$49)
                      </span>
                      <p className="text-sm text-gray-500">
                        Book a telehealth consultation with our PCOS specialist to review your results and discuss treatment options.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Payment Notice */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900">Secure Payment</p>
                  <p>Payment of ${panel.price + (formData.consultationRequired ? 49 : 0)} will be processed securely. You can cancel or reschedule up to 24 hours before your appointment.</p>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Confirm Booking - ${panel.price + (formData.consultationRequired ? 49 : 0)}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PCOSBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}

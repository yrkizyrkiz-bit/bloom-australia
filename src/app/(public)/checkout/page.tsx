"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Lock,
  Shield,
  User,
  Mail,
  Phone,
  ChevronDown,
  Beaker,
  CheckCircle,
} from "lucide-react";

// Sample pathology centres data
const pathologyCentres = [
  {
    id: "sydney-cbd",
    name: "Sydney CBD",
    address: "123 George Street, Sydney NSW 2000",
    distance: "0.5 km",
    nextAvailable: "Tomorrow, 9:00 AM",
  },
  {
    id: "bondi",
    name: "Bondi Junction",
    address: "456 Oxford Street, Bondi Junction NSW 2022",
    distance: "3.2 km",
    nextAvailable: "Tomorrow, 10:30 AM",
  },
  {
    id: "parramatta",
    name: "Parramatta",
    address: "789 Church Street, Parramatta NSW 2150",
    distance: "18 km",
    nextAvailable: "Today, 4:00 PM",
  },
  {
    id: "chatswood",
    name: "Chatswood",
    address: "321 Victoria Avenue, Chatswood NSW 2067",
    distance: "8.5 km",
    nextAvailable: "Tomorrow, 8:30 AM",
  },
];

// Available time slots
const timeSlots = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "2:00 PM", "2:30 PM", "3:00 PM",
  "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
];

// Package details
const packages: Record<string, { name: string; price: number; markers: number }> = {
  essential: { name: "Essential Panel", price: 199, markers: 40 },
  advanced: { name: "Advanced Panel", price: 349, markers: 65 },
  complete: { name: "Complete Panel", price: 499, markers: 85 },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const method = searchParams.get("method");
  const packageId = searchParams.get("package") || "advanced";

  const [step, setStep] = useState(1);
  const [selectedCentre, setSelectedCentre] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [postcode, setPostcode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showCentres, setShowCentres] = useState(false);

  // Personal details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Payment
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const selectedPackage = packages[packageId] || packages.advanced;

  // Generate available dates (next 14 days, excluding Sundays)
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    if (date.getDay() === 0) return null; // Skip Sundays
    return {
      value: date.toISOString().split("T")[0],
      label: date.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }),
    };
  }).filter(Boolean);

  const handlePostcodeSearch = () => {
    if (postcode.length >= 4) {
      setIsSearching(true);
      setTimeout(() => {
        setIsSearching(false);
        setShowCentres(true);
      }, 800);
    }
  };

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
    }, 2000);
  };

  const canProceedStep1 = selectedCentre && selectedDate && selectedTime;
  const canProceedStep2 = firstName && lastName && email && phone;
  const canProceedStep3 = cardNumber && cardExpiry && cardCvc && cardName;

  // Auto-populate card name
  useEffect(() => {
    if (firstName && lastName && !cardName) {
      setCardName(`${firstName} ${lastName}`);
    }
  }, [firstName, lastName, cardName]);

  if (isComplete) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-[#f4f7f2] to-white py-12 lg:py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-[#5c7a52] flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-4">
              Booking confirmed!
            </h1>
            <p className="text-lg text-[#5c7a52] mb-8">
              Your biomarker test has been booked successfully.
            </p>

            <div className="bg-white rounded-2xl border border-[#e6ebe3] p-6 mb-8 text-left">
              <h3 className="font-medium text-[#2c3628] mb-4">Appointment Details</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#5c7a52] mt-0.5" />
                  <div>
                    <p className="text-[#2c3628] font-medium">
                      {pathologyCentres.find(c => c.id === selectedCentre)?.name}
                    </p>
                    <p className="text-sm text-[#7e9a72]">
                      {pathologyCentres.find(c => c.id === selectedCentre)?.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#5c7a52]" />
                  <p className="text-[#2c3628]">
                    {availableDates.find(d => d?.value === selectedDate)?.label}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#5c7a52]" />
                  <p className="text-[#2c3628]">{selectedTime}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#f4f7f2] rounded-2xl p-6 mb-8">
              <h3 className="font-medium text-[#2c3628] mb-2">What to bring</h3>
              <ul className="text-sm text-[#5c7a52] space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#5c7a52]" />
                  Photo ID (driver&apos;s licence or passport)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#5c7a52]" />
                  Medicare card (if applicable)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#5c7a52]" />
                  Booking confirmation email
                </li>
              </ul>
            </div>

            <div className="bg-[#5c7a52]/10 rounded-2xl p-6 mb-8">
              <p className="text-sm text-[#5c7a52]">
                <strong>Fasting required:</strong> Please fast for 10-12 hours before your appointment. Water is allowed.
              </p>
            </div>

            <p className="text-sm text-[#7e9a72] mb-6">
              A confirmation email has been sent to {email}
            </p>

            <Link
              href="/"
              className="btn-primary inline-flex items-center gap-2"
            >
              Return to home
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[#f4f7f2] to-white py-12 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#5c7a52]">Step {step} of 3</span>
              <span className="text-sm text-[#5c7a52]">
                {step === 1 ? "Book Appointment" : step === 2 ? "Your Details" : "Payment"}
              </span>
            </div>
            <div className="h-2 bg-[#e6ebe3] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5c7a52] rounded-full transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Order Summary - Always visible */}
          <div className="bg-white rounded-2xl border border-[#e6ebe3] p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center">
                  <Beaker className="w-6 h-6 text-[#5c7a52]" />
                </div>
                <div>
                  <p className="font-medium text-[#2c3628]">{selectedPackage.name}</p>
                  <p className="text-sm text-[#7e9a72]">{selectedPackage.markers} biomarkers</p>
                </div>
              </div>
              <p className="text-2xl font-serif text-[#2c3628]">${selectedPackage.price}</p>
            </div>
          </div>

          {/* Step 1: Book Appointment */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl lg:text-3xl font-serif text-[#2c3628] mb-2">
                Find a pathology centre
              </h1>
              <p className="text-[#5c7a52] mb-8">
                Enter your postcode to find collection centres near you
              </p>

              {/* Postcode Search */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-[#2c3628] mb-2">
                  Your postcode
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="e.g. 2000"
                    className="flex-1 px-4 py-3 rounded-xl border border-[#e6ebe3] bg-white text-[#2c3628] placeholder:text-[#a8bb9e] focus:outline-none focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
                  />
                  <button
                    type="button"
                    onClick={handlePostcodeSearch}
                    disabled={postcode.length < 4 || isSearching}
                    className="btn-primary px-6 disabled:opacity-50"
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>

              {/* Centres List */}
              {showCentres && (
                <div className="space-y-4 mb-8">
                  <h3 className="font-medium text-[#2c3628]">Nearby centres</h3>
                  {pathologyCentres.map((centre) => (
                    <button
                      key={centre.id}
                      type="button"
                      onClick={() => setSelectedCentre(centre.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        selectedCentre === centre.id
                          ? "border-[#5c7a52] bg-[#5c7a52]/5 ring-2 ring-[#5c7a52]/20"
                          : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedCentre === centre.id ? "bg-[#5c7a52]" : "bg-[#e6ebe3]"
                          }`}>
                            <MapPin className={`w-5 h-5 ${
                              selectedCentre === centre.id ? "text-white" : "text-[#5c7a52]"
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-[#2c3628]">{centre.name}</p>
                            <p className="text-sm text-[#7e9a72]">{centre.address}</p>
                            <p className="text-xs text-[#5c7a52] mt-1">
                              Next available: {centre.nextAvailable}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-[#7e9a72]">{centre.distance}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Date & Time Selection */}
              {selectedCentre && (
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-[#2c3628] mb-2">
                      Select date
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {availableDates.slice(0, 7).map((date) => date && (
                        <button
                          key={date.value}
                          type="button"
                          onClick={() => setSelectedDate(date.value)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            selectedDate === date.value
                              ? "border-[#5c7a52] bg-[#5c7a52] text-white"
                              : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6] text-[#2c3628]"
                          }`}
                        >
                          <span className="text-xs block">{date.label.split(" ")[0]}</span>
                          <span className="text-sm font-medium">{date.label.split(" ")[1]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-[#2c3628] mb-2">
                        Select time
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 px-3 rounded-lg border text-sm transition-all ${
                              selectedTime === time
                                ? "border-[#5c7a52] bg-[#5c7a52] text-white"
                                : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6] text-[#2c3628]"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-[#e6ebe3]">
                <Link href="/biomarker-intake" className="btn-secondary flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </Link>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Your Details */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl lg:text-3xl font-serif text-[#2c3628] mb-2">
                Your details
              </h1>
              <p className="text-[#5c7a52] mb-8">
                We need a few details to complete your booking
              </p>

              <div className="space-y-6 mb-8">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2c3628] mb-2">
                      First name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a8bb9e]" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jane"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#e6ebe3] bg-white text-[#2c3628] placeholder:text-[#a8bb9e] focus:outline-none focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2c3628] mb-2">
                      Last name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Smith"
                      className="w-full px-4 py-3 rounded-xl border border-[#e6ebe3] bg-white text-[#2c3628] placeholder:text-[#a8bb9e] focus:outline-none focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2c3628] mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a8bb9e]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#e6ebe3] bg-white text-[#2c3628] placeholder:text-[#a8bb9e] focus:outline-none focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2c3628] mb-2">
                    Phone number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a8bb9e]" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0412 345 678"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#e6ebe3] bg-white text-[#2c3628] placeholder:text-[#a8bb9e] focus:outline-none focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Appointment Summary */}
              <div className="bg-[#f4f7f2] rounded-2xl p-6 mb-8">
                <h3 className="font-medium text-[#2c3628] mb-4">Your appointment</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-[#5c7a52]" />
                    <span className="text-[#5c7a52]">
                      {pathologyCentres.find(c => c.id === selectedCentre)?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[#5c7a52]" />
                    <span className="text-[#5c7a52]">
                      {availableDates.find(d => d?.value === selectedDate)?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-[#5c7a52]" />
                    <span className="text-[#5c7a52]">{selectedTime}</span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-[#e6ebe3]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  Continue to payment
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl lg:text-3xl font-serif text-[#2c3628] mb-2">
                Complete payment
              </h1>
              <p className="text-[#5c7a52] mb-8">
                Secure payment powered by Stripe
              </p>

              <div className="grid lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-6">
                  {/* Card Details */}
                  <div className="bg-white rounded-2xl border border-[#e6ebe3] p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <CreditCard className="w-5 h-5 text-[#5c7a52]" />
                      <span className="font-medium text-[#2c3628]">Card details</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-[#7e9a72] mb-2">
                          Name on card
                        </label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Jane Smith"
                          className="w-full px-4 py-3 rounded-xl border border-[#e6ebe3] bg-white text-[#2c3628] placeholder:text-[#a8bb9e] focus:outline-none focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-[#7e9a72] mb-2">
                          Card number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-3 rounded-xl border border-[#e6ebe3] bg-white text-[#2c3628] placeholder:text-[#a8bb9e] focus:outline-none focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-[#7e9a72] mb-2">
                            Expiry date
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="w-full px-4 py-3 rounded-xl border border-[#e6ebe3] bg-white text-[#2c3628] placeholder:text-[#a8bb9e] focus:outline-none focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-[#7e9a72] mb-2">
                            CVC
                          </label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="123"
                            className="w-full px-4 py-3 rounded-xl border border-[#e6ebe3] bg-white text-[#2c3628] placeholder:text-[#a8bb9e] focus:outline-none focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="flex items-center gap-3 text-sm text-[#7e9a72]">
                    <Lock className="w-4 h-4" />
                    <span>Your payment details are encrypted and secure</span>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-2">
                  <div className="bg-[#f4f7f2] rounded-2xl p-6 sticky top-8">
                    <h3 className="font-medium text-[#2c3628] mb-4">Order summary</h3>

                    <div className="space-y-3 pb-4 border-b border-[#e6ebe3]">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#5c7a52]">{selectedPackage.name}</span>
                        <span className="text-[#2c3628]">${selectedPackage.price}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#5c7a52]">Pathology collection</span>
                        <span className="text-[#5c7a52]">Included</span>
                      </div>
                    </div>

                    <div className="flex justify-between py-4 border-b border-[#e6ebe3]">
                      <span className="font-medium text-[#2c3628]">Total</span>
                      <span className="text-2xl font-serif text-[#2c3628]">${selectedPackage.price}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handlePayment}
                      disabled={!canProceedStep3 || isProcessing}
                      className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Pay ${selectedPackage.price}
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-[#7e9a72]">
                      <Shield className="w-4 h-4" />
                      <span>Secure checkout</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back Button */}
              <div className="mt-8 pt-6 border-t border-[#e6ebe3]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#5c7a52] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

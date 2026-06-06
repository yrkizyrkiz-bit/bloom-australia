"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import Link from "next/link";
import { StripeCheckout } from "@/components/promo/booking/StripeCheckout";
import {
  generateAvailableDates,
  generateTimeSlots,
  formatDate,
  formatFullDate,
  type AvailableDate,
  type TimeSlot,
} from "@/lib/availability";
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Check,
  Video,
  Shield,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";

type BookingStep = "datetime" | "details" | "payment" | "confirmation";

interface ContactDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  concerns: string;
}

export default function BookingPage() {
  const [step, setStep] = useState<BookingStep>("datetime");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [dateOffset, setDateOffset] = useState(0);
  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    concerns: ""
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const availableDates = useMemo(() => generateAvailableDates(14), []);
  const visibleDates = availableDates.slice(dateOffset, dateOffset + 7);
  const timeSlots = useMemo(() =>
    selectedDate ? generateTimeSlots(selectedDate) : [],
    [selectedDate]
  );

  const handleDateSelect = (dateInfo: AvailableDate) => {
    if (!dateInfo.available) return;
    setSelectedDate(dateInfo.date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleContactChange = (field: keyof ContactDetails, value: string) => {
    setContactDetails(prev => ({ ...prev, [field]: value }));
  };

  const isDetailsValid = () => {
    return (
      contactDetails.firstName.trim() !== "" &&
      contactDetails.lastName.trim() !== "" &&
      contactDetails.email.includes("@") &&
      contactDetails.phone.length >= 10 &&
      contactDetails.dateOfBirth !== ""
    );
  };

  // Create payment intent when moving to payment step
  const initializePayment = async () => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationType: "initial",
          customerEmail: contactDetails.email,
          customerName: `${contactDetails.firstName} ${contactDetails.lastName}`,
          bookingDetails: {
            date: selectedDate?.toISOString().split("T")[0],
            time: selectedTime,
          },
        }),
      });

      const data = await response.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStep("payment");
      } else {
        setPaymentError("Failed to initialize payment. Please try again.");
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      setPaymentError("Failed to initialize payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setIsProcessing(true);

    try {
      // Create the booking
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: contactDetails.email,
          customerName: `${contactDetails.firstName} ${contactDetails.lastName}`,
          customerPhone: contactDetails.phone,
          dateOfBirth: contactDetails.dateOfBirth,
          consultationType: "initial",
          category: "womens-health",
          date: selectedDate?.toISOString().split("T")[0],
          time: selectedTime,
          paymentIntentId,
          amount: 14900,
          concerns: contactDetails.concerns,
        }),
      });

      const data = await response.json();

      if (data.booking) {
        setBookingId(data.booking.id);
        setStep("confirmation");
      }
    } catch (error) {
      console.error("Booking creation error:", error);
      setPaymentError("Payment successful but booking failed. Please contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  const steps = [
    { id: "datetime", label: "Date & Time" },
    { id: "details", label: "Your Details" },
    { id: "payment", label: "Payment" },
    { id: "confirmation", label: "Confirmed" }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[#fdf8f6] to-[#fdfbf7]">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Progress Steps */}
          {step !== "confirmation" && (
            <div className="mb-12">
              <div className="flex items-center justify-between max-w-md mx-auto">
                {steps.slice(0, 3).map((s, index) => (
                  <div key={s.id} className="flex items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm
                      ${index < currentStepIndex
                        ? 'bg-[#c17a58] text-white'
                        : index === currentStepIndex
                          ? 'bg-[#c17a58] text-white ring-4 ring-[#f8e1e1]'
                          : 'bg-[#f8e1e1] text-[#c17a58]'}
                    `}>
                      {index < currentStepIndex ? <Check className="w-5 h-5" /> : index + 1}
                    </div>
                    {index < 2 && (
                      <div className={`w-16 sm:w-24 h-1 mx-2 rounded ${
                        index < currentStepIndex ? 'bg-[#c17a58]' : 'bg-[#f8e1e1]'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between max-w-md mx-auto mt-2 text-xs text-[#7e9a72]">
                {steps.slice(0, 3).map((s) => (
                  <span key={s.id} className="text-center">{s.label}</span>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Date & Time Selection */}
          {step === "datetime" && (
            <div>
              <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-3">
                  Choose your appointment
                </h1>
                <p className="text-[#5c7a52]">
                  Select a date and time for your 30-minute consultation
                </p>
              </div>

              {/* Consultation Info Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f8e1e1] mb-8 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f8e1e1] to-[#fce4d8] flex items-center justify-center flex-shrink-0">
                  <Video className="w-8 h-8 text-[#c17a58]" />
                </div>
                <div className="text-center sm:text-left flex-grow">
                  <h3 className="font-serif text-lg text-[#2c3628]">Women's Health Consultation</h3>
                  <p className="text-sm text-[#5c7a52]">30-minute telehealth appointment with a specialist</p>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-2xl font-serif text-[#c17a58]">$149</div>
                  {/* GAP-024: Removed unsupported rebate claim */}
                  <p className="text-xs text-[#7e9a72]">Check with your insurer</p>
                </div>
              </div>

              {/* Date Selection */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f8e1e1] mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg text-[#2c3628] flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#c17a58]" />
                    Select a date
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDateOffset(Math.max(0, dateOffset - 7))}
                      disabled={dateOffset === 0}
                      className="p-2 rounded-full hover:bg-[#f8e1e1] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#5c7a52]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateOffset(Math.min(availableDates.length - 7, dateOffset + 7))}
                      disabled={dateOffset >= availableDates.length - 7}
                      className="p-2 rounded-full hover:bg-[#f8e1e1] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-[#5c7a52]" />
                    </button>
                  </div>
                </div>

                {/* Availability Notice */}
                <div className="flex items-center gap-2 mb-4 p-3 bg-[#fef4f0] rounded-xl border border-[#fce4d8]">
                  <AlertCircle className="w-4 h-4 text-[#c17a58] flex-shrink-0" />
                  <p className="text-sm text-[#5c7a52]">
                    Limited availability — only 2 appointment slots remaining this fortnight.
                    <span className="text-[#7e9a72]"> Sunday, Monday & Tuesday are fully booked.</span>
                  </p>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {visibleDates.map((dateInfo) => {
                    const isSelected = selectedDate?.toDateString() === dateInfo.date.toDateString();
                    const isAvailable = dateInfo.available;
                    return (
                      <button
                        key={dateInfo.date.toISOString()}
                        type="button"
                        onClick={() => handleDateSelect(dateInfo)}
                        disabled={!isAvailable}
                        className={`
                          p-3 rounded-xl text-center transition-all relative
                          ${isSelected
                            ? 'bg-[#c17a58] text-white shadow-lg'
                            : isAvailable
                              ? 'bg-[#fdf8f6] hover:bg-[#f8e1e1] text-[#2c3628]'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                        `}
                      >
                        <div className="text-xs opacity-70">
                          {dateInfo.date.toLocaleDateString("en-AU", { weekday: "short" })}
                        </div>
                        <div className={`text-lg font-medium ${!isAvailable ? 'line-through' : ''}`}>
                          {dateInfo.date.getDate()}
                        </div>
                        <div className="text-xs opacity-70">
                          {dateInfo.date.toLocaleDateString("en-AU", { month: "short" })}
                        </div>
                        {!isAvailable && (
                          <div className="absolute inset-x-0 bottom-1 text-[8px] text-gray-400">
                            Full
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f8e1e1] animate-fade-in">
                  <h3 className="font-serif text-lg text-[#2c3628] flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-[#c17a58]" />
                    Select a time for {formatDate(selectedDate)}
                  </h3>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => slot.available && handleTimeSelect(slot.time)}
                        disabled={!slot.available}
                        className={`
                          p-3 rounded-xl text-sm font-medium transition-all
                          ${selectedTime === slot.time
                            ? 'bg-[#c17a58] text-white shadow-lg'
                            : slot.available
                              ? 'bg-[#fdf8f6] hover:bg-[#f8e1e1] text-[#2c3628]'
                              : 'bg-gray-100 text-gray-300 cursor-not-allowed line-through'}
                        `}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  disabled={!selectedDate || !selectedTime}
                  className={`
                    flex items-center gap-2 px-8 py-4 rounded-full font-medium transition-all
                    ${selectedDate && selectedTime
                      ? 'bg-[#c17a58] hover:bg-[#a86548] text-white shadow-lg'
                      : 'bg-[#e8d5d5] text-[#9e8585] cursor-not-allowed'}
                  `}
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Contact Details */}
          {step === "details" && (
            <div>
              <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-3">
                  Your details
                </h1>
                <p className="text-[#5c7a52]">
                  Please provide your information for the consultation
                </p>
              </div>

              {/* Appointment Summary */}
              <div className="bg-gradient-to-br from-[#f8e1e1] to-[#fce4d8] rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#c17a58]" />
                  </div>
                  <div>
                    <p className="font-serif text-lg text-[#2c3628]">
                      {selectedDate && formatFullDate(selectedDate)}
                    </p>
                    <p className="text-[#5c7a52]">at {selectedTime} AEST</p>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#f8e1e1]">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#2c3628] mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c17a58]" />
                      <input
                        type="text"
                        value={contactDetails.firstName}
                        onChange={(e) => handleContactChange("firstName", e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] focus:ring-2 focus:ring-[#f8e1e1] outline-none transition-all"
                        placeholder="Jane"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2c3628] mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={contactDetails.lastName}
                      onChange={(e) => handleContactChange("lastName", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] focus:ring-2 focus:ring-[#f8e1e1] outline-none transition-all"
                      placeholder="Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2c3628] mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c17a58]" />
                      <input
                        type="email"
                        value={contactDetails.email}
                        onChange={(e) => handleContactChange("email", e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] focus:ring-2 focus:ring-[#f8e1e1] outline-none transition-all"
                        placeholder="jane@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2c3628] mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c17a58]" />
                      <input
                        type="tel"
                        value={contactDetails.phone}
                        onChange={(e) => handleContactChange("phone", e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] focus:ring-2 focus:ring-[#f8e1e1] outline-none transition-all"
                        placeholder="0400 000 000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2c3628] mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={contactDetails.dateOfBirth}
                      onChange={(e) => handleContactChange("dateOfBirth", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] focus:ring-2 focus:ring-[#f8e1e1] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-[#2c3628] mb-2">
                    Main concerns or questions (optional)
                  </label>
                  <textarea
                    value={contactDetails.concerns}
                    onChange={(e) => handleContactChange("concerns", e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] focus:ring-2 focus:ring-[#f8e1e1] outline-none transition-all resize-none"
                    placeholder="Please share anything you'd like your doctor to know before your consultation..."
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep("datetime")}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-[#5c7a52] hover:text-[#2c3628] hover:bg-white transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={initializePayment}
                  disabled={!isDetailsValid() || isProcessing}
                  className={`
                    flex items-center gap-2 px-8 py-4 rounded-full font-medium transition-all
                    ${isDetailsValid() && !isProcessing
                      ? 'bg-[#c17a58] hover:bg-[#a86548] text-white shadow-lg'
                      : 'bg-[#e8d5d5] text-[#9e8585] cursor-not-allowed'}
                  `}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                {paymentError && (
                  <p className="text-red-500 text-sm mt-2">{paymentError}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === "payment" && (
            <div>
              <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-3">
                  Confirm & Pay
                </h1>
                <p className="text-[#5c7a52]">
                  Review your booking and complete payment
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Order Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f8e1e1] h-fit">
                  <h3 className="font-serif text-lg text-[#2c3628] mb-6">Booking Summary</h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-[#5c7a52]">Consultation</span>
                      <span className="text-[#2c3628] font-medium">Women's Health</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5c7a52]">Date</span>
                      <span className="text-[#2c3628] font-medium">
                        {selectedDate && formatDate(selectedDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5c7a52]">Time</span>
                      <span className="text-[#2c3628] font-medium">{selectedTime} AEST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5c7a52]">Duration</span>
                      <span className="text-[#2c3628] font-medium">30 minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5c7a52]">Type</span>
                      <span className="text-[#2c3628] font-medium">Telehealth (Video)</span>
                    </div>
                  </div>

                  <div className="border-t border-[#f8e1e1] pt-4">
                    <div className="flex justify-between text-lg">
                      <span className="font-serif text-[#2c3628]">Total</span>
                      <span className="font-serif text-[#c17a58]">$149.00 AUD</span>
                    </div>
                    {/* GAP-024: Removed unsupported rebate claim */}
                    <p className="text-xs text-[#7e9a72] mt-2">
                      Some patients may be able to claim part of eligible services. Check with your insurer.
                    </p>
                  </div>
                </div>

                {/* Payment Form */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f8e1e1]">
                  <h3 className="font-serif text-lg text-[#2c3628] mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#c17a58]" />
                    Payment Details
                  </h3>

                  {/* Terms - before payment */}
                  <div className="mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-[#f8e1e1] text-[#c17a58] focus:ring-[#f8e1e1]"
                      />
                      <span className="text-sm text-[#5c7a52]">
                        I agree to the{" "}
                        <a href="/terms" className="text-[#c17a58] underline">Terms of Service</a>
                        {" "}and{" "}
                        <a href="/privacy" className="text-[#c17a58] underline">Privacy Policy</a>.
                        I understand this is a telehealth consultation and my information will be kept confidential.
                      </span>
                    </label>
                  </div>

                  {/* Stripe Elements */}
                  {clientSecret ? (
                    <StripeCheckout
                      clientSecret={clientSecret}
                      customerEmail={contactDetails.email}
                      agreeToTerms={agreeToTerms}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-[#c17a58]" />
                    </div>
                  )}

                  {paymentError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                      {paymentError}
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="mt-8 flex justify-start">
                <button
                  type="button"
                  onClick={() => {
                    setStep("details");
                    setClientSecret(null);
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-[#5c7a52] hover:text-[#2c3628] hover:bg-white transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === "confirmation" && (
            <div className="text-center py-10">
              <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-[#a8bb9e] to-[#7e9a72] flex items-center justify-center animate-bounce-once">
                <Check className="w-12 h-12 text-white" />
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-4">
                Booking Confirmed!
              </h1>
              <p className="text-lg text-[#5c7a52] mb-8 max-w-lg mx-auto">
                Your consultation has been successfully booked. We've sent a confirmation email with all the details.
              </p>

              {/* Booking Details Card */}
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#e6ebe3] max-w-md mx-auto mb-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#f8e1e1] to-[#fce4d8] flex items-center justify-center">
                  <Video className="w-8 h-8 text-[#c17a58]" />
                </div>

                <h3 className="font-serif text-xl text-[#2c3628] mb-4">
                  Women's Health Consultation
                </h3>

                <div className="space-y-3 text-left bg-[#fdf8f6] rounded-xl p-4 mb-6">
                  {bookingId && (
                    <div className="flex justify-between">
                      <span className="text-[#5c7a52]">Booking ID</span>
                      <span className="text-[#c17a58] font-medium">{bookingId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#5c7a52]">Date</span>
                    <span className="text-[#2c3628] font-medium">
                      {selectedDate && formatFullDate(selectedDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5c7a52]">Time</span>
                    <span className="text-[#2c3628] font-medium">{selectedTime} AEST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5c7a52]">Duration</span>
                    <span className="text-[#2c3628] font-medium">30 minutes</span>
                  </div>
                </div>

                <div className="text-sm text-[#5c7a52] space-y-2">
                  <p>
                    <strong>Next steps:</strong>
                  </p>
                  <ul className="text-left space-y-1">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#7e9a72] mt-0.5 flex-shrink-0" />
                      Check your email for the consultation link
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#7e9a72] mt-0.5 flex-shrink-0" />
                      Complete the pre-consultation form
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#7e9a72] mt-0.5 flex-shrink-0" />
                      Join 5 minutes before your appointment
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dashboard/bookings"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#c17a58] hover:bg-[#a86548] text-white rounded-full font-medium transition-all"
                >
                  View My Bookings
                </Link>
                <Link
                  href="/womens-health"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-[#fdf8f6] text-[#2c3628] rounded-full font-medium transition-all border border-[#e6ebe3]"
                >
                  Back to Women's Health
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

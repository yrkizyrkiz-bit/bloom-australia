"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { scoreWeightManagement, fetchBiomarkerCampaigns, getBiomarkerFlags, type BiomarkerCampaignData } from "@/lib/biomarkerScoring";
import { BiomarkerSnapshot } from "@/components/quiz/BiomarkerSnapshot";
import { StripePaymentForm } from "@/components/checkout/StripePaymentForm";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Info,
  Scale,
  Stethoscope,
  MessageCircle,
  Package,
  Star,
  AlertTriangle,
  Shield,
  Tag,
  Calendar,
  Clock,
  CreditCard,
  Sparkles,
  Gift,
  CheckCircle2,
  FlaskConical,
  Timer,
} from "lucide-react";

// Types
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "";
  ethnicity: string;
  currentWeight: string;
  targetWeight: string;
  height: string;
  weightLossGoal: string;
  previousAttempts: string[];
  metabolicConditions: string[];
  digestiveConditions: string[];
  cardiovascularConditions: string[];
  mentalHealthConditions: string[];
  seriousConditions: string[];
  currentMedications: string[];
  pregnancyStatus: string;
  motivations: string[];
  postcode: string;
  howHeard: string;
  otherGoals: string[];
  streetAddress: string;
  addressUnit: string;
  suburb: string;
  state: string;
  // Booking fields
  consultationDate: string;
  consultationTime: string;
  selectedSlotId: string;
  selectedBiomarkers: string[];
  selectedPlan: "core" | "precision" | "";
}

// Unified slot from booking API - doctor-agnostic
// Doctor assignment happens during triage by care partner
interface UnifiedSlot {
  slotId: string;
  startTime: string;
  endTime: string;
  timezone: string;
  appointmentType: string;
  availabilityStatus: "AVAILABLE" | "LIMITED" | "BOOKED";
  availableDoctors: number; // How many doctors are available at this time
}

// Grouped slots by day
interface DaySlots {
  date: Date;
  dateStr: string;
  dayName: string;
  slots: UnifiedSlot[];
}

// Biomarker panels - DEPRECATED in pre-approval flow (GAP-028)
// These panels are now offered post-consult when clinically indicated by doctor
// Kept for future use in post-consult care partner recommendation flow
const BIOMARKER_PANELS = [
  {
    id: "metabolic",
    name: "Metabolic Health Panel",
    description: "HbA1c, Fasting Glucose, Insulin, HOMA-IR",
    icon: "🔬",
    relevantConditions: ["insulin resistance", "type 2 diabetes", "prediabetes"],
  },
  {
    id: "thyroid",
    name: "Thyroid Function Panel",
    description: "TSH, Free T4, Free T3, Thyroid Antibodies",
    icon: "🦋",
    relevantConditions: ["thyroid", "hypothyroidism", "hyperthyroidism"],
  },
  {
    id: "liver",
    name: "Liver Health Panel",
    description: "ALT, AST, GGT, Albumin, Bilirubin",
    icon: "🫀",
    relevantConditions: ["fatty liver", "liver"],
  },
  {
    id: "inflammation",
    name: "Inflammation Markers",
    description: "CRP, ESR, Ferritin, Homocysteine",
    icon: "🔥",
    relevantConditions: ["inflammation", "chronic"],
  },
  {
    id: "hormones",
    name: "Hormone Balance Panel",
    description: "Testosterone, Estrogen, Cortisol, DHEA",
    icon: "⚖️",
    relevantConditions: ["pcos", "hormonal", "hormone"],
  },
];

// Helper to get next available consultation days (Thu, Fri, Sat only)
function getNextAvailableDays(): { date: Date; dayName: string; dateStr: string }[] {
  const days: { date: Date; dayName: string; dateStr: string }[] = [];
  const today = new Date();
  const checkDate = new Date(today);

  // Find next 2 available days (Thursday=4, Friday=5, Saturday=6)
  while (days.length < 2) {
    checkDate.setDate(checkDate.getDate() + 1);
    const dayOfWeek = checkDate.getDay();

    if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      days.push({
        date: new Date(checkDate),
        dayName: dayNames[dayOfWeek],
        dateStr: checkDate.toLocaleDateString('en-AU', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        }),
      });
    }
  }

  return days;
}

// Time slots from 9am to 7pm (1-hour intervals)
const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
  "5:00 PM", "6:00 PM", "7:00 PM"
];

// Ethnicity options
const ethnicityOptions = [
  "Aboriginal or Torres Strait Islander",
  "Caucasian / European",
  "Asian (including Indian subcontinent)",
  "Pacific Islander or Maori",
  "Middle Eastern",
  "African",
  "Latino / Hispanic",
  "Mixed heritage",
  "Prefer not to say",
];

// Weight loss goals - How much weight looking to manage
const weightLossGoals = [
  { id: "1-10", label: "A little (under 10 kg)", description: "" },
  { id: "10-25", label: "A moderate amount (10-25 kg)", description: "" },
  { id: "25+", label: "A significant amount (25+ kg)", description: "" },
  { id: "unsure", label: "I'm not sure yet", description: "" },
];

// Previous attempts
const previousAttemptsOptions = [
  "Calorie counting / tracking apps",
  "Keto or low-carb diets",
  "Intermittent fasting",
  "Exercise programs",
  "Weight loss shakes / supplements",
  "Previous prescription medications",
  "Weight loss surgery",
  "Commercial programs (e.g. Jenny Craig)",
  "None — this is my first attempt",
];

// Metabolic conditions
const metabolicConditions = [
  "High blood sugar",
  "Insulin resistance",
  "Type 2 diabetes",
  "Prediabetes",
  "Polycystic ovary syndrome (PCOS)",
  "Thyroid issues (hyper or hypothyroidism)",
  "None of these apply",
];

// Digestive conditions
const digestiveConditions = [
  "Fatty liver disease",
  "Reflux (GORD / heartburn)",
  "Irritable bowel syndrome (IBS)",
  "Crohn's disease",
  "Ulcerative colitis",
  "Gastroparesis (slow stomach emptying)",
  "Previous bowel or stomach surgery",
  "Gallstones or gallbladder removal",
  "None of these apply",
];

// Cardiovascular conditions
const cardiovascularConditions = [
  "High blood pressure",
  "High cholesterol",
  "High triglycerides",
  "Heart disease or angina",
  "Previous heart attack",
  "Heart failure",
  "Irregular heartbeat (arrhythmia)",
  "History of stroke",
  "None of these apply",
];

// Mental health conditions
const mentalHealthConditions = [
  "Depression",
  "Anxiety disorder",
  "Binge eating disorder",
  "History of anorexia or bulimia",
  "Taking psychiatric medications",
  "None of these apply",
];

// Serious conditions (contraindications)
const seriousConditions = [
  "Pancreatitis (current or history)",
  "Medullary thyroid cancer (personal or family)",
  "Multiple endocrine neoplasia type 2 (MEN2)",
  "Chronic kidney disease (eGFR < 30)",
  "Severe liver disease (cirrhosis)",
  "Active cancer treatment",
  "Pregnancy or actively trying",
  "Currently breastfeeding",
  "None of these apply",
];

// Current medications
const currentMedicationsOptions = [
  "Insulin",
  "Metformin or other diabetes medications",
  "Blood pressure medications",
  "Blood thinners (warfarin, etc.)",
  "Thyroid medications",
  "Antidepressants",
  "Anti-anxiety medications",
  "Steroids (prednisolone, etc.)",
  "None of the above",
];

// Motivations
const motivationsOptions = [
  { id: "health", label: "Improve overall health" },
  { id: "energy", label: "Have more energy" },
  { id: "mobility", label: "Move more easily" },
  { id: "confidence", label: "Feel more confident" },
  { id: "chronic", label: "Manage a chronic condition" },
  { id: "fertility", label: "Improve fertility" },
  { id: "longevity", label: "Live longer for family" },
  { id: "event", label: "Upcoming event or milestone" },
];

const howHeardOptions = [
  "Search engine",
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "Word of mouth",
  "My doctor or GP",
  "Podcast",
  "Article or blog",
  "Another telehealth service",
  "Somewhere else",
];

// ─── Quiz engagement helpers ──────────────────────────────────────────────────

function calcBMI(weightKg: string, heightCm: string): number | null {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm) / 100;
  if (!w || !h || h === 0) return null;
  return Math.round((w / (h * h)) * 10) / 10;
}

function getBMICategory(bmi: number): {
  label: string;
  eligible: boolean;
  monthlyLossKg: number;
  percentLoss: string;
} {
  if (bmi < 27) return { label: 'Not yet in range', eligible: false, monthlyLossKg: 0.5, percentLoss: '5–8%' };
  if (bmi < 30) return { label: 'Overweight', eligible: true, monthlyLossKg: 1.0, percentLoss: '10–13%' };
  if (bmi < 35) return { label: 'Obese Class I', eligible: true, monthlyLossKg: 1.3, percentLoss: '12–15%' };
  return { label: 'Obese Class II+', eligible: true, monthlyLossKg: 1.8, percentLoss: '15–20%' };
}

function getProjectedMonth(
  currentWeight: string,
  targetWeight: string,
  bmi: number | null
): number {
  const current = parseFloat(currentWeight) || 0;
  const target = parseFloat(targetWeight) || 0;
  const tolose = current - target;
  if (tolose <= 0 || !bmi) return 6;
  const { monthlyLossKg } = getBMICategory(bmi);
  return Math.ceil(tolose / monthlyLossKg);
}

function getMonthlyTargetForTimeline(
  currentWeight: string,
  targetWeight: string,
  timeline: string
): number {
  const current = parseFloat(currentWeight) || 0;
  const target = parseFloat(targetWeight) || 0;
  const tolose = current - target;
  if (tolose <= 0) return 1;
  const months = timeline === '3mo' ? 3 : timeline === '6mo' ? 6 : 12;
  return Math.round((tolose / months) * 10) / 10;
}

// Matched patient profiles — gender-aware
const PATIENT_PROFILES = {
  female: [
    { name: 'Sarah, 41 — Sydney', bmiLabel: 'BMI 31', result: 'Lost 14.2kg in 7 months', extra: 'Insulin resistance improved, liver score normalised', tags: ['–14.2kg ✓', 'Liver resolved ✓'] },
    { name: 'Michelle, 47 — Melbourne', bmiLabel: 'BMI 33', result: 'Lost 11kg in 6 months', extra: 'PCOS symptoms significantly reduced', tags: ['–11kg ✓', 'PCOS improved ✓'] },
  ],
  male: [
    { name: 'James, 44 — Brisbane', bmiLabel: 'BMI 34', result: 'Lost 16kg in 8 months', extra: 'Blood pressure normalised, energy levels improved', tags: ['–16kg ✓', 'BP normal ✓'] },
    { name: 'David, 52 — Perth', bmiLabel: 'BMI 31', result: 'Lost 12.4kg in 7 months', extra: 'Cholesterol improved, biological age reversed 3 years', tags: ['–12.4kg ✓', '–3yr bio age ✓'] },
  ],
};

function getMatchedPatient(gender: string) {
  const isFemale = gender.toLowerCase().includes('female') || gender.toLowerCase().includes('woman');
  const profiles = isFemale ? PATIENT_PROFILES.female : PATIENT_PROFILES.male;
  return profiles[Math.floor(Math.random() * profiles.length)];
}

// Check for absolute contraindications (determines eligibility screen version)
function hasAbsoluteContraindication(seriousConditions: string[]): boolean {
  if (!seriousConditions || seriousConditions.length === 0) return false;
  const absolute = ['pancreatitis', 'thyroid cancer', 'men2', 'medullary'];
  return seriousConditions.some(c =>
    absolute.some(a => c.toLowerCase().includes(a))
  );
}

// ─── End quiz engagement helpers ──────────────────────────────────────────────

// ─── CircularProgressScreen (Ro-style design) ─────────────────────────────────
function CircularProgressScreen({
  firstName,
  currentWeight,
  height,
  onComplete,
}: {
  firstName?: string;
  currentWeight: number;
  height: number;
  onComplete: () => void;
}) {
  // Calculate BMI — this is what the ring "calculates" toward
  const bmi = height > 0
    ? parseFloat((currentWeight / Math.pow(height / 100, 2)).toFixed(1))
    : 28.0;

  const [displayNum, setDisplayNum] = useState(1);
  const [ringProgress, setRingProgress] = useState(0); // 0-100

  // Duration: 3.5 seconds — NOT fast
  const DURATION = 3500;

  useEffect(() => {
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(elapsed / DURATION, 1);
      // Ease-in-out progress
      const eased = pct < 0.5
        ? 2 * pct * pct
        : 1 - Math.pow(-2 * pct + 2, 2) / 2;

      setRingProgress(eased * 100);
      // Count from 1 up to BMI value
      setDisplayNum(Math.max(1, Math.round(1 + (bmi - 1) * eased)));

      if (pct < 1) {
        requestAnimationFrame(tick);
      } else {
        setRingProgress(100);
        setDisplayNum(Math.round(bmi));
        setTimeout(onComplete, 800);
      }
    };
    requestAnimationFrame(tick);
  }, [bmi, onComplete]);

  const R = 80;
  const STROKE = 4;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference - (ringProgress / 100) * circumference;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: '#f5f5f5' }}
    >
      {/* Ring */}
      <div className="mb-10">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Background ring */}
          <circle
            cx="100" cy="100" r={R}
            fill="none"
            stroke="#e5e5e5"
            strokeWidth={STROKE}
          />
          {/* Animated green ring */}
          <circle
            cx="100" cy="100" r={R}
            fill="none"
            stroke="#22c55e"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 0.08s linear' }}
          />
          {/* Number in centre — large, dark */}
          <text
            x="100" y="112"
            textAnchor="middle"
            fontSize="52"
            fontWeight="700"
            fill="#1a1a1a"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          >
            {displayNum}
          </text>
        </svg>
      </div>

      {/* Heading */}
      <h2
        className="font-semibold text-center mb-6 px-8"
        style={{ fontSize: '22px', color: '#1a1a1a', lineHeight: '1.3' }}
      >
        Calculating your<br />potential weight loss
      </h2>

      {/* Patient's own data — personal confirmation */}
      <div className="text-center space-y-1">
        {height > 0 && (
          <p style={{ fontSize: '15px', color: '#888' }}>
            Your height {height} cm
          </p>
        )}
        {currentWeight > 0 && (
          <p style={{ fontSize: '15px', color: '#888' }}>
            Your weight {currentWeight} kg
          </p>
        )}
        <p style={{ fontSize: '15px', color: '#888', marginTop: '8px' }}>
          Calculating based on clinical data
        </p>
      </div>
    </div>
  );
}

// ─── BlurredGraphPreview ──────────────────────────────────────────────────────
function BlurredGraphPreview({
  currentWeight,
  targetWeight,
}: {
  currentWeight: number;
  targetWeight: number;
}) {
  const weightLoss = Math.max(0, currentWeight - targetWeight);
  const monthlyRate = currentWeight > 100 ? 1.8 : currentWeight > 85 ? 1.3 : 1.0;
  const goalMonths = Math.max(3, Math.ceil(weightLoss / monthlyRate));
  const totalMonths = goalMonths + 2;
  const k = -Math.log(0.05) / goalMonths;

  const W = 390, H = 240;
  const minW = targetWeight - 3;
  const maxW = currentWeight + 4;
  const toY = (w: number) => H - ((w - minW) / (maxW - minW)) * H * 0.85 - H * 0.04;
  const toX = (t: number) => (t / totalMonths) * W;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = (i / 80) * totalMonths;
    const w = targetWeight + (currentWeight - targetWeight) * Math.exp(-k * t);
    points.push({ x: toX(t), y: toY(w) });
  }

  const toPath = (pts: { x: number; y: number }[]) => {
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i-1].x + pts[i].x) / 2;
      d += ` C${cpx.toFixed(1)},${pts[i-1].y.toFixed(1)} ${cpx.toFixed(1)},${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
    }
    return d;
  };

  const goalX = toX(goalMonths);
  const goalY = toY(targetWeight);
  const goalPtIdx = Math.round((goalMonths / totalMonths) * 80);
  const fillPts = points.slice(0, goalPtIdx + 1);
  const fillPath = toPath(fillPts) + ` L${goalX},${H} L0,${H} Z`;
  const linePath = toPath(points);

  return (
    <div className="w-full">
      <div className="px-5 pt-8 pb-2">
        <p className="text-xs text-[#7e9a72] mb-1">Your weight</p>
        <p className="text-6xl font-serif text-[#2c3628] leading-none mb-1" style={{ letterSpacing: '-2px' }}>
          {currentWeight} <span style={{ fontSize: '0.55em', fontWeight: 500 }}>kg</span>
        </p>
        <p className="text-3xl font-bold text-[#5c7a52]">↓ {weightLoss.toFixed(1)} kg</p>
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="blurGrad" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#5c7a52" stopOpacity="0.28"/>
            <stop offset="100%" stopColor="#5c7a52" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#blurGrad)"/>
        <path d={linePath} fill="none" stroke="#5c7a52" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={goalX} cy={goalY} r={7} fill="#5c7a52" stroke="white" strokeWidth={2.5}/>
      </svg>
    </div>
  );
}

// ─── EmailGateScreen ─────────────────────────────────────────────────────────
function EmailGateScreen({
  currentWeight,
  targetWeight,
  firstName,
  onSubmit,
}: {
  currentWeight: number;
  targetWeight: number;
  firstName?: string;
  onSubmit: (email: string) => void | Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [existingUserInfo, setExistingUserInfo] = useState<{ firstName?: string; hasActiveProgram?: boolean } | null>(null);

  const handleSubmit = async () => {
    if (!email || !email.includes('@') || !agreed) return;
    setLoading(true);

    try {
      // Check if email already exists (non-blocking - if check fails, continue anyway)
      let emailExists = false;
      try {
        const checkRes = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase().trim() }),
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.exists) {
            emailExists = true;
            setExistingUserInfo({
              firstName: checkData.firstName,
              hasActiveProgram: checkData.hasActiveProgram,
            });
            setShowDuplicateWarning(true);
            setLoading(false);
            return; // Stop here - show duplicate warning
          }
        }
      } catch (checkError) {
        // If check fails, log and continue - don't block the user
        console.warn('[EmailGate] Email check failed, continuing anyway:', checkError);
      }

      // Email is new (or check failed) - proceed with lead capture and submission
      // Capture lead in parallel (don't wait)
      fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, source: 'weight_management_quiz_graph_gate' }),
      }).catch(() => {});

      // Call onSubmit to create user and advance to next step
      await onSubmit(email);
    } catch (error) {
      console.error('[EmailGate] Error in handleSubmit:', error);
      // Even if there's an error, try to proceed (shipping step will retry user creation)
    } finally {
      setLoading(false);
    }
  };

  const handleUseDifferentEmail = () => {
    setShowDuplicateWarning(false);
    setExistingUserInfo(null);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 pointer-events-none select-none" style={{ filter: 'blur(8px)', transform: 'scale(1.05)' }} aria-hidden="true">
        <BlurredGraphPreview currentWeight={currentWeight} targetWeight={targetWeight} />
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(253,251,247,0.3) 0%, rgba(253,251,247,0.92) 45%, rgba(253,251,247,1) 60%)' }} />
      <div className="flex-1" style={{ minHeight: '45vh' }} />

      {/* Duplicate Email Warning Modal */}
      {showDuplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-serif text-[#2c3628] text-center mb-2">
              Email Already Registered
            </h3>
            <p className="text-sm text-[#5c7a52] text-center mb-6">
              {existingUserInfo?.firstName ? (
                <>Hi {existingUserInfo.firstName}! It looks like you already have an account with us.</>
              ) : (
                <>This email address is already registered in our system.</>
              )}
            </p>

            <div className="space-y-3">
              {existingUserInfo?.hasActiveProgram ? (
                <Link
                  href="/login?redirect=/dashboard/weight-management"
                  className="block w-full py-3 bg-[#5c7a52] hover:bg-[#4a6343] text-white font-semibold rounded-xl text-center transition-colors"
                >
                  Log in to your portal
                </Link>
              ) : (
                <Link
                  href="/login?redirect=/dashboard/weight-management"
                  className="block w-full py-3 bg-[#5c7a52] hover:bg-[#4a6343] text-white font-semibold rounded-xl text-center transition-colors"
                >
                  Log in to continue your assessment
                </Link>
              )}

              <button
                onClick={handleUseDifferentEmail}
                className="w-full py-3 bg-white border-2 border-[#e6ebe3] hover:border-[#5c7a52] text-[#2c3628] font-semibold rounded-xl transition-colors"
              >
                Use a different email
              </button>

              <Link
                href="/contact"
                className="block w-full py-3 text-[#5c7a52] text-sm text-center hover:underline"
              >
                Need help? Contact us
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 bg-white rounded-t-3xl px-6 pt-6 pb-8 shadow-2xl border-t border-[#e6ebe3]">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#5c7a52] text-white rounded-full text-xs font-semibold">
            <Shield className="w-3 h-3" />
            Start from $249 for your first month
          </div>
        </div>

        <h2 className="text-2xl font-serif text-[#2c3628] text-center mb-2">See your weight loss projection</h2>
        <p className="text-sm text-[#7e9a72] text-center mb-6">
          {firstName ? `${firstName}, your personalised results are ready` : 'Your personalised results are ready'}
        </p>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border-2 border-[#e6ebe3] focus:border-[#5c7a52] rounded-2xl px-5 py-4 text-base transition-colors outline-none mb-3 bg-white"
          autoComplete="email"
          autoFocus
        />

        <div className="space-y-2 mb-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-[#cdd8c6] accent-[#5c7a52]" />
            <span className="text-xs text-[#7e9a72] leading-relaxed">
              I agree to the <a href="/privacy" className="underline text-[#5c7a52]">privacy policy</a> and consent to receiving health information from Sanative Health.
            </span>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!email || !email.includes('@') || !agreed || loading}
          className="w-full py-4 bg-[#2c3628] hover:bg-[#34412f] disabled:opacity-30 text-white font-semibold rounded-full text-base transition-colors"
        >
          {loading ? 'Checking...' : 'View results'}
        </button>

        <p className="text-center text-xs text-[#7e9a72] mt-3">Your health data stays in Australia · Cancel anytime</p>
      </div>
    </div>
  );
}

// ─── WeightLossGraph (Full Reveal) ─────────────────────────────────────────────
function WeightLossGraph({
  currentWeight,
  targetWeight,
  firstName,
  onContinue,
}: {
  currentWeight: number;
  targetWeight: number;
  firstName?: string;
  onContinue: () => void;
}) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [showGoal, setShowGoal] = useState(false);

  const weightLoss = Math.max(0, currentWeight - targetWeight);
  const monthlyRate = currentWeight > 100 ? 1.8 : currentWeight > 85 ? 1.3 : 1.0;
  const goalMonths = Math.max(3, Math.ceil(weightLoss / monthlyRate));
  const totalMonths = goalMonths + 2;
  const k = -Math.log(0.05) / goalMonths;

  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const prog = Math.min(elapsed / duration, 1);
      setAnimationProgress(prog);
      if (prog < 1) requestAnimationFrame(animate);
      else setTimeout(() => setShowGoal(true), 200);
    };
    requestAnimationFrame(animate);
  }, []);

  const W = 390, H = 200;
  const minW = targetWeight - 3;
  const maxW = currentWeight + 4;
  const toY = (w: number) => H - ((w - minW) / (maxW - minW)) * H * 0.85 - H * 0.04;
  const toX = (t: number) => (t / totalMonths) * W;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = (i / 80) * totalMonths * animationProgress;
    const w = targetWeight + (currentWeight - targetWeight) * Math.exp(-k * t);
    points.push({ x: toX(t), y: toY(w) });
  }

  const toPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i-1].x + pts[i].x) / 2;
      d += ` C${cpx.toFixed(1)},${pts[i-1].y.toFixed(1)} ${cpx.toFixed(1)},${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
    }
    return d;
  };

  const goalX = toX(goalMonths);
  const goalY = toY(targetWeight);
  const linePath = toPath(points);
  const lastPt = points[points.length - 1] || { x: 0, y: toY(currentWeight) };

  return (
    <div className="min-h-screen bg-[#fdfbf7] px-4 py-6">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <p className="text-xs text-[#7e9a72] mb-1">Your projected weight</p>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-serif text-[#2c3628]">{currentWeight}</span>
            <span className="text-2xl text-[#7e9a72]">→</span>
            <span className="text-5xl font-serif text-[#5c7a52]">{Math.round(targetWeight)}</span>
            <span className="text-lg text-[#7e9a72]">kg</span>
          </div>
          <p className="text-lg font-medium text-[#c17a58] mt-1">–{weightLoss.toFixed(1)} kg in ~{goalMonths} months</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#e6ebe3] mb-6">
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="graphGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5c7a52" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#5c7a52" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {[0, 3, 6, 9, 12].map(m => m <= totalMonths && <line key={m} x1={toX(m)} y1={0} x2={toX(m)} y2={H} stroke="#f1f5f0" strokeWidth={1}/>)}
            <line x1={0} y1={goalY} x2={W} y2={goalY} stroke="#5c7a52" strokeWidth={1} strokeDasharray="4,3" opacity={0.5}/>
            {points.length > 1 && <path d={linePath + ` L${lastPt.x},${H} L0,${H} Z`} fill="url(#graphGrad)"/>}
            <path d={linePath} fill="none" stroke="#5c7a52" strokeWidth="3" strokeLinecap="round"/>
            <circle cx={0} cy={toY(currentWeight)} r={5} fill="#2c3628"/>
            {showGoal && <circle cx={goalX} cy={goalY} r={8} fill="#5c7a52" stroke="white" strokeWidth={3} style={{ animation: 'popIn 0.3s ease' }}/>}
            {[0, 3, 6, 9, 12].map(m => m <= totalMonths && <text key={`t${m}`} x={toX(m)} y={H - 5} textAnchor="middle" fontSize="10" fill="#7e9a72">{m === 0 ? 'Now' : `${m}mo`}</text>)}
          </svg>
        </div>

        <div className="bg-[#f4f7f2] rounded-2xl p-5 mb-6">
          <p className="text-base font-semibold text-[#2c3628] mb-3">Your treatment options</p>
          <div className="flex gap-3 items-start">
            <Stethoscope className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#2c3628]">Prescription treatment, if appropriate</p>
              <p className="text-sm text-[#7e9a72] mt-0.5">
                If clinically appropriate, an AHPRA-registered doctor will prescribe evidence-based weight management medication. Delivered to your door within 3–5 business days.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#7e9a72] mb-6 leading-relaxed">
          <sup>1</sup>Based on published clinical trial data for prescription weight management medications in adults with overweight or obesity, combined with dietary and lifestyle changes. Individual results vary. Treatment prescribed only if clinically appropriate following medical assessment.
        </p>

        <button onClick={onContinue} className="w-full py-4 bg-[#5c7a52] hover:bg-[#4a6343] text-white font-semibold rounded-full text-base transition-colors flex items-center justify-center gap-2">
          Continue <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <style jsx>{`
        @keyframes popIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── AddressFormStep Component ────────────────────────────────────────────────
function AddressFormStep({
  formData,
  totalSteps,
  step,
  onSave,
}: {
  formData: FormData;
  totalSteps: number;
  step: number;
  onSave: (data: {
    streetAddress: string;
    addressUnit: string;
    suburb: string;
    state: string;
    postcode: string;
    phone: string;
  }) => void;
}) {
  const [addressInput, setAddressInput] = useState(formData.streetAddress || '');
  const [unit, setUnit] = useState(formData.addressUnit || '');
  const [suburb, setSuburb] = useState(formData.suburb || '');
  const [stateVal, setStateVal] = useState(formData.state || '');
  const [postcode, setPostcode] = useState(formData.postcode || '');
  const [mobile, setMobile] = useState(formData.phone || '');
  const [expanded, setExpanded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!addressInput.trim()) e.address = 'Address is required';
    if (!suburb.trim()) e.suburb = 'Suburb is required';
    if (!stateVal.trim()) e.state = 'State is required';
    if (!postcode.trim()) e.postcode = 'Postcode is required';
    if (!mobile.trim()) e.mobile = 'Mobile number is required';
    else if (!/^(\+61|0)[4-9]\d{8}$/.test(mobile.replace(/\s/g, ''))) {
      e.mobile = 'Enter a valid Australian mobile number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      streetAddress: addressInput,
      addressUnit: unit,
      suburb,
      state: stateVal,
      postcode,
      phone: mobile,
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-5 pt-6 pb-8">
      {/* Progress bar */}
      <div className="w-full h-0.5 bg-gray-100 mb-6">
        <div className="h-full bg-gray-900 transition-all"
          style={{ width: `${(step / totalSteps) * 100}%` }} />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        Delivery information
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        We deliver prescription treatment right to your door
      </p>

      <div className="flex-1 space-y-3">

        {/* Street address input */}
        <div>
          <input
            type="text"
            placeholder="Start typing your address..."
            value={addressInput}
            onChange={e => {
              setAddressInput(e.target.value);
              if (!expanded && e.target.value.length > 5) setExpanded(true);
            }}
            autoComplete="street-address"
            className={`w-full border-2 rounded-2xl px-5 py-4 text-base
              outline-none transition-colors ${
              errors.address
                ? 'border-red-400'
                : 'border-gray-200 focus:border-gray-900'
            }`}
          />
          {errors.address && <p className="text-xs text-red-500 mt-1 ml-1">{errors.address}</p>}
        </div>

        {/* Expanded address fields — shown after autocomplete or manual entry */}
        {expanded && (
          <>
            <input
              type="text"
              placeholder="Unit / Apt (optional)"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-gray-900
                rounded-2xl px-5 py-4 text-base outline-none transition-colors"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Suburb"
                  value={suburb}
                  onChange={e => setSuburb(e.target.value)}
                  className={`w-full border-2 rounded-2xl px-4 py-4 text-base
                    outline-none transition-colors ${
                    errors.suburb
                      ? 'border-red-400'
                      : 'border-gray-200 focus:border-gray-900'
                  }`}
                />
                {errors.suburb && (
                  <p className="text-xs text-red-500 mt-1 ml-1">{errors.suburb}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Postcode"
                  value={postcode}
                  onChange={e => setPostcode(e.target.value)}
                  maxLength={4}
                  className={`w-full border-2 rounded-2xl px-4 py-4 text-base
                    outline-none transition-colors ${
                    errors.postcode
                      ? 'border-red-400'
                      : 'border-gray-200 focus:border-gray-900'
                  }`}
                />
                {errors.postcode && (
                  <p className="text-xs text-red-500 mt-1 ml-1">{errors.postcode}</p>
                )}
              </div>
            </div>
            {/* State dropdown */}
            <select
              value={stateVal}
              onChange={e => setStateVal(e.target.value)}
              className={`w-full border-2 rounded-2xl px-5 py-4 text-base
                outline-none transition-colors bg-white appearance-none ${
                errors.state
                  ? 'border-red-400'
                  : 'border-gray-200 focus:border-gray-900'
              }`}
            >
              <option value="">Select state / territory</option>
              {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </>
        )}

        {/* "Enter address manually" toggle */}
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-sm text-gray-400 underline text-left px-1"
          >
            Enter address manually
          </button>
        )}

        {/* Mobile number */}
        <div className="pt-2">
          <input
            type="tel"
            placeholder="Mobile number"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            autoComplete="tel"
            className={`w-full border-2 rounded-2xl px-5 py-4 text-base
              outline-none transition-colors ${
              errors.mobile
                ? 'border-red-400'
                : 'border-gray-200 focus:border-gray-900'
            }`}
          />
          {errors.mobile && (
            <p className="text-xs text-red-500 mt-1 ml-1">{errors.mobile}</p>
          )}
        </div>

        {/* SMS consent — required for Twilio/AHPRA compliance */}
        <div className="bg-gray-50 rounded-2xl px-4 py-4 text-xs text-gray-500
          leading-relaxed">
          As part of our clinical care process, Sanative Health may send you
          SMS messages to verify your contact details, confirm consultations,
          and provide updates from your care partner. Message frequency varies.
          You can opt out at any time by replying STOP.{' '}
          <a href="/privacy" className="underline text-gray-700">
            Privacy policy
          </a>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-4 bg-gray-900 hover:bg-black text-white
          font-semibold rounded-full text-base transition-colors mt-6"
      >
        Save and continue
      </button>

      {/* Security trust badge */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#9ca3af" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        <span className="text-xs text-gray-400 font-medium tracking-wide">
          256-BIT TLS SECURITY
        </span>
      </div>
    </div>
  );
}

// Address suggestion interface for autocomplete
interface AddressSuggestion {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
  };
}

// ─── ShippingInfoScreen Component ────────────────────────────────────────────
function ShippingInfoScreen({
  formData,
  onSave,
}: {
  formData: FormData;
  onSave: (data: {
    lastName: string;
    phone: string;
    streetAddress: string;
    addressUnit: string;
    suburb: string;
    state: string;
    postcode: string;
  }) => void | Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [localLastName, setLocalLastName] = useState(formData.lastName || '');
  const [localPhone, setLocalPhone] = useState(formData.phone || '');
  const [localAddress, setLocalAddress] = useState(formData.streetAddress || '');
  const [localUnit, setLocalUnit] = useState(formData.addressUnit || '');
  const [localSuburb, setLocalSuburb] = useState(formData.suburb || '');
  const [localState, setLocalState] = useState(formData.state || '');
  const [localPostcode, setLocalPostcode] = useState(formData.postcode || '');
  const [addressExpanded, setAddressExpanded] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Address autocomplete state
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch address suggestions from Nominatim (OpenStreetMap)
  const fetchSuggestions = async (query: string) => {
    if (query.length < 4) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: query,
          format: "json",
          addressdetails: "1",
          countrycodes: "au",
          limit: "6",
        }),
        {
          headers: {
            "User-Agent": "SanativeHealth/1.0",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle address input change with debounce
  const handleAddressInput = (value: string) => {
    setAddressQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 350);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const addr = suggestion.address;

    // Build street address
    const streetParts = [];
    if (addr.house_number) streetParts.push(addr.house_number);
    if (addr.road) streetParts.push(addr.road);
    const streetAddress = streetParts.join(" ");

    // Get suburb/city
    const suburb = addr.suburb || addr.city || addr.town || "";

    // Map state names to abbreviations
    let state = addr.state || "";
    const stateMap: Record<string, string> = {
      "New South Wales": "NSW",
      "Victoria": "VIC",
      "Queensland": "QLD",
      "Western Australia": "WA",
      "South Australia": "SA",
      "Tasmania": "TAS",
      "Australian Capital Territory": "ACT",
      "Northern Territory": "NT",
    };
    state = stateMap[state] || state;

    setLocalAddress(streetAddress);
    setLocalSuburb(suburb);
    setLocalState(state);
    setLocalPostcode(addr.postcode || '');
    setAddressQuery(streetAddress);
    setShowSuggestions(false);
    setAddressExpanded(true);
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateFields = () => {
    const errs: Record<string, string> = {};
    if (!localLastName.trim()) errs.lastName = 'Last name is required';
    if (!localPhone.trim()) errs.phone = 'Mobile number is required';
    else if (!/^(\+61|0)[4-9]\d{8}$/.test(localPhone.replace(/\s/g, ''))) {
      errs.phone = 'Enter a valid Australian mobile number';
    }
    if (!localAddress.trim()) errs.address = 'Address is required';
    if (!localSuburb.trim()) errs.suburb = 'Suburb is required';
    if (!localState.trim()) errs.state = 'State is required';
    if (!localPostcode.trim()) errs.postcode = 'Postcode is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleShippingContinue = async () => {
    if (!validateFields()) return;
    setIsSaving(true);
    try {
      await onSave({
        lastName: localLastName,
        phone: localPhone,
        streetAddress: localAddress,
        addressUnit: localUnit,
        suburb: localSuburb,
        state: localState,
        postcode: localPostcode,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-100">
        <div className="h-full bg-[#5c7a52] transition-all duration-500" style={{ width: '86%' }} />
      </div>

      <div className="flex-1 px-5 pt-6 pb-32 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Let&apos;s confirm your details
          </h1>
          <p className="text-sm text-gray-500">
            We collect delivery details now so your order can be prepared if your doctor confirms the program is clinically suitable.
          </p>
        </div>

        {/* Pre-filled Info Display */}
        <div className="bg-[#f4f7f2] rounded-2xl p-4 mb-6">
          <p className="text-xs font-medium text-[#7e9a72] uppercase tracking-wider mb-3">Your information</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">First name</span>
              <span className="font-medium text-gray-900">{formData.firstName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Date of Birth</span>
              <span className="font-medium text-gray-900">{formData.dateOfBirth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="font-medium text-gray-900 truncate ml-4 max-w-[180px]">{formData.email}</span>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
            <input
              type="text"
              value={localLastName}
              onChange={(e) => setLocalLastName(e.target.value)}
              placeholder="Enter your last name"
              autoComplete="family-name"
              className={`w-full border-2 rounded-2xl px-5 py-4 text-base outline-none transition-colors ${
                fieldErrors.lastName ? 'border-red-400' : 'border-gray-200 focus:border-[#5c7a52]'
              }`}
            />
            {fieldErrors.lastName && <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.lastName}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile number</label>
            <input
              type="tel"
              value={localPhone}
              onChange={(e) => setLocalPhone(e.target.value)}
              placeholder="0400 000 000"
              autoComplete="tel"
              className={`w-full border-2 rounded-2xl px-5 py-4 text-base outline-none transition-colors ${
                fieldErrors.phone ? 'border-red-400' : 'border-gray-200 focus:border-[#5c7a52]'
              }`}
            />
            {fieldErrors.phone && <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.phone}</p>}
          </div>

          {/* Delivery Address Section */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[#5c7a52]" />
              <p className="font-semibold text-gray-900">Delivery address</p>
            </div>

            {/* Street address with autocomplete */}
            <div className="mb-3 relative" ref={suggestionsRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Start typing your address..."
                  value={addressQuery || localAddress}
                  onChange={(e) => {
                    handleAddressInput(e.target.value);
                    setLocalAddress(e.target.value);
                    if (!addressExpanded && e.target.value.length > 5) setAddressExpanded(true);
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off"
                  className={`w-full border-2 rounded-2xl px-5 py-4 text-base outline-none transition-colors ${
                    fieldErrors.address ? 'border-red-400' : 'border-gray-200 focus:border-[#5c7a52]'
                  }`}
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-[#5c7a52]/30 border-t-[#5c7a52] rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Autocomplete suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-[#f4f7f2] transition-colors border-b border-gray-100 last:border-b-0 flex items-start gap-3"
                    >
                      <svg className="w-4 h-4 mt-1 text-[#5c7a52] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm text-gray-700 line-clamp-2">{suggestion.display_name}</span>
                    </button>
                  ))}
                </div>
              )}

              {fieldErrors.address && <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.address}</p>}
            </div>

            {/* Expanded address fields */}
            {addressExpanded && (
              <>
                <input
                  type="text"
                  placeholder="Unit / Apt (optional)"
                  value={localUnit}
                  onChange={(e) => setLocalUnit(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#5c7a52] rounded-2xl px-5 py-4 text-base outline-none transition-colors mb-3"
                />
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Suburb"
                      value={localSuburb}
                      onChange={(e) => setLocalSuburb(e.target.value)}
                      className={`w-full border-2 rounded-2xl px-4 py-4 text-base outline-none transition-colors ${
                        fieldErrors.suburb ? 'border-red-400' : 'border-gray-200 focus:border-[#5c7a52]'
                      }`}
                    />
                    {fieldErrors.suburb && <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.suburb}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Postcode"
                      value={localPostcode}
                      onChange={(e) => setLocalPostcode(e.target.value)}
                      maxLength={4}
                      className={`w-full border-2 rounded-2xl px-4 py-4 text-base outline-none transition-colors ${
                        fieldErrors.postcode ? 'border-red-400' : 'border-gray-200 focus:border-[#5c7a52]'
                      }`}
                    />
                    {fieldErrors.postcode && <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.postcode}</p>}
                  </div>
                </div>
                <select
                  value={localState}
                  onChange={(e) => setLocalState(e.target.value)}
                  className={`w-full border-2 rounded-2xl px-5 py-4 text-base outline-none transition-colors bg-white appearance-none ${
                    fieldErrors.state ? 'border-red-400' : 'border-gray-200 focus:border-[#5c7a52]'
                  }`}
                >
                  <option value="">Select state / territory</option>
                  {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {fieldErrors.state && <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.state}</p>}
              </>
            )}

            {/* Manual entry toggle */}
            {!addressExpanded && (
              <button
                type="button"
                onClick={() => setAddressExpanded(true)}
                className="text-sm text-[#5c7a52] underline text-left px-1"
              >
                Enter address manually
              </button>
            )}
          </div>

          {/* SMS consent */}
          <div className="bg-gray-50 rounded-2xl px-4 py-4 text-xs text-gray-500 leading-relaxed mt-4">
            By continuing, you agree to receive SMS notifications about your consultation and treatment. You can opt out at any time.{' '}
            <a href="/privacy" className="underline text-gray-700">Privacy policy</a>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <button
          onClick={handleShippingContinue}
          disabled={isSaving}
          className="w-full py-4 bg-[#2c3628] hover:bg-[#34412f] disabled:opacity-50 text-white font-semibold rounded-full text-lg transition-colors flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue to booking
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
        {/* Security trust badge */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <Shield className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400 font-medium tracking-wide">
            256-BIT TLS SECURITY
          </span>
        </div>
      </div>
    </div>
  );
}

export default function WeightLossAssessmentPage() {
  const [step, setStep] = useState(1);
  // UAT8-GAP-010: Disabled legacy $50 intro offer popup - conflicts with $100 first-month discount
  // The $100 discount ($349→$249 Core, $499→$399 Precision) is already shown in payment step
  const [showIntroOffer, setShowIntroOffer] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    ethnicity: "",
    currentWeight: "",
    targetWeight: "",
    height: "",
    weightLossGoal: "",
    previousAttempts: [],
    metabolicConditions: [],
    digestiveConditions: [],
    cardiovascularConditions: [],
    mentalHealthConditions: [],
    seriousConditions: [],
    currentMedications: [],
    pregnancyStatus: "",
    motivations: [],
    postcode: "",
    howHeard: "",
    otherGoals: [],
    streetAddress: "",
    addressUnit: "",
    suburb: "",
    state: "",
    consultationDate: "",
    consultationTime: "",
    selectedSlotId: "",
    selectedBiomarkers: [],
    selectedPlan: "core",
  });
  const [showFAQ, setShowFAQ] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWhyAsking, setShowWhyAsking] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [campaigns, setCampaigns] = useState<BiomarkerCampaignData[]>([]);
  const [membershipPaid, setMembershipPaid] = useState(false);
  const [biomarkersPaid, setBiomarkersPaid] = useState(false);
  const [offerCountdown, setOfferCountdown] = useState(300); // 5 minutes in seconds
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [portalMagicLink, setPortalMagicLink] = useState<string | null>(null); // Magic link for portal access

  // Booking state - UNIFIED CALENDAR (doctor assigned during triage)
  const [availableSlots, setAvailableSlots] = useState<UnifiedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [bookingHoldId, setBookingHoldId] = useState<string | null>(null);
  const [holdExpiry, setHoldExpiry] = useState<Date | null>(null);
  const [creatingHold, setCreatingHold] = useState(false);
  const [holdCountdown, setHoldCountdown] = useState(0);

  // Countdown timer for offer expiry
  useEffect(() => {
    if (offerCountdown > 0 && step >= 19) {
      const timer = setInterval(() => {
        setOfferCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [offerCountdown, step]);

  // Fetch biomarker campaigns on mount
  useEffect(() => {
    fetchBiomarkerCampaigns('WEIGHT_MANAGEMENT').then(setCampaigns);
  }, []);

  // Fetch available slots when reaching booking step
  useEffect(() => {
    if (step === 20 && availableSlots.length === 0 && !loadingSlots) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        setSlotsError(null);
        try {
          const response = await fetch('/api/bookings/availability?appointmentType=PHONE_CONSULT');
          if (!response.ok) {
            throw new Error('Failed to load available times');
          }
          const data = await response.json();
          setAvailableSlots(data.slots || []);
        } catch (error) {
          console.error('Error fetching slots:', error);
          setSlotsError('Unable to load available times. Please try again.');
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [step, availableSlots.length, loadingSlots]);

  // Hold countdown timer
  useEffect(() => {
    if (holdExpiry) {
      const timer = setInterval(() => {
        const now = new Date();
        const remaining = Math.max(0, Math.floor((holdExpiry.getTime() - now.getTime()) / 1000));
        setHoldCountdown(remaining);

        if (remaining === 0) {
          // Hold expired - reset booking state
          setBookingHoldId(null);
          setHoldExpiry(null);
          updateFormData('selectedSlotId', '');
          updateFormData('consultationDate', '');
          updateFormData('consultationTime', '');
          toast.error('Your slot reservation expired', {
            description: 'Please select a new time slot.',
          });
          // Refetch slots
          setAvailableSlots([]);
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [holdExpiry]);

  // NEW FLOW (23 steps total):
  // 1=weightLossGoal, 2=firstName, 3=currentWeight, 4=height,
  // 5=circularProgress, 6=emailGate, 7=graphReveal,
  // 8=gender, 9=DOB, 10=motivations,
  // 11=otherGoals (cross-sell),
  // 12=metabolic, 13=digestive, 14=cardio, 15=mental, 16=serious,
  // 17=currentMedications, 18=qualification, 19=shippingInfo (NEW),
  // 20=booking, 21=payment, 22=REMOVED (biomarker upsell moved to post-consult), 23=thankYou
  const totalSteps = 23;
  const progress = (step / totalSteps) * 100;

  const updateFormData = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (
    field: keyof FormData,
    value: string,
    exclusiveValue?: string
  ) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      const exclusive = exclusiveValue || "None of these apply";

      if (value === exclusive || value === "None — this is my first attempt" || value === "None of the above") {
        return { ...prev, [field]: current.includes(value) ? [] : [value] };
      }
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      }
      return {
        ...prev,
        [field]: [...current.filter(v =>
          v !== exclusive &&
          v !== "None — this is my first attempt" &&
          v !== "None of the above"
        ), value]
      };
    });
  };

  // Calculate age from DOB
  const getAge = (dob: string): number => {
    if (dob.length < 10) return 0;
    const [day, month, year] = dob.split("/").map(Number);
    if (!day || !month || !year || year < 1900) return 0;
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate BMI
  const calculateBMI = (): number | null => {
    const weight = Number.parseFloat(formData.currentWeight);
    const heightCm = Number.parseFloat(formData.height);
    if (!weight || !heightCm || heightCm < 100) return null;
    const heightM = heightCm / 100;
    return weight / (heightM * heightM);
  };

  const bmi = calculateBMI();
  const age = getAge(formData.dateOfBirth);
  const isValidAge = age >= 18;

  const canProceed = () => {
    switch (step) {
      case 1: return formData.weightLossGoal !== "";
      case 2: return formData.firstName.trim() !== "";
      case 3: return formData.currentWeight.trim() !== "";
      case 4: return formData.height.trim() !== "";
      case 5: return true; // Circular progress (auto-advances)
      case 6: return true; // Email gate (handled internally)
      case 7: return true; // Graph reveal
      case 8: return formData.gender !== "";
      case 9: return formData.dateOfBirth.length === 10 && isValidAge;
      case 10: return formData.motivations.length > 0; // Motivations (moved earlier)
      case 11: return (formData.otherGoals || []).length > 0; // Other goals cross-sell
      case 12: return formData.metabolicConditions.length > 0;
      case 13: return formData.digestiveConditions.length > 0;
      case 14: return formData.cardiovascularConditions.length > 0;
      case 15: return formData.mentalHealthConditions.length > 0;
      case 16: return formData.seriousConditions.length > 0;
      case 17: return formData.currentMedications.length > 0;
      case 18: return true; // Qualification (continue button)
      case 19: return true; // Shipping info (handled internally)
      case 20: return formData.selectedSlotId !== "" && bookingHoldId !== null; // Requires slot selection and hold
      default: return true;
    }
  };

  const animateToStep = (newStep: number, direction: 'forward' | 'backward') => {
    setAnimationDirection(direction);
    setIsAnimating(true);

    // Wait for exit animation
    setTimeout(() => {
      setStep(newStep);
      window.scrollTo(0, 0);

      // Reset animation state after enter animation completes
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 200);
  };

  const nextStep = () => {
    // Circular progress and email gate handle their own advancement
    if (step === 5 || step === 6) return;
    if (canProceed() && step < totalSteps) {
      animateToStep(step + 1, 'forward');
    }
  };

  const prevStep = () => {
    if (step > 1) {
      // Skip back over auto-advancing screens
      if (step === 7) {
        animateToStep(4, 'backward');
      } else if (step === 6) {
        animateToStep(4, 'backward');
      } else {
        animateToStep(step - 1, 'backward');
      }
    }
  };

  // Save final quiz data to database (called at biomarker step or end)
  const saveFinalQuizData = async () => {
    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programType: "WEIGHT_MANAGEMENT",
          ...formData,
          hasContraindications,
          bmi: calculateBMI(),
          // Mark as final submission - GAP-007: Using valid status
          journeyStatus: "SURVEY_COMPLETED",
          completedAt: new Date().toISOString(),
          // Include payment info
          membershipPaid,
          biomarkersPaid,
        }),
      });

      if (!response.ok) {
        console.error("[Quiz] Failed to save final data");
      } else {
        console.log("[Quiz] Final quiz data saved successfully");
      }
    } catch (error) {
      console.error("[Quiz] Error saving final data:", error);
    }
  };

  // ─── UAT8-GAP-009: LEGACY CODE - DO NOT USE ───────────────────────────────
  // This function is dead code from the old $49 consultation flow.
  // It is NO LONGER CALLED - the quiz now uses:
  // - Step 20: renderBookingScreen() with slot selection
  // - Step 21: renderPaymentScreen() with StripePaymentForm ($249/$399 first month)
  // - handlePaymentSuccess() for payment confirmation
  //
  // This function creates a $49 PaymentIntent and redirects to /payment which
  // is the old flow. It's kept here for reference only and should be removed
  // after UAT confirms the new flow is working correctly.
  // ────────────────────────────────────────────────────────────────────────────
  const handleSubmit_LEGACY_DEAD_CODE = async () => {
    console.error("[Quiz] LEGACY handleSubmit called - this should not happen!");
    // Instead of running the old $49 flow, redirect to the proper booking step
    animateToStep(20, 'forward');
    return;

    /* ORIGINAL CODE PRESERVED FOR REFERENCE - DO NOT UNCOMMENT
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // STEP 1: Send assessment data to portal — create patient record
      const intakeResponse = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programType: "WEIGHT_MANAGEMENT",
          ...formData,
          hasContraindications,
          bmi: calculateBMI(),
        }),
      });

      if (!intakeResponse.ok) {
        const err = await intakeResponse.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create patient record. Please try again.");
      }

      const { userId: newUserId } = await intakeResponse.json();
      setUserId(newUserId);

      // STEP 2: Create Stripe PaymentIntent - check for new member discount
      const hasNewMemberDiscount = sessionStorage.getItem('newMemberDiscountApplied') === 'true';
      const discountAmount = hasNewMemberDiscount ? 5000 : 0; // $50 in cents
      const baseAmount = 4900; // $49.00 AUD in cents
      const finalAmount = Math.max(0, baseAmount - discountAmount);

      const stripeResponse = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          userId: newUserId,
          program: "weight_management",
          discount: hasNewMemberDiscount ? 50 : 0,
          discountType: hasNewMemberDiscount ? "new_member_promotion" : null,
        }),
      });

      if (!stripeResponse.ok) {
        throw new Error("Payment setup failed. Please try again.");
      }

      const { clientSecret } = await stripeResponse.json();

      // STEP 3: Redirect to payment page with client secret
      if (clientSecret) {
        // Store in sessionStorage for payment page
        sessionStorage.setItem("paymentClientSecret", clientSecret);
        sessionStorage.setItem("paymentUserId", newUserId);
        sessionStorage.setItem("paymentProgram", "weight_management");
        if (hasNewMemberDiscount) {
          sessionStorage.setItem("paymentDiscount", "50");
          sessionStorage.setItem("paymentOriginalAmount", "49");
        }

        // Redirect to payment page
        window.location.href = `/payment?program=weight_management`;
      }

      setSubmissionSuccess(true);
      setStep(totalSteps);

    } catch (error: unknown) {
      console.error("Submission error:", error);
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
    */
  };

  const hasContraindications = formData.seriousConditions.some(
    c => c !== "None of these apply"
  );

  // B4: Greeting component for steps 3+
  const renderGreeting = () => {
    if (step < 3 || !formData.firstName) return null;
    return (
      <p className="text-sm text-[#5c7a52] mb-2">
        Hi {formData.firstName} —
      </p>
    );
  };

  // BMI Reveal - Step 8
  const renderBMIReveal = () => {
    const bmiValue = calcBMI(formData.currentWeight, formData.height);
    if (!bmiValue) return null;

    const cat = getBMICategory(bmiValue);
    const gaugePos = Math.min(100, Math.max(0, ((bmiValue - 18.5) / (40 - 18.5)) * 100));

    return (
      <div className="flex flex-col items-center px-4 py-8 max-w-md mx-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Calculating your profile
        </p>

        {/* BMI Gauge */}
        <div className="w-full max-w-xs mb-2">
          <div className="relative h-3 rounded-full mb-1"
            style={{ background: 'linear-gradient(to right, #3B82F6 0%, #22C55E 30%, #FCD34D 55%, #F97316 75%, #DC2626 100%)' }}>
            <div className="absolute w-1 h-5 bg-gray-900 rounded-full -top-1 -translate-x-1/2 transition-all duration-700"
              style={{ left: `${gaugePos}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Under</span><span>Healthy</span><span>Over</span><span>Obese</span>
          </div>
        </div>

        {/* BMI number */}
        <div className="text-center my-4">
          <span className="text-5xl font-bold text-gray-900">{bmiValue}</span>
          <span className="text-lg text-gray-400 ml-2">BMI</span>
          <p className="text-sm text-gray-500 mt-1">{cat.label}</p>
        </div>

        {/* BMI context message - compliant copy */}
        {cat.eligible ? (
          <div className="w-full bg-[#5c7a52]/5 border border-[#5c7a52]/20 rounded-2xl p-4 text-center mb-4">
            <p className="text-sm font-semibold text-[#5c7a52] mb-1">
              Your BMI is within the range we typically assess
            </p>
            <p className="text-xs text-[#7e9a72]">
              A doctor will determine if treatment is appropriate for you
            </p>
          </div>
        ) : (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center mb-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">
              Your doctor will assess your full profile
            </p>
            <p className="text-xs text-amber-700">
              Suitability is based on your full health picture — not BMI alone.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mb-6">
          BMI is one factor — your doctor reviews your full medical profile.
        </p>
      </div>
    );
  };

  // Calculated weight confirmation screen (replaces redundant weight loss goal selection)
  const renderWeightConfirmation = () => {
    const current = parseFloat(formData.currentWeight) || 0;
    const target = parseFloat(formData.targetWeight) || 0;
    const weightToLose = current - target;
    const bmiValue = calcBMI(formData.currentWeight, formData.height);
    const cat = bmiValue ? getBMICategory(bmiValue) : null;

    // Auto-populate weightLossGoal based on calculation
    if (!formData.weightLossGoal && weightToLose > 0) {
      let goalId = "5-10";
      if (weightToLose >= 25) goalId = "25+";
      else if (weightToLose >= 15) goalId = "15-25";
      else if (weightToLose >= 10) goalId = "10-15";
      updateFormData("weightLossGoal", goalId);
    }

    return (
      <div className="px-4 py-8 max-w-md mx-auto text-center">
        {renderGreeting()}
        <h2 className="text-2xl font-serif text-[#2c3628] mb-4">
          Your weight loss goal
        </h2>

        <div className="bg-[#f4f7f2] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-xs text-[#7e9a72] uppercase tracking-wide mb-1">Current</p>
              <p className="text-3xl font-bold text-[#2c3628]">{current}<span className="text-lg font-normal ml-1">kg</span></p>
            </div>
            <div className="text-[#5c7a52] text-2xl">→</div>
            <div className="text-center">
              <p className="text-xs text-[#7e9a72] uppercase tracking-wide mb-1">Target</p>
              <p className="text-3xl font-bold text-[#5c7a52]">{target}<span className="text-lg font-normal ml-1">kg</span></p>
            </div>
          </div>

          {weightToLose > 0 && (
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm text-[#7e9a72] mb-1">Weight to lose</p>
              <p className="text-2xl font-bold text-[#c17a58]">–{weightToLose.toFixed(1)} kg</p>
              {cat && (
                <p className="text-xs text-[#7e9a72] mt-2">
                  Based on your profile, you could reach this in ~{Math.ceil(weightToLose / cat.monthlyLossKg)} months
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-[#5c7a52]">
          Your doctor will help refine this goal during your consultation
        </p>
      </div>
    );
  };

  // Projection Graph - Step 11
  const renderProjectionGraph = () => {
    const bmiValue = calcBMI(formData.currentWeight, formData.height);
    const current = parseFloat(formData.currentWeight) || 0;
    let target = current * 0.87;
    if (formData.weightLossGoal === '1-10') target = current - 5.5;
    else if (formData.weightLossGoal === '10-25') target = current - 17.5;
    else if (formData.weightLossGoal === '25+') target = current - 30;
    else if (formData.weightLossGoal === 'unsure') target = current * 0.85;

    if (!formData.targetWeight && target !== current) {
      updateFormData('targetWeight', target.toFixed(1));
    }

    const projectedMonth = getProjectedMonth(String(current), String(target), bmiValue);
    const cat = bmiValue ? getBMICategory(bmiValue) : null;

    const chartW = 260, chartH = 110, padL = 10, maxM = 12;
    const wRange = current - (current * 0.78);
    const wToY = (w: number) => chartH - (((w - (current - wRange)) / wRange) * chartH * 0.9) - 5;
    const mToX = (m: number) => padL + (m / maxM) * chartW;

    const treatPts = Array.from({length: 13}, (_, m) => {
      const loss = cat ? Math.min(current - target, m * cat.monthlyLossKg) : m * 1.0;
      return {x: mToX(m), y: wToY(current - loss)};
    });
    const noPts = Array.from({length: 13}, (_, m) => ({x: mToX(m), y: wToY(current - Math.min(2, m * 0.2))}));
    const toPath = (pts: {x:number,y:number}[]) => pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    return (
      <div className="px-4 py-6 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Your projected transformation</h2>
        <p className="text-xs text-gray-400 text-center mb-6">Based on clinical data from patients with your profile</p>

        <div className="w-full bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <svg viewBox={`0 0 ${chartW + padL + 20} ${chartH + 30}`} className="w-full">
            {[0,3,6,9,12].map(m => <line key={m} x1={mToX(m)} y1={0} x2={mToX(m)} y2={chartH} stroke="#F1F5F9" strokeWidth={1}/>)}
            <line x1={padL} y1={wToY(target)} x2={chartW+padL} y2={wToY(target)} stroke="#059669" strokeWidth={1} strokeDasharray="4,3"/>
            <text x={chartW+padL+2} y={wToY(target)+3} fontSize={8} fill="#059669" fontWeight={600}>Goal</text>
            <path d={toPath(noPts)} fill="none" stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="5,3"/>
            <path d={toPath(treatPts)} fill="none" stroke="#3B6D11" strokeWidth={2.5}/>
            {treatPts[Math.min(projectedMonth, 12)] && <circle cx={mToX(Math.min(projectedMonth, 12))} cy={treatPts[Math.min(projectedMonth, 12)].y} r={5} fill="#3B6D11"/>}
            {[0,3,6,9,12].map(m => <text key={m} x={mToX(m)} y={chartH+20} textAnchor="middle" fontSize={8} fill="#94A3B8">{m===0?'Now':`${m}mo`}</text>)}
          </svg>
          <div className="flex gap-4 justify-center mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-6 border-t-2 border-dashed border-gray-300"></span>Without</span>
            <span className="flex items-center gap-1"><span className="w-6 border-t-2 border-green-700"></span>With Sanative</span>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-sm font-semibold text-green-800">
            Reach <strong>{Math.round(target)}kg</strong> by month <strong>{Math.min(projectedMonth, 12)}</strong>
          </p>
          <p className="text-xs text-green-600 mt-1">Clinical average: {cat?.percentLoss || '12–15%'} loss at 12 months*</p>
        </div>
      </div>
    );
  };

  // Eligibility Confirmation - Step 16 (not currently used in flow, but keeping compliant)
  // Note: This step may be skipped - renderQualificationScreen (step 18) shows the preliminary result
  const renderEligibilityConfirmation = () => {
    const contraindicated = hasAbsoluteContraindication(formData.seriousConditions || []);

    return (
      <div className="px-4 py-8 max-w-md mx-auto">
        {!contraindicated ? (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-[#5c7a52]/10 flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-[#5c7a52]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Assessment recorded</h2>
              <p className="text-sm text-gray-500">
                Your responses have been saved. A doctor will review your full profile during your consultation to determine if treatment is appropriate.
              </p>
            </div>
            <div className="bg-[#f4f7f2] rounded-2xl p-4 mb-6">
              <p className="text-xs text-[#7e9a72] leading-relaxed">
                <strong>Note:</strong> This assessment does not guarantee treatment. All clinical decisions are made by your doctor.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Additional review required</h2>
            <p className="text-sm text-gray-500">
              Based on your answers, this program may not be suitable without further medical review. You can still submit your assessment and our team will guide you on the safest next step.
            </p>
          </div>
        )}
      </div>
    );
  };

  // ─── Other Health Goals Step (Cross-sell) ───────────────────────────────────
  const renderOtherGoalsStep = () => {
    const options = [
      { id: 'hair_loss', label: 'Hair loss' },
      { id: 'hormonal_health', label: 'Hormonal health' },
      { id: 'mens_vitality', label: "Men's vitality & energy" },
      { id: 'fatty_liver', label: 'Liver & metabolic health' },
      { id: 'biomarker_testing', label: 'Comprehensive health testing' },
      { id: 'skin_health', label: 'Skin health' },
      { id: 'none', label: 'None of the above' },
    ];

    const selected: string[] = formData.otherGoals || [];

    const toggle = (id: string) => {
      if (id === 'none') {
        setFormData(prev => ({ ...prev, otherGoals: ['none'] }));
        return;
      }
      const current = (formData.otherGoals || []).filter((g: string) => g !== 'none');
      const next = current.includes(id)
        ? current.filter((g: string) => g !== id)
        : [...current, id];
      setFormData(prev => ({ ...prev, otherGoals: next }));
    };

    return (
      <div className="space-y-6 pb-8">
        <div className="text-center">
          {renderGreeting()}
          <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
            What other health goals are on your mind?
          </h1>
          <p className="mt-3 text-[#5c7a52]">Select all that apply</p>
        </div>

        <div className="space-y-3 mt-8">
          {options.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(opt.id);
              }}
              className={`w-full py-4 px-5 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer select-none ${
                selected.includes(opt.id)
                  ? 'border-[#5c7a52] bg-[#5c7a52]/10'
                  : 'border-[#e6ebe3] bg-white hover:border-[#cdd8c6]'
              }`}
            >
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 pointer-events-none ${
                selected.includes(opt.id)
                  ? 'border-[#5c7a52] bg-[#5c7a52]'
                  : 'border-[#cdd8c6]'
              }`}>
                {selected.includes(opt.id) && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-[#2c3628] pointer-events-none">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ─── Step 18: Preliminary Suitability Screen ─────────────────────────────────
  // Compliant copy - no promises about qualification, approval, or medication
  const renderQualificationScreen = () => {
    // Check if user has potential hard-stop contraindications
    const hasHardStop = formData.seriousConditions.some(c =>
      c !== "None of these apply" && (
        c.toLowerCase().includes('pancreatitis') ||
        c.toLowerCase().includes('thyroid cancer') ||
        c.toLowerCase().includes('men2') ||
        c.toLowerCase().includes('pregnancy') ||
        c.toLowerCase().includes('breastfeeding')
      )
    );

    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #f8faf8 0%, #ffffff 100%)' }}>
        {/* Progress */}
        <div className="w-full h-1 bg-gray-100">
          <div className="h-full bg-[#5c7a52] transition-all duration-500" style={{ width: '85%' }} />
        </div>

        <div className="flex-1 px-6 pt-8 pb-6">
          {/* Status Badge */}
          <div className="flex items-center justify-center mb-6">
            {!hasHardStop ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#5c7a52]/10 border border-[#5c7a52]/20 rounded-full">
                <Stethoscope className="w-5 h-5 text-[#5c7a52]" />
                <span className="text-sm font-semibold text-[#5c7a52]">Preliminary assessment complete</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">Additional review needed</span>
              </div>
            )}
          </div>

          {/* Main Message - Compliant copy */}
          <div className="text-center mb-8">
            {!hasHardStop ? (
              <>
                <h1 className="text-2xl sm:text-3xl font-serif text-[#2c3628] leading-tight mb-4">
                  You may be suitable for our doctor-led program
                </h1>
                <p className="text-[#5c7a52] leading-relaxed">
                  The next step is to book a phone consultation with an Australian doctor, who will review your assessment and confirm whether treatment is clinically appropriate.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-serif text-[#2c3628] leading-tight mb-4">
                  Your assessment needs medical review
                </h1>
                <p className="text-[#5c7a52] leading-relaxed">
                  Based on your answers, this program may not be suitable without further medical review. You can still submit your assessment and our team will guide you on the safest next step.
                </p>
              </>
            )}
          </div>

          {/* Information Card */}
          <div className="bg-white rounded-3xl border border-[#e6ebe3] shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5c7a52] to-[#7e9a72] flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#2c3628]">Next Step</p>
                <p className="text-sm text-[#7e9a72]">Book a doctor consultation</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#5c7a52]">Confirm your details with our care team</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#5c7a52]">Phone consultation with AHPRA-registered doctor</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#5c7a52]">Doctor confirms if treatment is clinically appropriate</p>
              </div>
            </div>
          </div>

          {/* Compliance Disclaimer */}
          <div className="bg-[#f4f7f2] rounded-xl p-4 mb-6">
            <p className="text-xs text-[#7e9a72] leading-relaxed">
              <strong>Important:</strong> This is a preliminary assessment only. A consultation does not guarantee treatment.
              All treatment decisions are made by your doctor based on a full clinical review.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => animateToStep(19, 'forward')}
            className="w-full py-4 bg-[#2c3628] hover:bg-[#34412f] text-white font-semibold rounded-full text-lg transition-colors flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-xs text-[#a8bb9e] mt-4">
            Your first-month payment is refunded if your Sanative doctor determines the program is not clinically suitable.
          </p>
        </div>
      </div>
    );
  };

  // ─── Step 19: Shipping Info Screen (uses ShippingInfoScreen component) ──────
  const renderShippingInfoScreen = () => {
    const handleShippingSubmit = async (data: {
      lastName: string;
      phone: string;
      streetAddress: string;
      addressUnit: string;
      suburb: string;
      state: string;
      postcode: string;
    }) => {
      // Update form data first
      const updatedFormData = {
        ...formData,
        ...data,
      };
      setFormData(updatedFormData);

      // Create user in database now (before payment) so they're captured
      try {
        const response = await fetch("/api/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            programType: "WEIGHT_MANAGEMENT",
            ...updatedFormData,
            hasContraindications,
            bmi: calculateBMI(),
          }),
        });

        const responseData = await response.json();

        if (response.ok) {
          setUserId(responseData.userId);
          toast.success("Details saved!", { description: "Your information has been recorded." });
        } else {
          console.error("Intake API error:", responseData);
          toast.error("Could not save your details", {
            description: responseData.error || "Please try again or contact support."
          });
        }
      } catch (error) {
        console.error("Error saving user:", error);
        toast.error("Connection error", {
          description: "Please check your internet connection and try again."
        });
      }

      animateToStep(20, 'forward');
    };

    return (
      <ShippingInfoScreen
        formData={formData}
        onSave={handleShippingSubmit}
      />
    );
  };

  // ─── Helper: Group available slots by day ────────────────────────────────────
  // UNIFIED CALENDAR: Groups time slots (doctor assignment happens during triage)
  const groupSlotsByDay = (slots: UnifiedSlot[]): DaySlots[] => {
    const grouped = new Map<string, DaySlots>();

    for (const slot of slots) {
      const date = new Date(slot.startTime);
      const dateKey = date.toDateString();

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date,
          dateStr: date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }),
          dayName: date.toLocaleDateString('en-AU', { weekday: 'long' }),
          slots: [],
        });
      }

      grouped.get(dateKey)!.slots.push(slot);
    }

    // Sort by date and limit to first 2 days
    return Array.from(grouped.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 2);
  };

  // ─── Helper: Format slot time ───────────────────────────────────────────────
  const formatSlotTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Australia/Sydney',
    });
  };

  // ─── Handler: Select a time slot and create hold ────────────────────────────
  // UNIFIED CALENDAR: No doctor assignment - that happens during triage
  const handleSlotSelection = async (slot: UnifiedSlot) => {
    // If this slot is already selected, do nothing
    if (formData.selectedSlotId === slot.slotId) return;

    setCreatingHold(true);
    setSlotsError(null);

    try {
      // Calculate BMI for the hold request
      const bmi = calculateBMI();

      // Create hold - UNIFIED CALENDAR (no doctor specified)
      const response = await fetch('/api/bookings/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || undefined,
          slotId: slot.slotId,
          selectedPlan: (formData.selectedPlan || 'core').toUpperCase(),
          patientPhone: formData.phone || undefined,
          patientBmi: bmi || undefined,
          riskFlags: hasContraindications ? ['CONTRAINDICATION_FLAG'] : [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reserve this time slot');
      }

      const data = await response.json();

      // Update booking state
      setBookingHoldId(data.bookingHoldId);
      setHoldExpiry(new Date(data.holdExpiryTime));

      // Update form data with selected slot details (NO DOCTOR - assigned during triage)
      const slotDate = new Date(slot.startTime);
      updateFormData('selectedSlotId', slot.slotId);
      updateFormData('consultationDate', slotDate.toLocaleDateString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }));
      updateFormData('consultationTime', formatSlotTime(slot.startTime));

      toast.success('Time slot reserved!', {
        description: 'Your slot is held for 15 minutes while you complete payment.',
      });
    } catch (error) {
      console.error('Error creating hold:', error);
      const message = error instanceof Error ? error.message : 'Failed to reserve time slot';
      setSlotsError(message);
      toast.error('Could not reserve this slot', { description: message });
    } finally {
      setCreatingHold(false);
    }
  };

  // ─── Step 20: Consultation Booking ─────────────────────────────────────────
  const renderBookingScreen = () => {
    const groupedSlots = groupSlotsByDay(availableSlots);

    // Format hold countdown
    const formatHoldCountdown = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="min-h-screen bg-[#fdfbf7]">
        <div className="w-full h-1 bg-gray-100">
          <div className="h-full bg-[#5c7a52] transition-all duration-500" style={{ width: '88%' }} />
        </div>

        <div className="px-6 pt-8 pb-32">
          <div className="text-center mb-8">
            <Calendar className="w-12 h-12 text-[#5c7a52] mx-auto mb-4" />
            <h1 className="text-2xl font-serif text-[#2c3628] mb-2">
              Book your consultation
            </h1>
            <p className="text-[#5c7a52]">
              Select a convenient time for your phone consultation
            </p>
          </div>

          {/* Loading State */}
          {loadingSlots && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-[#5c7a52]/20 border-t-[#5c7a52] rounded-full animate-spin mb-4" />
              <p className="text-sm text-[#7e9a72]">Loading available times...</p>
            </div>
          )}

          {/* Error State */}
          {slotsError && !loadingSlots && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-red-700 mb-3">{slotsError}</p>
              <button
                onClick={() => {
                  setAvailableSlots([]);
                  setSlotsError(null);
                }}
                className="text-sm text-red-600 underline font-medium"
              >
                Try again
              </button>
            </div>
          )}

          {/* No Slots Available */}
          {!loadingSlots && !slotsError && groupedSlots.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="font-semibold text-amber-800 mb-2">No slots available</p>
              <p className="text-sm text-amber-700">
                All consultation slots are currently booked. Please check back later or contact our support team.
              </p>
            </div>
          )}

          {/* Slot Selection */}
          {!loadingSlots && !slotsError && groupedSlots.length > 0 && (
            <>
              {/* Hold Timer - Show when slot is selected */}
              {bookingHoldId && holdCountdown > 0 && (
                <div className="bg-[#5c7a52]/10 border border-[#5c7a52]/20 rounded-2xl p-4 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Timer className="w-5 h-5 text-[#5c7a52]" />
                    <div>
                      <p className="text-sm font-medium text-[#2c3628]">Slot reserved</p>
                      <p className="text-xs text-[#7e9a72]">Complete payment to confirm</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#5c7a52]">{formatHoldCountdown(holdCountdown)}</p>
                    <p className="text-xs text-[#7e9a72]">remaining</p>
                  </div>
                </div>
              )}

              {/* Date and Time Selection Grid */}
              <div className="grid grid-cols-2 gap-4">
                {groupedSlots.map((daySlots) => (
                  <div key={daySlots.date.toISOString()} className="space-y-3">
                    {/* Day Header */}
                    <div className="text-center p-3 bg-gradient-to-br from-[#f4f7f2] to-[#e6ebe3] rounded-xl border border-[#e6ebe3]">
                      <p className="text-sm font-medium text-[#5c7a52]">{daySlots.dayName}</p>
                      <p className="text-lg font-serif text-[#2c3628]">
                        {daySlots.date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {daySlots.slots.map((slot) => {
                        const isSelected = formData.selectedSlotId === slot.slotId;
                        const isDisabled = creatingHold && !isSelected;

                        return (
                          <button
                            key={slot.slotId}
                            onClick={() => handleSlotSelection(slot)}
                            disabled={isDisabled}
                            className={`w-full py-3 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#5c7a52] text-white border-2 border-[#5c7a52]'
                                : 'bg-white text-[#2c3628] border-2 border-[#e6ebe3] hover:border-[#5c7a52]/50'
                            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span>{formatSlotTime(slot.startTime)}</span>
                            {isSelected ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              creatingHold && <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Slot Summary */}
              {formData.selectedSlotId && formData.consultationDate && formData.consultationTime && (
                <div className="bg-[#5c7a52]/10 rounded-2xl p-4 mt-6 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#5c7a52] flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#2c3628]">Your appointment</p>
                      <p className="text-sm text-[#5c7a52]">
                        {formData.consultationDate} at {formData.consultationTime}
                      </p>
                      <p className="text-xs text-[#7e9a72] mt-0.5">Doctor assigned by care team</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e6ebe3] p-4">
          <button
            onClick={() => animateToStep(21, 'forward')}
            disabled={!formData.selectedSlotId || !bookingHoldId || creatingHold}
            className="w-full py-4 bg-[#2c3628] hover:bg-[#34412f] text-white font-semibold rounded-full text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creatingHold ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Reserving slot...
              </>
            ) : (
              <>
                Pay and book doctor assessment
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          {bookingHoldId && holdCountdown > 0 && holdCountdown < 300 && (
            <p className="text-center text-xs text-amber-600 mt-2">
              Complete payment within {formatHoldCountdown(holdCountdown)} to keep your slot
            </p>
          )}
        </div>
      </div>
    );
  };

  // ─── Step 21: Payment Screen ─────────────────────────────────────────────────
  const renderPaymentScreen = () => {
    const formatCountdown = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get pricing based on selected plan
    const getPricing = () => {
      if (formData.selectedPlan === 'precision') {
        return {
          planName: 'Sanative Precision',
          firstMonthPrice: 499,
          discount: 100,
          dueToday: 399,
          ongoingPrice: 499,
        };
      }
      // Default to Core
      return {
        planName: 'Sanative Core',
        firstMonthPrice: 349,
        discount: 100,
        dueToday: 249,
        ongoingPrice: 349,
      };
    };

    const pricing = getPricing();

    // Handle proceeding to payment form
    const handleProceedToPayment = () => {
      setShowPaymentForm(true);
      setPaymentError(null);
    };

    // Handle successful payment - confirm the booking
    const handlePaymentSuccess = async (paymentIntentId?: string) => {
      setMembershipPaid(true);
      setShowPaymentForm(false);

      // Confirm the booking if we have a hold
      if (bookingHoldId) {
        try {
          const confirmResponse = await fetch('/api/bookings/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingHoldId,
              paymentIntentId: paymentIntentId || 'pi_manual_confirmation',
              userId,
              selectedPlan: (formData.selectedPlan || 'core').toUpperCase(),
            }),
          });

          if (confirmResponse.ok) {
            const confirmData = await confirmResponse.json();
            console.log('[Booking] Confirmed:', confirmData);

            // Capture magic link for portal access
            if (confirmData.magicLink) {
              setPortalMagicLink(confirmData.magicLink);
            }

            toast.success("Booking confirmed!", {
              description: `Your consultation is scheduled for ${formData.consultationDate} at ${formData.consultationTime}`,
            });
          } else {
            const errorData = await confirmResponse.json();
            console.error('[Booking] Confirmation failed:', errorData);
            // Still proceed - payment was successful, booking can be manually confirmed
            toast.success("Payment successful!", {
              description: "Your consultation will be confirmed shortly.",
            });
          }
        } catch (error) {
          console.error('[Booking] Confirmation error:', error);
          // Still proceed - payment was successful
          toast.success("Payment successful!", {
            description: "Your consultation will be confirmed shortly.",
          });
        }

        // Clear the hold state
        setBookingHoldId(null);
        setHoldExpiry(null);
      } else {
        toast.success("Payment successful!", { description: "Your consultation is booked." });
      }

      // Skip biomarker upsell - go directly to thank you
      // Biomarkers are now positioned as doctor-reviewed and clinically indicated post-consult
      animateToStep(23, 'forward');
    };

    // Handle payment error
    const handlePaymentError = (error: string) => {
      setPaymentError(error);
      toast.error("Payment failed", { description: error });
    };

    // If showing payment form, render the Stripe Elements checkout
    if (showPaymentForm && userId) {
      // Check if hold has expired
      const holdHasExpired = !bookingHoldId || holdCountdown <= 0;

      // If hold expired, show a message to go back and select a new slot
      if (holdHasExpired) {
        return (
          <div className="min-h-screen bg-[#fdfbf7]">
            <div className="w-full h-1 bg-gray-100">
              <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: '93%' }} />
            </div>

            <div className="px-6 pt-6 pb-8 max-w-lg mx-auto">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Timer className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-serif text-amber-900 mb-2">
                  Your slot reservation has expired
                </h2>
                <p className="text-sm text-amber-700 mb-6">
                  Don&apos;t worry — we&apos;ve saved your details. Go back to select a new time slot and complete your booking.
                </p>
                <button
                  onClick={() => {
                    setShowPaymentForm(false);
                    animateToStep(20, 'backward');
                  }}
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-full transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Select a new time slot
                </button>
                <p className="text-xs text-amber-600 mt-4">
                  Your payment information has not been charged.
                </p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-[#fdfbf7]">
          <div className="w-full h-1 bg-gray-100">
            <div className="h-full bg-[#5c7a52] transition-all duration-500" style={{ width: '93%' }} />
          </div>

          <div className="px-6 pt-6 pb-8 max-w-lg mx-auto">
            {/* Back button */}
            <button
              onClick={() => setShowPaymentForm(false)}
              className="flex items-center gap-2 text-[#5c7a52] hover:text-[#34412f] mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to plan selection</span>
            </button>

            {/* Order Summary Header */}
            <div className="bg-white rounded-2xl border border-[#e6ebe3] p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-[#2c3628]">{pricing.planName}</p>
                  <p className="text-sm text-[#7e9a72]">{formData.consultationDate} at {formData.consultationTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#2c3628]">${pricing.dueToday}</p>
                  <p className="text-xs text-green-600">$100 discount applied</p>
                </div>
              </div>
              <div className="border-t border-[#e6ebe3] pt-3">
                <p className="text-xs text-[#7e9a72]">
                  Then from ${pricing.ongoingPrice}/month after the first month. Cancel anytime.
                </p>
              </div>
            </div>

            {/* Stripe Payment Form */}
            <StripePaymentForm
              userId={userId}
              selectedPlan={(formData.selectedPlan || 'core') as 'core' | 'precision'}
              firstMonthAmount={pricing.dueToday * 100}
              ongoingMonthlyAmount={pricing.ongoingPrice * 100}
              discountAmount={pricing.discount * 100}
              consultationDate={formData.consultationDate}
              consultationTime={formData.consultationTime}
              customerEmail={formData.email}
              customerName={`${formData.firstName} ${formData.lastName}`.trim()}
              bookingHoldId={bookingHoldId || undefined}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />

            {/* Refund Guarantee */}
            <div className="mt-6 bg-[#5c7a52]/5 border border-[#5c7a52]/20 rounded-xl p-4">
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#5c7a52] leading-relaxed">
                  <strong>100% refund guarantee:</strong> If your Sanative doctor determines the program is not suitable, your first-month payment will be fully refunded.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#fdfbf7]">
        <div className="w-full h-1 bg-gray-100">
          <div className="h-full bg-[#5c7a52] transition-all duration-500" style={{ width: '91%' }} />
        </div>

        <div className="px-6 pt-6 pb-56 overflow-y-auto">
          {/* Urgency Timer */}
          {offerCountdown > 0 && (
            <div className="flex items-center justify-center gap-2 mb-5 py-2.5 px-4 bg-amber-50 border border-amber-200 rounded-full">
              <Timer className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                $100 discount expires in {formatCountdown(offerCountdown)}
              </span>
            </div>
          )}

          <div className="text-center mb-6">
            <h1 className="text-2xl font-serif text-[#2c3628] mb-2">
              Choose your plan
            </h1>
            <p className="text-sm text-[#5c7a52]">
              Select the program that&apos;s right for you
            </p>
          </div>

          {/* Plan Selection Cards - Mobile Optimized */}
          <div className="space-y-5 mb-6">
            {/* Sanative Core */}
            <button
              type="button"
              onClick={() => updateFormData('selectedPlan', 'core')}
              className={`w-full text-left rounded-2xl border-2 p-4 sm:p-5 transition-all relative active:scale-[0.99] touch-manipulation ${
                formData.selectedPlan === 'core' || !formData.selectedPlan
                  ? 'border-[#5c7a52] bg-[#5c7a52]/5 shadow-lg ring-2 ring-[#5c7a52]/20'
                  : 'border-[#e6ebe3] bg-white hover:border-[#cdd8c6] active:bg-gray-50'
              }`}
            >
              {/* Badge */}
              <div className="absolute -top-3 left-4 bg-[#5c7a52] text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Star className="w-3 h-3 fill-current" />
                Most popular
              </div>

              <div className="flex items-start justify-between pt-3 sm:pt-2 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2c3628] text-base sm:text-lg mb-1">Sanative Core</p>
                  <p className="text-xs sm:text-sm text-[#7e9a72] mb-3 leading-relaxed">For most eligible patients starting doctor-led weight management.</p>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-[#2c3628]">$249</span>
                    <span className="text-sm text-[#7e9a72] line-through">$349</span>
                    <span className="text-xs text-[#5c7a52] font-medium">today</span>
                  </div>
                  <p className="text-xs text-[#7e9a72] mt-1.5">Then from $349/month</p>
                </div>
                <div className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                  formData.selectedPlan === 'core' || !formData.selectedPlan
                    ? 'border-[#5c7a52] bg-[#5c7a52] scale-110'
                    : 'border-[#cdd8c6]'
                }`}>
                  {(formData.selectedPlan === 'core' || !formData.selectedPlan) && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
            </button>

            {/* Sanative Precision */}
            <button
              type="button"
              onClick={() => updateFormData('selectedPlan', 'precision')}
              className={`w-full text-left rounded-2xl border-2 p-4 sm:p-5 transition-all relative active:scale-[0.99] touch-manipulation ${
                formData.selectedPlan === 'precision'
                  ? 'border-[#c17a58] bg-[#c17a58]/5 shadow-lg ring-2 ring-[#c17a58]/20'
                  : 'border-[#e6ebe3] bg-white hover:border-[#cdd8c6] active:bg-gray-50'
              }`}
            >
              {/* Badge */}
              <div className="absolute -top-3 left-4 bg-[#c17a58] text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full shadow-sm">
                Enhanced monitoring
              </div>

              <div className="flex items-start justify-between pt-3 sm:pt-2 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2c3628] text-base sm:text-lg mb-1">Sanative Precision</p>
                  <p className="text-xs sm:text-sm text-[#7e9a72] mb-3 leading-relaxed">For patients who may benefit from closer clinical monitoring.</p>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-[#2c3628]">$399</span>
                    <span className="text-sm text-[#7e9a72] line-through">$499</span>
                    <span className="text-xs text-[#c17a58] font-medium">today</span>
                  </div>
                  <p className="text-xs text-[#7e9a72] mt-1.5">Then from $499/month</p>
                </div>
                <div className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                  formData.selectedPlan === 'precision'
                    ? 'border-[#c17a58] bg-[#c17a58] scale-110'
                    : 'border-[#cdd8c6]'
                }`}>
                  {formData.selectedPlan === 'precision' && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-[#e6ebe3] p-5 mb-5">
            <p className="text-sm font-semibold text-[#2c3628] mb-4">Order summary</p>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#5c7a52]">First month program price</span>
                <span className="text-[#2c3628]">${pricing.firstMonthPrice}</span>
              </div>
              <div className="flex justify-between items-center text-green-600">
                <span className="flex items-center gap-1.5">
                  <Gift className="w-4 h-4" />
                  Introductory first-month discount
                </span>
                <span>-${pricing.discount}</span>
              </div>
              <div className="border-t border-[#e6ebe3] pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#2c3628]">Due today</span>
                  <span className="text-xl font-bold text-[#2c3628]">${pricing.dueToday}</span>
                </div>
                <p className="text-xs text-[#7e9a72] mt-1">
                  Ongoing: from ${pricing.ongoingPrice}/month after the first month
                </p>
              </div>
            </div>
          </div>

          {/* What's included */}
          <div className="bg-[#f4f7f2] rounded-2xl p-5 mb-5">
            <p className="text-sm font-semibold text-[#2c3628] mb-3">What&apos;s included</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#5c7a52] flex-shrink-0" />
                <span className="text-sm text-[#2c3628]">Australian doctor-led assessment</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#5c7a52] flex-shrink-0" />
                <span className="text-sm text-[#2c3628]">Treatment if prescribed</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#5c7a52] flex-shrink-0" />
                <span className="text-sm text-[#2c3628]">Doctor-reviewed biomarker monitoring</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#5c7a52] flex-shrink-0" />
                <span className="text-sm text-[#2c3628]">Health Age tracking</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#5c7a52] flex-shrink-0" />
                <span className="text-sm text-[#2c3628]">Secure delivery &amp; ongoing care</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#5c7a52] flex-shrink-0" />
                <span className="text-sm text-[#2c3628]">Sanative Health Portal access</span>
              </div>
            </div>
          </div>

          {/* Consultation Summary */}
          <div className="bg-white rounded-2xl border border-[#e6ebe3] p-4 mb-5">
            <p className="text-xs font-medium text-[#7e9a72] uppercase tracking-wider mb-2">Your consultation</p>
            <p className="font-semibold text-[#2c3628]">{formData.consultationDate} at {formData.consultationTime}</p>
          </div>

          {/* Refund Disclaimer */}
          <div className="bg-[#5c7a52]/5 border border-[#5c7a52]/20 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-[#5c7a52] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#5c7a52] leading-relaxed">
                Treatment is supplied only where clinically appropriate. If your Sanative doctor determines the program is not suitable, your first-month payment will be refunded.
              </p>
            </div>
          </div>

          {/* Blood Test Disclaimer */}
          <div className="bg-white border border-[#e6ebe3] rounded-xl p-4 mb-5">
            <p className="text-xs text-[#7e9a72] leading-relaxed">
              <strong>Blood tests:</strong> Blood tests are only requested where clinically appropriate by an Australian doctor. Many standard pathology tests are Medicare-rebated or bulk-billed for eligible Medicare card holders. Some tests may attract an out-of-pocket cost. You will be advised of any known costs before testing.
            </p>
          </div>
        </div>

        {/* Fixed Bottom CTA - Mobile Safe Area */}
        <div
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e6ebe3] px-4 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={handleProceedToPayment}
            disabled={!userId}
            className="w-full py-4 bg-[#2c3628] hover:bg-[#34412f] active:bg-[#1a1f17] text-white font-semibold rounded-full text-base sm:text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
          >
            {!userId ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Pay and book doctor assessment
                <CreditCard className="w-5 h-5" />
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Shield className="w-4 h-4 text-[#a8bb9e]" />
            <p className="text-xs text-[#a8bb9e]">
              Secure Stripe checkout · Refund if not suitable
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ─── Step 22: Biomarker Upsell Screen (DEPRECATED - GAP-028) ─────────────────
  // REMOVED from pre-approval checkout flow per compliance requirements.
  // Biomarkers are now positioned as doctor-reviewed and clinically indicated post-consult.
  // This function is kept for reference but is no longer called in the quiz flow.
  // TODO: Move to post-consult doctor/care-partner recommendation flow
  const renderBiomarkerUpsellScreen = () => {
    // Determine relevant biomarkers based on user's conditions
    const getRelevantPanels = () => {
      const conditions = [
        ...formData.metabolicConditions,
        ...formData.digestiveConditions,
        ...formData.cardiovascularConditions,
      ].map(c => c.toLowerCase());

      // Filter panels that match user's conditions, or show top 3 if no matches
      const relevant = BIOMARKER_PANELS.filter(panel =>
        panel.relevantConditions.some(rc =>
          conditions.some(c => c.includes(rc) || rc.includes(c.split(' ')[0]))
        )
      );

      return relevant.length > 0 ? relevant.slice(0, 3) : BIOMARKER_PANELS.slice(0, 3);
    };

    const relevantPanels = getRelevantPanels();
    const selectedCount = formData.selectedBiomarkers.length;
    const totalPrice = selectedCount * 49;

    const toggleBiomarker = (id: string) => {
      const current = formData.selectedBiomarkers || [];
      const updated = current.includes(id)
        ? current.filter(b => b !== id)
        : [...current, id];
      updateFormData('selectedBiomarkers', updated);
    };

    const handleBiomarkerPayment = async () => {
      if (selectedCount === 0) {
        // Still save final state even if no biomarkers selected
        await saveFinalQuizData();
        animateToStep(23, 'forward');
        return;
      }

      setIsSubmitting(true);
      try {
        // Save biomarker selection to database
        await saveFinalQuizData();
        setBiomarkersPaid(true);
        toast.success("Biomarker panels added!", { description: `${selectedCount} panel(s) added to your order.` });
        animateToStep(23, 'forward');
      } catch (error) {
        console.error("Biomarker save error:", error);
        toast.error("Payment failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fdfbf7] to-white">
        <div className="w-full h-1 bg-gray-100">
          <div className="h-full bg-[#5c7a52] transition-all duration-500" style={{ width: '96%' }} />
        </div>

        <div className="px-6 pt-8 pb-40">
          {/* Success Banner - Compliant copy */}
          <div className="flex items-center justify-center gap-2 mb-6 py-3 px-4 bg-[#5c7a52]/10 border border-[#5c7a52]/20 rounded-full">
            <CheckCircle2 className="w-5 h-5 text-[#5c7a52]" />
            <span className="text-sm font-medium text-[#5c7a52]">Payment received — consultation booked</span>
          </div>

          {/* Upsell Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">Optional add-on</span>
            </div>

            <h1 className="text-2xl font-serif text-[#2c3628] mb-3">
              Unlock deeper insights
            </h1>
            <p className="text-[#5c7a52] leading-relaxed">
              Based on your assessment, these biomarker panels may provide useful information for your doctor during your consultation.
            </p>
          </div>

          {/* Special Offer Badge */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#c17a58]/10 to-[#c17a58]/5 rounded-2xl p-4 mb-6 border border-[#c17a58]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#c17a58] flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#2c3628]">Bundle & Save 50%</p>
                <p className="text-sm text-[#7e9a72]">$49 each (normally $99)</p>
              </div>
            </div>
          </div>

          {/* Biomarker Panel Cards */}
          <div className="space-y-4 mb-6">
            {relevantPanels.map((panel) => {
              const isSelected = formData.selectedBiomarkers.includes(panel.id);
              return (
                <button
                  key={panel.id}
                  onClick={() => toggleBiomarker(panel.id)}
                  className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
                    isSelected
                      ? 'border-[#5c7a52] bg-[#5c7a52]/5 shadow-md'
                      : 'border-[#e6ebe3] bg-white hover:border-[#5c7a52]/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{panel.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-[#2c3628] mb-1">{panel.name}</p>
                          <p className="text-sm text-[#7e9a72]">{panel.description}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-[#5c7a52] bg-[#5c7a52]' : 'border-[#cdd8c6]'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="font-bold text-[#5c7a52]">$49</span>
                        <span className="text-sm text-[#a8bb9e] line-through">$99</span>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Save 50%</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fixed Bottom CTAs */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e6ebe3] p-4 space-y-3">
          {selectedCount > 0 ? (
            <button
              onClick={handleBiomarkerPayment}
              disabled={isSubmitting}
              className="w-full py-4 bg-[#5c7a52] hover:bg-[#4a6343] text-white font-semibold rounded-full text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Add {selectedCount} panel{selectedCount > 1 ? 's' : ''} · ${totalPrice}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => animateToStep(23, 'forward')}
              className="w-full py-4 bg-[#2c3628] hover:bg-[#34412f] text-white font-semibold rounded-full text-lg transition-colors"
            >
              Continue without biomarkers
            </button>
          )}

          <button
            onClick={() => animateToStep(23, 'forward')}
            className="w-full py-3 text-[#7e9a72] font-medium text-sm hover:text-[#5c7a52] transition-colors"
          >
            I&apos;ll decide later
          </button>
        </div>
      </div>
    );
  };

  // ─── Step 23: Thank You Screen ───────────────────────────────────────────────
  const renderThankYouScreen = () => {
    // Use magic link if available, otherwise fall back to regular dashboard
    const portalLink = portalMagicLink || "/dashboard";
    const buttonText = portalMagicLink ? "Access my portal" : "View my account";

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#5c7a52] to-[#4a6343] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl font-serif text-white mb-4">
            Thank you, {formData.firstName}!
          </h1>

          <p className="text-white/90 text-lg mb-8 max-w-sm">
            Your consultation is booked. We&apos;ll be in touch soon.
          </p>

          {/* Confirmation Card */}
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl mb-8">
            <div className="flex items-center gap-3 pb-4 border-b border-[#e6ebe3]">
              <Calendar className="w-6 h-6 text-[#5c7a52]" />
              <div className="text-left">
                <p className="text-sm text-[#7e9a72]">Your consultation</p>
                <p className="font-semibold text-[#2c3628]">{formData.consultationDate}</p>
                <p className="text-[#5c7a52]">{formData.consultationTime}</p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f4f7f2] flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-[#5c7a52]" />
                </div>
                <p className="text-sm text-[#5c7a52]">Confirmation email sent to {formData.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f4f7f2] flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-[#5c7a52]" />
                </div>
                <p className="text-sm text-[#5c7a52]">Doctor will confirm if treatment is appropriate</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f4f7f2] flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#5c7a52]" />
                </div>
                <p className="text-sm text-[#5c7a52]">Care partner will reach out within 24 hours</p>
              </div>
            </div>
          </div>

          {/* What's Next - Compliant copy */}
          <div className="text-white/80 text-sm max-w-xs">
            <p className="mb-2 font-medium text-white">What happens next?</p>
            <p className="leading-relaxed">
              Check your email for a link to set up your account. During your appointment, the doctor will review your assessment and confirm whether treatment is clinically appropriate for you.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-6">
          <a
            href={portalLink}
            className="block w-full py-4 bg-white text-[#2c3628] font-semibold rounded-full text-lg text-center hover:bg-white/95 transition-colors"
          >
            {buttonText}
          </a>
          {!portalMagicLink && (
            <p className="text-center text-white/70 text-sm mt-3">
              Check your email for a link to set up your account
            </p>
          )}
        </div>
      </div>
    );
  };

  // ─── Address + Mobile Form Step ─────────────────────────────────────────────
  const renderAddressFormStep = () => {
    return (
      <AddressFormStep
        formData={formData}
        totalSteps={totalSteps}
        step={step}
        onSave={(data) => {
          setFormData(prev => ({
            ...prev,
            ...data,
          }));
          animateToStep(step + 1, 'forward');
        }}
      />
    );
  };

  const renderStep = () => {
    // Step 5: Circular progress animation
    if (step === 5) {
      return (
        <CircularProgressScreen
          firstName={formData.firstName}
          currentWeight={parseFloat(formData.currentWeight) || 0}
          height={parseFloat(formData.height) || 0}
          onComplete={() => {
            setStep(6);
            window.scrollTo(0, 0);
          }}
        />
      );
    }

    // Step 6: Email gate with blurred graph
    if (step === 6) {
      const current = parseFloat(formData.currentWeight) || 80;
      const target = parseFloat(formData.targetWeight) || current * 0.85;
      return (
        <EmailGateScreen
          currentWeight={current}
          targetWeight={target}
          firstName={formData.firstName}
          onSubmit={async (email) => {
            updateFormData("email", email);

            // Create user record EARLY so we capture them even if they don't complete
            try {
              const response = await fetch("/api/intake", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  programType: "WEIGHT_MANAGEMENT",
                  email,
                  firstName: formData.firstName,
                  currentWeight: formData.currentWeight,
                  targetWeight: formData.targetWeight,
                  height: formData.height,
                  weightLossGoal: formData.weightLossGoal,
                  journeyStatus: "LEAD", // GAP-007: Using valid status for early capture
                }),
              });

              if (response.ok) {
                const data = await response.json();
                setUserId(data.userId);
                console.log("[Quiz] User created early at email gate:", data.userId);
              }
            } catch (error) {
              console.error("[Quiz] Error creating early user:", error);
              // Continue anyway - we'll try again at shipping step
            }

            setStep(7);
            window.scrollTo(0, 0);
          }}
        />
      );
    }

    // Step 7: Full graph reveal
    if (step === 7) {
      const current = parseFloat(formData.currentWeight) || 80;
      const target = parseFloat(formData.targetWeight) || current * 0.85;
      return (
        <WeightLossGraph
          currentWeight={current}
          targetWeight={target}
          firstName={formData.firstName}
          onContinue={() => {
            setStep(8);
            window.scrollTo(0, 0);
          }}
        />
      );
    }

    // Step 11: Other health goals (cross-sell)
    if (step === 11) {
      return renderOtherGoalsStep();
    }

    // Step 18: Qualification screen
    if (step === 18) {
      return renderQualificationScreen();
    }

    // Step 19: Shipping info screen (NEW)
    if (step === 19) {
      return renderShippingInfoScreen();
    }

    // Step 20: Booking screen
    if (step === 20) {
      return renderBookingScreen();
    }

    // Step 21: Payment screen
    if (step === 21) {
      return renderPaymentScreen();
    }

    // Step 22: REMOVED - Biomarker upsell removed from pre-approval flow
    // Biomarkers are now doctor-reviewed and clinically indicated post-consult
    // If user somehow lands on step 22, redirect to thank you
    if (step === 22) {
      animateToStep(23, 'forward');
      return null;
    }

    // Step 23: Thank you
    if (step === 23) {
      return renderThankYouScreen();
    }

    switch (step) {
      // Step 1 - How much weight to lose
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                How much weight are you looking to lose?
              </h1>
            </div>

            <div className="mt-8 flex flex-col gap-3 max-w-md mx-auto">
              {weightLossGoals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => {
                    updateFormData("weightLossGoal", goal.id);
                  }}
                  className={`w-full px-6 py-4 rounded-full border-2 text-left text-lg font-medium transition-all duration-200 ${
                    formData.weightLossGoal === goal.id
                      ? "border-[#5c7a52] bg-[#5c7a52] text-white"
                      : "border-[#e6ebe3] bg-white text-[#2c3628] hover:border-[#5c7a52]"
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </div>
        );

      // Step 2 - First Name
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                What&apos;s your first name?
              </h1>
              <p className="mt-3 text-[#5c7a52]">
                We&apos;ll personalise your results
              </p>
            </div>

            <div className="mt-8">
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => updateFormData("firstName", e.target.value)}
                className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white text-center text-lg"
                placeholder="Enter your first name"
                autoFocus
              />
            </div>
          </div>
        );

      // Step 3 - Current Weight
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              {renderGreeting()}
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                What&apos;s your current weight?
              </h1>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.currentWeight}
                  onChange={(e) => updateFormData("currentWeight", e.target.value.replace(/[^\d.]/g, ""))}
                  className="w-40 px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white text-center text-2xl font-medium"
                  placeholder="85"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7e9a72] font-medium">kg</span>
              </div>
              {formData.targetWeight && formData.currentWeight && (
                <p className="text-sm text-[#5c7a52]">
                  That&apos;s {(parseFloat(formData.currentWeight) - parseFloat(formData.targetWeight)).toFixed(1)}kg to lose
                </p>
              )}
            </div>
          </div>
        );

      // Step 4 - Height
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              {renderGreeting()}
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                What&apos;s your height?
              </h1>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.height}
                  onChange={(e) => updateFormData("height", e.target.value.replace(/\D/g, ""))}
                  className="w-40 px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white text-center text-2xl font-medium"
                  placeholder="170"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7e9a72] font-medium">cm</span>
              </div>
              {bmi && (
                <p className="text-sm text-[#5c7a72]">BMI: {bmi.toFixed(1)}</p>
              )}
            </div>
          </div>
        );

      // Step 8 - Gender (after graph reveal)
      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center">
              {renderGreeting()}
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                What gender were you assigned at birth?
              </h1>
              <p className="mt-3 text-[#5c7a52]">
                Biological sex affects how your body processes food and stores fat.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowWhyAsking("gender")}
              className="mx-auto flex items-center gap-1.5 text-sm text-[#5c7a52] hover:text-[#34412f]"
            >
              <Info className="w-4 h-4" />
              Why we&apos;re asking this
            </button>

            <div className="space-y-3 mt-6">
              {[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    updateFormData("gender", option.value as "male" | "female");
                    setTimeout(() => animateToStep(step + 1, 'forward'), 300);
                  }}
                  className={`w-full py-4 px-6 rounded-xl border-2 text-center font-medium transition-all ${
                    formData.gender === option.value
                      ? "border-[#5c7a52] bg-[#5c7a52]/10 text-[#2c3628]"
                      : "border-[#e6ebe3] bg-white text-[#2c3628] hover:border-[#cdd8c6]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      // Step 9 - Date of Birth
      case 9:
        return (
          <div className="space-y-6">
            <div className="text-center">
              {renderGreeting()}
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                What&apos;s your date of birth?
              </h1>
              <p className="mt-3 text-[#5c7a52]">
                You must be 18 or older for this program.
              </p>
            </div>

            <div className="mt-8">
              <input
                type="text"
                inputMode="numeric"
                value={formData.dateOfBirth}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.length > 8) value = value.slice(0, 8);
                  if (value.length >= 2) value = value.slice(0, 2) + "/" + value.slice(2);
                  if (value.length >= 5) value = value.slice(0, 5) + "/" + value.slice(5);
                  updateFormData("dateOfBirth", value);
                }}
                className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white text-center text-lg"
                placeholder="DD/MM/YYYY"
                autoFocus
              />
              {formData.dateOfBirth.length === 10 && !isValidAge && (
                <p className="text-sm text-red-500 mt-2 text-center">
                  You must be at least 18 years old to use this program.
                </p>
              )}
              {formData.dateOfBirth.length === 10 && isValidAge && (
                <p className="text-sm text-[#5c7a72] mt-2 text-center">
                  Age: {age} years old
                </p>
              )}
            </div>
          </div>
        );

      // Step 10 - Motivations (moved earlier - "What do you want to accomplish?")
      case 10:
        return renderMotivations();

      // Step 12 - Metabolic conditions
      case 12:
        return renderConditionsStep(
          "Do you have any metabolic conditions?",
          "These affect how we prescribe medications.",
          metabolicConditions,
          "metabolicConditions"
        );

      // Step 13 - Digestive conditions
      case 13:
        return renderConditionsStep(
          "Any digestive or gastrointestinal conditions?",
          "These medications affect the digestive system.",
          digestiveConditions,
          "digestiveConditions"
        );

      // Step 14 - Cardiovascular conditions
      case 14:
        return renderConditionsStep(
          "Any heart or cardiovascular conditions?",
          "Weight loss can significantly improve heart health.",
          cardiovascularConditions,
          "cardiovascularConditions"
        );

      // Step 15 - Mental health conditions
      case 15:
        return renderConditionsStep(
          "Any mental health conditions we should know about?",
          "Your mental wellbeing is important to us.",
          mentalHealthConditions,
          "mentalHealthConditions"
        );

      // Step 16 - Serious conditions (special warning UI)
      case 16:
        return (
          <div className="space-y-6 pb-8">
            <div className="text-center">
              {renderGreeting()}
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                Have you ever been diagnosed with any of these?
              </h1>
              <p className="mt-3 text-[#5c7a52]">
                These conditions may affect treatment eligibility.
              </p>
            </div>

            {formData.seriousConditions.some(c => c !== "None of these apply") && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Some conditions may require additional review. Our doctor will discuss this with you.
                </p>
              </div>
            )}

            <div className="space-y-3 mt-6 max-h-[45vh] overflow-y-auto pr-2 pb-4">
              {seriousConditions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleArrayField("seriousConditions", option);
                  }}
                  className={`w-full py-4 px-5 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer select-none ${
                    formData.seriousConditions.includes(option)
                      ? "border-[#5c7a52] bg-[#5c7a52]/10"
                      : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
                  }`}
                >
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 pointer-events-none ${
                    formData.seriousConditions.includes(option)
                      ? "border-[#5c7a52] bg-[#5c7a52]"
                      : "border-[#cdd8c6]"
                  }`}>
                    {formData.seriousConditions.includes(option) && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-[#2c3628] pointer-events-none">{option}</span>
                </button>
              ))}
            </div>
          </div>
        );

      // Step 17 - Current Medications
      case 17:
        return renderConditionsStep(
          "Are you currently taking any of these medications?",
          "Some medications interact with weight loss treatments.",
          currentMedicationsOptions,
          "currentMedications"
        );

      default:
        // UAT8-GAP-009: This default case is unreachable dead code.
        // All valid steps (1-17 in switch, 18-23 in if statements) are handled above.
        // If somehow reached (invalid step value), redirect to step 20 (booking screen).
        console.warn(`[Quiz] Unexpected step value: ${step}, redirecting to booking screen`);
        if (typeof window !== 'undefined') {
          setTimeout(() => animateToStep(20, 'forward'), 0);
        }
        return (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#5c7a52] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#5c7a52]">Redirecting...</p>
            </div>
          </div>
        );
    }
  };

  // Last name collection step (moved from original step 1)
  const renderLastNameStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        {renderGreeting()}
        <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
          What&apos;s your last name?
        </h1>
        <p className="mt-3 text-[#5c7a52]">
          Required for prescriptions — we keep it confidential.
        </p>
      </div>

      <div className="mt-8">
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => updateFormData("lastName", e.target.value)}
          className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white text-center text-lg"
          placeholder="Enter your last name"
          autoFocus
        />
      </div>
    </div>
  );

  // Email gate step - now at step 9 (moved earlier in flow!)
  const renderEmailGate = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
          {formData.firstName
            ? `${formData.firstName}, your health profile is ready`
            : 'Your health profile is ready'}
        </h1>
        <p className="mt-3 text-[#5c7a52]">
          Create your account to see your personalised weight loss plan and eligibility results
        </p>
      </div>

      <div className="mt-8">
        <label className="block text-sm font-medium text-[#2c3628] mb-2">
          Email address
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData("email", e.target.value)}
          className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white"
          placeholder="you@example.com"
          autoFocus
        />
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        Your health data stays in Australia · Cancel anytime
      </p>

      <p className="text-center text-sm text-[#7e9a72]">
        Already a Sanative patient?{" "}
        <Link href="/login" className="text-[#5c7a52] underline font-medium">
          Sign in instead
        </Link>
      </p>
    </div>
  );

  // How heard step - now optional, appears after email
  const renderHowHeard = () => (
    <div className="space-y-6 pb-8">
      <div className="text-center">
        {renderGreeting()}
        <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
          How did you hear about Sanative?
        </h1>
        <p className="mt-3 text-[#5c7a52]">
          Optional — this helps us improve our service.
        </p>
      </div>
      <div className="space-y-3 mt-8 max-h-[50vh] overflow-y-auto pr-2 pb-4">
        {howHeardOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              updateFormData("howHeard", option);
              setTimeout(() => animateToStep(step + 1, 'forward'), 300);
            }}
            className={`w-full py-4 px-6 rounded-xl border-2 text-center transition-all ${
              formData.howHeard === option
                ? "border-[#5c7a52] bg-[#5c7a52]/10 text-[#2c3628]"
                : "border-[#e6ebe3] bg-white text-[#2c3628] hover:border-[#cdd8c6]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {/* Skip button for optional question */}
      <button
        type="button"
        onClick={nextStep}
        className="w-full text-sm text-[#7e9a72] hover:text-[#5c7a52] transition-colors">
        Skip this question →
      </button>
    </div>
  );

  const renderConditionsStep = (
    title: string,
    subtitle: string,
    options: string[],
    field: keyof FormData
  ) => (
    <div className="space-y-6 pb-8">
      <div className="text-center">
        {renderGreeting()}
        <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
          {title}
        </h1>
        <p className="mt-3 text-[#5c7a52]">{subtitle}</p>
      </div>

      <div className="space-y-3 mt-8">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleArrayField(field, option);
            }}
            className={`w-full py-4 px-5 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer select-none ${
              (formData[field] as string[]).includes(option)
                ? "border-[#5c7a52] bg-[#5c7a52]/10"
                : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
            }`}
          >
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 pointer-events-none ${
              (formData[field] as string[]).includes(option)
                ? "border-[#5c7a52] bg-[#5c7a52]"
                : "border-[#cdd8c6]"
            }`}>
              {(formData[field] as string[]).includes(option) && (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
            <span className="text-[#2c3628] pointer-events-none">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderMotivations = () => (
    <div className="space-y-6 pb-8">
      <div className="text-center">
        {renderGreeting()}
        <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
          What&apos;s driving your decision to lose weight?
        </h1>
        <p className="mt-3 text-[#5c7a52]">
          Select all that resonate with you.
        </p>
      </div>

      <div className="space-y-3 mt-8">
        {motivationsOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleArrayField("motivations", option.label, "none");
            }}
            className={`w-full py-4 px-5 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer select-none ${
              formData.motivations.includes(option.label)
                ? "border-[#5c7a52] bg-[#5c7a52]/10"
                : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
            }`}
          >
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 pointer-events-none ${
              formData.motivations.includes(option.label)
                ? "border-[#5c7a52] bg-[#5c7a52]"
                : "border-[#cdd8c6]"
            }`}>
              {formData.motivations.includes(option.label) && (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
            <span className="text-[#2c3628] pointer-events-none">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Get button text based on step
  const getButtonText = () => {
    if (step === 7) return ""; // Loading screen has no button
    if (step === 12 || step === 14) return "Continue";
    // Email gate CTA at step 9
    if (step === 9) return "Create my account →";
    return "Continue →";
  };

  return (
    <div className="min-h-screen bg-white overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* UAT8-GAP-010: Legacy Intro Offer Popup - REMOVED
       * The old $50 promotion conflicted with the current $100 first-month discount.
       * The $100 discount is already shown in the payment step:
       * - Core: $349 → $249 (save $100)
       * - Precision: $499 → $399 (save $100)
       *
       * This popup was confusing users by mentioning a different discount amount.
       * The showIntroOffer state is now set to false by default.
       */}

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#e6ebe3] z-50 overflow-hidden">
        <div
          className="h-full bg-[#5c7a52] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-sm z-40 border-b border-[#e6ebe3]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif text-[#34412f]">
            Sanative
          </Link>
          <button
            type="button"
            onClick={() => setShowFAQ(true)}
            className="flex items-center gap-1.5 text-sm text-[#5c7a52] hover:text-[#34412f] transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>Help</span>
          </button>
        </div>
      </header>

      {/* Main content - extra bottom padding for fixed footer clearance */}
      <main className="max-w-2xl mx-auto px-4 py-8 pb-56 relative z-10 bg-white">
        <div
          className={`transition-all duration-300 ease-out ${
            isAnimating
              ? animationDirection === 'forward'
                ? 'opacity-0 translate-x-8'
                : 'opacity-0 -translate-x-8'
              : 'opacity-100 translate-x-0'
          }`}
        >
          {renderStep()}
        </div>
      </main>

      {/* Bottom navigation - hide on screens with their own fixed buttons AND when intro offer is open */}
      {step < totalSteps && ![5, 6, 7, 18, 19, 20, 21, 22].includes(step) && !showIntroOffer && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white z-[60]"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {/* White background extension to cover any gaps */}
          <div className="absolute inset-x-0 bottom-0 h-[200px] bg-white -z-10" />
          <div className="border-t border-[#e6ebe3] p-4" style={{ boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)' }}>
            <div className="max-w-2xl mx-auto flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-4 rounded-xl border border-[#cdd8c6] text-[#5c7a52] font-medium hover:bg-[#f4f7f2] transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1 py-4 bg-[#5c7a52] text-white font-medium rounded-xl hover:bg-[#4a6343] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {getButtonText()}
                {!getButtonText().includes("→") && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global white background to prevent any color bleeding */}
      <div className="fixed inset-0 bg-white -z-50 pointer-events-none" aria-hidden="true" />

      {/* FAQ Modal */}
      {showFAQ && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-[#e6ebe3] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#5c7a52]" />
                <span className="font-semibold text-[#2c3628]">Common questions</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFAQ(false)}
                className="p-2 hover:bg-[#f4f7f2] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#5c7a52]" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-[#2c3628] mb-2">What treatments do you offer?</h4>
                <p className="text-sm text-[#5c7a52]">
                  Our doctors prescribe evidence-based weight management medications where clinically appropriate. Your doctor will recommend the best option based on your health profile and biomarker results.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#2c3628] mb-2">Who may be suitable?</h4>
                <p className="text-sm text-[#5c7a52]">
                  Generally, patients with a BMI of 30+ or 27+ with weight-related health conditions may be considered. Our doctors assess your full health picture during consultation.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#2c3628] mb-2">What results can I expect?</h4>
                <p className="text-sm text-[#5c7a72]">
                  Results vary significantly based on individual biology, adherence, and lifestyle factors. Your doctor will discuss realistic expectations during your consultation.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#2c3628] mb-2">Are there side effects?</h4>
                <p className="text-sm text-[#5c7a52]">
                  Common side effects include nausea, which typically improves over time. Your doctor will discuss all potential side effects during your consultation.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#2c3628] mb-2">What if I&apos;m not suitable?</h4>
                <p className="text-sm text-[#5c7a52]">
                  If our doctors determine treatment isn&apos;t right for you, we&apos;ll refund your first-month payment and may suggest alternative approaches.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Why asking modal */}
      {showWhyAsking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#2c3628]">Why we ask this</h3>
                <button
                  type="button"
                  onClick={() => setShowWhyAsking(null)}
                  className="p-2 hover:bg-[#f4f7f2] rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[#5c7a52]" />
                </button>
              </div>
              {showWhyAsking === "gender" && (
                <p className="text-sm text-[#5c7a52]">
                  Biological sex affects how your body stores fat, responds to hormones, and metabolises medications. This helps us provide safe, effective treatment tailored to your physiology.
                </p>
              )}
              {showWhyAsking === "ethnicity" && (
                <p className="text-sm text-[#5c7a52]">
                  Research shows that health risks associated with excess weight vary by ethnicity. For example, some populations have higher risk of diabetes at lower BMI levels. This helps us assess your individual risk profile.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeInLine {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeInLine {
          opacity: 0;
          animation: fadeInLine 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

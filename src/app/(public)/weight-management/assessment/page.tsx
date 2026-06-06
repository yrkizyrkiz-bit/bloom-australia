"use client";

import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import { toast } from "sonner";
import { scoreWeightManagement, fetchBiomarkerCampaigns, getBiomarkerFlags, type BiomarkerCampaignData } from "@/lib/biomarkerScoring";
import { BiomarkerSnapshot } from "@/components/quiz/BiomarkerSnapshot";
import { UnifiedCheckoutScreen } from "@/components/checkout/UnifiedCheckoutScreen";
import {
  formatDateInTimezone,
  formatTimeInTimezone,
  resolveAustralianTimezone,
} from "@/lib/australia-timezone";
import {
  filterMetabolicConditionsForGender,
  filterOtherGoalsForGender,
  filterSeriousConditionsForGender,
  pruneGenderIncompatibleSelections,
  type OtherGoalOption,
} from "@/lib/quiz-gender-filters";
import {
  buildPortalActivationMagicLink,
  WM_POST_CHECKOUT_PATH,
} from "@/lib/portal-context";
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

/** Fixed program projection horizon shown on graph screens */
const PROJECTION_GOAL_MONTHS = 6;

function getWeightLossCurveParams(currentWeight: number, targetWeight: number) {
  const weightLoss = Math.max(0, currentWeight - targetWeight);
  const goalMonths = PROJECTION_GOAL_MONTHS;
  const totalMonths = PROJECTION_GOAL_MONTHS;
  const k = -Math.log(0.05) / goalMonths;
  return { weightLoss, goalMonths, totalMonths, k };
}

function getProjectedMonth(
  _currentWeight: string,
  _targetWeight: string,
  _bmi: number | null
): number {
  return PROJECTION_GOAL_MONTHS;
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

/** Steps using viewport-first shell (header fixed, options scroll, footer in flex column) */
const VIEWPORT_QUIZ_STEPS = new Set([1, 2, 3, 4, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);

const QUIZ_PHASES = [
  { id: 1, label: "Your goal", steps: [1, 2, 3, 4, 5, 6, 7] },
  { id: 2, label: "About you", steps: [8, 9, 10, 11] },
  { id: 3, label: "Health history", steps: [12, 13, 14, 15, 16, 17] },
  { id: 4, label: "Get started", steps: [18, 19, 20, 21] },
] as const;

function getQuizPhaseInfo(step: number) {
  const phaseIndex = QUIZ_PHASES.findIndex((phase) =>
    (phase.steps as readonly number[]).includes(step)
  );
  const resolvedIndex = phaseIndex === -1 ? QUIZ_PHASES.length - 1 : phaseIndex;
  const phase = QUIZ_PHASES[resolvedIndex];
  const withinPhaseIndex = Math.max(0, (phase.steps as readonly number[]).indexOf(step));
  const withinPhaseTotal = phase.steps.length;
  const phaseProgress =
    withinPhaseTotal > 0 ? ((withinPhaseIndex + 1) / withinPhaseTotal) * 100 : 100;

  return { phaseIndex: resolvedIndex, phase, phaseProgress };
}

function QuizPhaseProgress({
  step,
  compact = false,
  wide = false,
}: {
  step: number;
  compact?: boolean;
  wide?: boolean;
}) {
  const { phaseIndex, phase, phaseProgress } = getQuizPhaseInfo(step);

  return (
    <div
      className={`w-full ${wide ? "max-w-7xl" : "max-w-2xl"} mx-auto ${
        compact ? "px-4 pb-2" : "px-4 sm:px-6 pb-3"
      }`}
    >
      <p className="text-[11px] sm:text-xs text-[#7e9a72] mb-1.5 tracking-wide">
        Phase {phaseIndex + 1} of {QUIZ_PHASES.length} · {phase.label}
      </p>
      <div className="flex gap-1.5" role="progressbar" aria-valuenow={phaseIndex + 1} aria-valuemin={1} aria-valuemax={QUIZ_PHASES.length} aria-label={`Phase ${phaseIndex + 1} of ${QUIZ_PHASES.length}: ${phase.label}`}>
        {QUIZ_PHASES.map((segment, index) => (
          <div
            key={segment.id}
            className="flex-1 h-1 rounded-full bg-[#e6ebe3] overflow-hidden"
          >
            <div
              className="h-full bg-[#5c7a52] rounded-full transition-all duration-500 ease-out"
              style={{
                width:
                  index < phaseIndex
                    ? "100%"
                    : index === phaseIndex
                    ? `${phaseProgress}%`
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const SHOW_QUIZ_PHASE_PROGRESS = (step: number) => step >= 1 && step <= 21;

function parseDobParts(dob: string) {
  if (dob.length !== 10) return { day: "", month: "", year: "" };
  const [day, month, year] = dob.split("/");
  return { day: day || "", month: month || "", year: year || "" };
}

function DateOfBirthInput({
  value,
  onChange,
  age,
  isValid,
}: {
  value: string;
  onChange: (value: string) => void;
  age: number;
  isValid: boolean;
}) {
  const initial = parseDobParts(value);
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const parts = parseDobParts(value);
    setDay(parts.day);
    setMonth(parts.month);
    setYear(parts.year);
  }, [value]);

  const emitIfComplete = (d: string, m: string, y: string) => {
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      onChange(`${d}/${m}/${y}`);
    } else {
      onChange("");
    }
  };

  const isComplete = day.length === 2 && month.length === 2 && year.length === 4;
  const fieldClass = (filled: boolean) =>
    `w-full min-h-[52px] px-2 py-3 rounded-xl border text-center text-xl font-medium outline-none transition-colors bg-white ${
      isComplete && !isValid
        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
        : isComplete && isValid
        ? "border-[#5c7a52] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
        : filled
        ? "border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
        : "border-[#e6ebe3] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
    }`;

  return (
    <div className="pt-2">
      <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-[#7e9a72] mb-1 text-center">
            Day
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={day}
            placeholder="DD"
            autoFocus
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "").slice(0, 2);
              setDay(d);
              emitIfComplete(d, month, year);
              if (d.length === 2) monthRef.current?.focus();
            }}
            className={fieldClass(day.length > 0)}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-[#7e9a72] mb-1 text-center">
            Month
          </label>
          <input
            ref={monthRef}
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={month}
            placeholder="MM"
            onChange={(e) => {
              const m = e.target.value.replace(/\D/g, "").slice(0, 2);
              setMonth(m);
              emitIfComplete(day, m, year);
              if (m.length === 2) yearRef.current?.focus();
            }}
            className={fieldClass(month.length > 0)}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-[#7e9a72] mb-1 text-center">
            Year
          </label>
          <input
            ref={yearRef}
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={year}
            placeholder="YYYY"
            onChange={(e) => {
              const y = e.target.value.replace(/\D/g, "").slice(0, 4);
              setYear(y);
              emitIfComplete(day, month, y);
            }}
            className={fieldClass(year.length > 0)}
          />
        </div>
      </div>
      <p
        className={`min-h-5 mt-2 text-center text-xs leading-5 ${
          isComplete && !isValid
            ? "text-red-500"
            : isComplete && isValid
            ? "text-[#5c7a52]"
            : "text-transparent"
        }`}
        aria-live="polite"
      >
        {isComplete && !isValid
          ? "You must be at least 18 years old"
          : isComplete && isValid
          ? `Age ${age} — eligible`
          : " "}
      </p>
    </div>
  );
}

// ─── QuizStepShell (viewport-first layout) ─────────────────────────────────────
function QuizStepShell({
  title,
  subtitle,
  greeting,
  headerExtra,
  children,
}: {
  title: ReactNode;
  subtitle?: string;
  greeting?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0 w-full max-w-md mx-auto">
      <div className="flex-shrink-0 text-center pb-2">
        {greeting}
        <h1 className="text-2xl font-serif text-[#2c3628] leading-snug px-1">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm text-[#5c7a52] leading-snug px-1">{subtitle}</p>
        ) : null}
        {headerExtra}
      </div>
      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="pb-2">{children}</div>
      </div>
    </div>
  );
}

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
      className="min-h-[calc(100dvh-4.75rem)] flex flex-col items-center justify-center px-4 py-6"
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
  compact = false,
}: {
  currentWeight: number;
  targetWeight: number;
  compact?: boolean;
}) {
  const { weightLoss, goalMonths, totalMonths, k } = getWeightLossCurveParams(
    currentWeight,
    targetWeight
  );

  const W = 390;
  const H = compact ? 150 : 240;
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
      <div className={compact ? "px-4 pt-4 pb-1" : "px-5 pt-8 pb-2"}>
        <p className="text-xs text-[#7e9a72] mb-0.5">Your weight</p>
        <p
          className={`font-serif text-[#2c3628] leading-none mb-0.5 ${compact ? "text-4xl sm:text-5xl" : "text-6xl"}`}
          style={{ letterSpacing: '-2px' }}
        >
          {currentWeight} <span style={{ fontSize: '0.55em', fontWeight: 500 }}>kg</span>
        </p>
        <p className={`font-bold text-[#5c7a52] ${compact ? "text-xl sm:text-2xl" : "text-3xl"}`}>
          ↓ {weightLoss.toFixed(1)} kg
        </p>
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
  const [loading, setLoading] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [existingUserInfo, setExistingUserInfo] = useState<{ firstName?: string; hasActiveProgram?: boolean } | null>(null);

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) return;
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
    <div
      className="bg-[#fdfbf7] relative overflow-hidden flex flex-col"
      style={{ minHeight: 'calc(100dvh - 4.75rem)' }}
    >
      <div className="absolute inset-0 pointer-events-none select-none" style={{ filter: 'blur(8px)', transform: 'scale(1.05)' }} aria-hidden="true">
        <BlurredGraphPreview currentWeight={currentWeight} targetWeight={targetWeight} />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(253,251,247,0.3) 0%, rgba(253,251,247,0.92) 45%, rgba(253,251,247,1) 60%)',
        }}
      />
      {/* Original layout: flex spacer with graph peek — 36vh (was 45vh) so button fits without scroll */}
      <div className="flex-1" style={{ minHeight: '36vh' }} aria-hidden="true" />

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

      <div
        className="relative z-10 flex-shrink-0 bg-white rounded-t-3xl px-5 sm:px-6 pt-6 pb-8 shadow-2xl border-t border-[#e6ebe3]"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-sm mx-auto w-full">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#5c7a52] text-white rounded-full text-xs font-semibold">
              Intro offer for new members
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-serif text-[#2c3628] text-center mb-2 leading-snug">
            See how much weight you could lose
          </h2>
          <p className="text-sm text-[#7e9a72] text-center mb-5 leading-relaxed">
            New member promotion automatically applied at checkout today.
          </p>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full max-w-xs mx-auto block h-11 border border-[#e6ebe3] focus:border-[#5c7a52] rounded-xl px-4 text-sm transition-colors outline-none mb-4 bg-white"
            autoComplete="email"
            autoFocus
          />

          <button
            onClick={handleSubmit}
            disabled={!email || !email.includes('@') || loading}
            className="w-full max-w-xs mx-auto block py-3.5 bg-[#2c3628] hover:bg-[#34412f] disabled:opacity-30 text-white font-semibold rounded-full text-sm transition-colors"
          >
            {loading ? 'Checking...' : 'View results'}
          </button>

          <p className="text-center text-xs text-[#7e9a72] mt-3">Your health data stays in Australia · Cancel anytime</p>
        </div>
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

  const { weightLoss, goalMonths, totalMonths, k } = getWeightLossCurveParams(
    currentWeight,
    targetWeight
  );

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
    <div className="min-h-[calc(100dvh-4.75rem)] bg-[#fdfbf7] px-4 py-4 sm:py-6 flex flex-col">
      <div className="max-w-md mx-auto flex-1 flex flex-col justify-center w-full">
        <div className="mb-4 sm:mb-6">
          <p className="text-sm font-semibold text-[#2c3628] mb-2">
            Let&apos;s start your program with this Goal!
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-serif text-[#2c3628]">{currentWeight}</span>
            <span className="text-2xl text-[#7e9a72]">→</span>
            <span className="text-5xl font-serif text-[#5c7a52]">{Math.round(targetWeight)}</span>
            <span className="text-lg text-[#7e9a72]">kg</span>
          </div>
          <p className="text-lg font-medium text-[#c17a58] mt-1">
            –{weightLoss.toFixed(1)} kg in {goalMonths} months
          </p>
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
                If clinically appropriate, our doctor will prescribe evidence-based weight management medication
                combined with simple lifestyle changes. We&apos;re behind you all the way in achieving your goal!
              </p>
            </div>
          </div>
        </div>

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
  const [addressExpanded, setAddressExpanded] = useState(
    Boolean(formData.streetAddress && formData.suburb)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Address autocomplete state
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch address suggestions from Nominatim (OpenStreetMap)
  const fetchSuggestions = async (query: string, postcode: string) => {
    if (query.length < 3 || postcode.length !== 4) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: `${query}, ${postcode}, Australia`,
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
      fetchSuggestions(value, localPostcode);
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

  const hasDeliverySuburb = Boolean(localSuburb.trim());

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex-1 px-1 pb-36 overflow-y-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-serif text-[#2c3628] mb-1">
            Let&apos;s confirm your details
          </h1>
          <p className="text-sm text-[#5c7a52]">
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
          <div className="pt-4 border-t border-[#e6ebe3]">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[#5c7a52]" />
              <p className="font-semibold text-[#2c3628]">Delivery address</p>
            </div>

            {/* Postcode first */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-[#2c3628] mb-1.5">Postcode</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 2000"
                value={localPostcode}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setLocalPostcode(next);
                  if (next.length !== 4) {
                    setAddressExpanded(false);
                    setShowSuggestions(false);
                  }
                }}
                maxLength={4}
                autoComplete="postal-code"
                className={`w-full border-2 rounded-2xl px-5 py-4 text-base outline-none transition-colors ${
                  fieldErrors.postcode ? "border-red-400" : "border-[#e6ebe3] focus:border-[#5c7a52]"
                }`}
              />
              {fieldErrors.postcode && (
                <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.postcode}</p>
              )}
            </div>

            {/* Address search — after postcode */}
            <div className="mb-3 relative" ref={suggestionsRef}>
              <label className="block text-sm font-medium text-[#2c3628] mb-1.5">Street address</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={
                    localPostcode.length === 4
                      ? "Start typing your street address..."
                      : "Enter your postcode first"
                  }
                  value={addressQuery || localAddress}
                  disabled={localPostcode.length !== 4}
                  onChange={(e) => {
                    handleAddressInput(e.target.value);
                    setLocalAddress(e.target.value);
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off"
                  className={`w-full border-2 rounded-2xl px-5 py-4 text-base outline-none transition-colors disabled:bg-[#f4f7f2] disabled:text-[#7e9a72] ${
                    fieldErrors.address ? "border-red-400" : "border-[#e6ebe3] focus:border-[#5c7a52]"
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

            {/* Expanded after selection or manual entry */}
            {addressExpanded && (
              <>
                <input
                  type="text"
                  placeholder="Unit / Apt (optional)"
                  value={localUnit}
                  onChange={(e) => setLocalUnit(e.target.value)}
                  className="w-full border-2 border-[#e6ebe3] focus:border-[#5c7a52] rounded-2xl px-5 py-4 text-base outline-none transition-colors mb-3"
                />
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Suburb"
                      value={localSuburb}
                      onChange={(e) => setLocalSuburb(e.target.value)}
                      className={`w-full border-2 rounded-2xl px-4 py-4 text-base outline-none transition-colors ${
                        fieldErrors.suburb ? "border-red-400" : "border-[#e6ebe3] focus:border-[#5c7a52]"
                      }`}
                    />
                    {fieldErrors.suburb && (
                      <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.suburb}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Postcode"
                      value={localPostcode}
                      readOnly
                      className="w-full border-2 rounded-2xl px-4 py-4 text-base outline-none bg-[#f4f7f2] text-[#5c7a52] border-[#e6ebe3]"
                    />
                  </div>
                </div>
                <select
                  value={localState}
                  onChange={(e) => setLocalState(e.target.value)}
                  className={`w-full border-2 rounded-2xl px-5 py-4 text-base outline-none transition-colors bg-white appearance-none ${
                    fieldErrors.state ? "border-red-400" : "border-[#e6ebe3] focus:border-[#5c7a52]"
                  }`}
                >
                  <option value="">Select state / territory</option>
                  {["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {fieldErrors.state && (
                  <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.state}</p>
                )}
              </>
            )}

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
          <div className="bg-[#f4f7f2] rounded-2xl px-4 py-4 text-xs text-[#7e9a72] leading-relaxed mt-4">
            By continuing, you agree to receive SMS notifications about your consultation and treatment. You can opt out at any time.{' '}
            <a href="/privacy" className="underline text-gray-700">Privacy policy</a>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA + delivery summary */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-[#fdfbf7] border-t border-[#e6ebe3] z-[60]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {hasDeliverySuburb && (
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f4f7f2] border-b border-[#e6ebe3] text-sm text-[#5c7a52]">
            <Package className="w-4 h-4 flex-shrink-0" />
            <span>
              Delivering to <strong className="font-semibold text-[#2c3628]">{localSuburb}</strong>
              {localState ? `, ${localState}` : ""}
            </span>
          </div>
        )}
        <div className="p-4">
          <button
            onClick={handleShippingContinue}
            disabled={isSaving}
            className="w-full py-4 bg-[#5c7a52] hover:bg-[#4a6343] disabled:opacity-50 text-white font-semibold rounded-full text-lg transition-colors flex items-center justify-center gap-2"
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
        <div className="flex items-center justify-center gap-2 mt-3">
          <Shield className="w-4 h-4 text-[#7e9a72]" />
          <span className="text-xs text-[#7e9a72] font-medium tracking-wide">
            256-BIT TLS SECURITY
          </span>
        </div>
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
  const patientTimezone = useMemo(
    () => resolveAustralianTimezone(formData.state, formData.postcode),
    [formData.state, formData.postcode]
  );
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
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [bookingHoldId, setBookingHoldId] = useState<string | null>(null);
  const [holdExpiry, setHoldExpiry] = useState<Date | null>(null);
  const [creatingHold, setCreatingHold] = useState(false);
  const [selectingSlotId, setSelectingSlotId] = useState<string | null>(null); // Track which slot is being selected
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

  // Core plan only on unified checkout
  useEffect(() => {
    if (step === 20 && formData.selectedPlan !== "core") {
      updateFormData("selectedPlan", "core");
    }
  }, [step, formData.selectedPlan]);

  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0);

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
          setSlotsRefreshKey((k) => k + 1);
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
  // 20=unified checkout (booking + payment), 21=thankYou (biomarker upsell removed post-consult)
  const totalSteps = 22;

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

  const OTHER_GOAL_OPTIONS: OtherGoalOption[] = [
    { id: "hair_loss", label: "Hair loss" },
    { id: "hormonal_health", label: "Hormonal health" },
    { id: "mens_vitality", label: "Men's vitality & energy" },
    { id: "fatty_liver", label: "Liver & metabolic health" },
    { id: "biomarker_testing", label: "Comprehensive health testing" },
    { id: "skin_health", label: "Skin health" },
    { id: "none", label: "None of the above" },
  ];

  const filteredMetabolicConditions = useMemo(
    () => filterMetabolicConditionsForGender(metabolicConditions, formData.gender),
    [formData.gender]
  );

  const filteredSeriousConditions = useMemo(
    () => filterSeriousConditionsForGender(seriousConditions, formData.gender),
    [formData.gender]
  );

  const filteredOtherGoalOptions = useMemo(
    () => filterOtherGoalsForGender(OTHER_GOAL_OPTIONS, formData.gender),
    [formData.gender]
  );

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
      case 20: return true; // Unified checkout handles its own validation
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
  // - Step 20: UnifiedCheckoutScreen (booking + Stripe payment in one step)
  // - handleCheckoutPaymentSuccess() for payment confirmation
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
      <p className="text-xs text-[#7e9a72] mb-1">
        Hi {formData.firstName}
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
              {cat && weightToLose > 0 && (
                <p className="text-xs text-[#7e9a72] mt-2">
                  Based on your profile, you could reach this in {PROJECTION_GOAL_MONTHS} months
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

    const chartW = 260, chartH = 110, padL = 10, maxM = PROJECTION_GOAL_MONTHS;
    const wRange = current - (current * 0.78);
    const wToY = (w: number) => chartH - (((w - (current - wRange)) / wRange) * chartH * 0.9) - 5;
    const mToX = (m: number) => padL + (m / maxM) * chartW;
    const totalLoss = Math.max(0, current - target);

    const treatPts = Array.from({length: maxM + 1}, (_, m) => {
      const loss = Math.min(totalLoss, (m / PROJECTION_GOAL_MONTHS) * totalLoss);
      return {x: mToX(m), y: wToY(current - loss)};
    });
    const noPts = Array.from({length: maxM + 1}, (_, m) => ({x: mToX(m), y: wToY(current - Math.min(2, m * 0.2))}));
    const toPath = (pts: {x:number,y:number}[]) => pts.map((p,i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    return (
      <div className="px-4 py-6 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Your projected transformation</h2>
        <p className="text-xs text-gray-400 text-center mb-6">Based on clinical data from patients with your profile</p>

        <div className="w-full bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <svg viewBox={`0 0 ${chartW + padL + 20} ${chartH + 30}`} className="w-full">
            {[0, 3, 6].map(m => <line key={m} x1={mToX(m)} y1={0} x2={mToX(m)} y2={chartH} stroke="#F1F5F9" strokeWidth={1}/>)}
            <line x1={padL} y1={wToY(target)} x2={chartW+padL} y2={wToY(target)} stroke="#059669" strokeWidth={1} strokeDasharray="4,3"/>
            <text x={chartW+padL+2} y={wToY(target)+3} fontSize={8} fill="#059669" fontWeight={600}>Goal</text>
            <path d={toPath(noPts)} fill="none" stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="5,3"/>
            <path d={toPath(treatPts)} fill="none" stroke="#3B6D11" strokeWidth={2.5}/>
            {treatPts[projectedMonth] && <circle cx={mToX(projectedMonth)} cy={treatPts[projectedMonth].y} r={5} fill="#3B6D11"/>}
            {[0, 3, 6].map(m => <text key={m} x={mToX(m)} y={chartH+20} textAnchor="middle" fontSize={8} fill="#94A3B8">{m===0?'Now':`${m}mo`}</text>)}
          </svg>
          <div className="flex gap-4 justify-center mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-6 border-t-2 border-dashed border-gray-300"></span>Without</span>
            <span className="flex items-center gap-1"><span className="w-6 border-t-2 border-green-700"></span>With Sanative</span>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-sm font-semibold text-green-800">
            Reach <strong>{Math.round(target)}kg</strong> in <strong>{projectedMonth} months</strong>
          </p>
          <p className="text-xs text-green-600 mt-1">Clinical average: {cat?.percentLoss || '12–15%'} loss with program support*</p>
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

  const applyGenderToFormData = (gender: "male" | "female") => {
    const pruned = pruneGenderIncompatibleSelections(gender, {
      metabolicConditions: formData.metabolicConditions,
      seriousConditions: formData.seriousConditions,
      otherGoals: formData.otherGoals || [],
    });
    setFormData((prev) => ({
      ...prev,
      gender,
      ...pruned,
    }));
  };

  // ─── Other Health Goals Step (Cross-sell) ───────────────────────────────────
  const renderOtherGoalsStep = () => {
    const options = filteredOtherGoalOptions;

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
      <QuizStepShell
        title="What other health goals are on your mind?"
        subtitle="Select all that apply"
        greeting={renderGreeting()}
      >
        <div className="space-y-2.5 pt-1">
          {options.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(opt.id);
              }}
              className={`w-full py-3 px-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer select-none ${
                selected.includes(opt.id)
                  ? 'border-[#5c7a52] bg-[#5c7a52]/10'
                  : 'border-[#e6ebe3] bg-white hover:border-[#cdd8c6]'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 pointer-events-none ${
                selected.includes(opt.id)
                  ? 'border-[#5c7a52] bg-[#5c7a52]'
                  : 'border-[#cdd8c6]'
              }`}>
                {selected.includes(opt.id) && (
                  <Check className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <span className="text-sm text-[#2c3628] pointer-events-none">{opt.label}</span>
            </button>
          ))}
        </div>
      </QuizStepShell>
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
        <div className="flex-1 px-6 pt-6 pb-6">
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
                  Thanks for completing your assessment
                </h1>
                <p className="text-[#5c7a52] leading-relaxed">
                  Please proceed to book your doctor&apos;s consultation to discuss treatment and how the Sanative
                  program can help you achieve your goals.
                </p>
              </>
            )}
          </div>

          {/* Next steps — conversion-focused */}
          <div className="bg-white rounded-3xl border border-[#e6ebe3] shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5c7a52] to-[#7e9a72] flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#2c3628]">You&apos;re one step away</p>
                <p className="text-sm text-[#7e9a72]">Book your consultation now</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#2c3628]">
                  <span className="font-semibold">Reserve your doctor call</span> — pick a time that suits you in under 2 minutes
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#2c3628]">
                  <span className="font-semibold">Personalised treatment plan</span> — your doctor reviews your assessment and discusses options with you
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-gradient-to-br from-[#f4f7f2] to-[#eef4eb] border border-[#5c7a52]/25 p-3.5">
                <FlaskConical className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#2c3628]">
                  <span className="font-semibold">Biomarker-guided care — what makes Sanative different</span>
                  {" "}— when clinically appropriate, your doctor may request targeted blood tests so your plan
                  is shaped by real metabolic data, grounded in established clinical practice for weight and
                  metabolic health — not guesswork alone.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#2c3628]">
                  <span className="font-semibold">$100 off your first month</span> — applied at checkout when your doctor confirms the program is clinically suitable for you
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#2c3628]">
                  <span className="font-semibold">Ongoing support</span> — medication and lifestyle guidance delivered, with care team check-ins
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => animateToStep(19, 'forward')}
            className="w-full py-4 bg-[#5c7a52] hover:bg-[#4a6343] text-white font-semibold rounded-full text-lg transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(92,122,82,0.35)]"
          >
            Book my doctor consultation
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-sm text-[#5c7a52] mt-4 leading-relaxed">
            <span className="font-semibold text-[#2c3628]">Secure your spot today.</span>{" "}
            AHPRA-registered Australian doctors · Cancel anytime · Full refund if the program isn&apos;t clinically suitable for you
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
          console.error("Intake API error:", response.status, responseData);
          toast.error("Could not save your details", {
            description:
              responseData.error ||
              responseData.detail ||
              responseData.message ||
              "Please try again or contact support.",
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
    return formatTimeInTimezone(isoString, patientTimezone);
  };

  // ─── Handler: Select a time slot and create hold ────────────────────────────
  // UNIFIED CALENDAR: No doctor assignment - that happens during triage
  // FIX: Improved to prevent double holds and provide better UX
  const handleSlotSelection = async (slot: UnifiedSlot) => {
    if (slot.availabilityStatus === "BOOKED") return;

    // If this slot is already selected, do nothing
    if (formData.selectedSlotId === slot.slotId) return;

    // Prevent double-clicks while processing
    if (creatingHold) return;

    setCreatingHold(true);
    setSelectingSlotId(slot.slotId);
    setSlotsError(null);

    // Immediately clear previous selection visually for snappy UX
    const previousHoldId = bookingHoldId;
    const previousSlotId = formData.selectedSlotId;

    try {
      // Optimistically update UI immediately for snappy feel
      updateFormData('selectedSlotId', slot.slotId);
      const slotDate = new Date(slot.startTime);
      updateFormData('consultationDate', formatDateInTimezone(slotDate, patientTimezone, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }));
      updateFormData('consultationTime', formatSlotTime(slot.startTime));

      // Calculate BMI for the hold request
      const bmi = calculateBMI();

      // Create new hold - the API will automatically cancel any existing hold for this user
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

      // Update booking state with new hold
      setBookingHoldId(data.bookingHoldId);
      setHoldExpiry(new Date(data.holdExpiryTime));
      setSlotsRefreshKey((k) => k + 1);

      // Release previous hold in background (fire and forget - API already removed it)
      if (previousHoldId && previousHoldId !== data.bookingHoldId) {
        fetch(`/api/bookings/hold?holdId=${previousHoldId}`, {
          method: 'DELETE',
        }).catch(() => {
          // Silently ignore - hold will expire anyway
        });
      }

      // Subtle success feedback (no intrusive toast)
      // The UI already shows the selection, so just a brief visual confirmation
    } catch (error) {
      console.error('Error creating hold:', error);
      const message = error instanceof Error ? error.message : 'Failed to reserve time slot';
      setSlotsError(message);

      // Revert optimistic update on error
      if (previousSlotId) {
        updateFormData('selectedSlotId', previousSlotId);
      } else {
        updateFormData('selectedSlotId', '');
        updateFormData('consultationDate', '');
        updateFormData('consultationTime', '');
      }
      setBookingHoldId(previousHoldId);

      toast.error('Could not reserve this slot', { description: message });
    } finally {
      setCreatingHold(false);
      setSelectingSlotId(null);
    }
  };

  // ─── Payment success: confirm booking + advance to thank you ───────────────
  const handleCheckoutPaymentSuccess = async (paymentIntentId?: string) => {
    setMembershipPaid(true);
    setShowPaymentForm(false);

    if (bookingHoldId) {
      try {
        const confirmResponse = await fetch("/api/bookings/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingHoldId,
            paymentIntentId: paymentIntentId || "pi_manual_confirmation",
            userId,
            selectedPlan: "CORE",
            clientOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
          }),
        });

        if (confirmResponse.ok) {
          const confirmData = await confirmResponse.json();
          if (confirmData.magicLink) {
            setPortalMagicLink(confirmData.magicLink);
          }
          toast.success("Booking confirmed!", {
            description: `Your consultation is scheduled for ${formData.consultationDate} at ${formData.consultationTime}`,
          });
        } else {
          const errorData = await confirmResponse.json();
          console.error("[Booking] Confirmation failed:", errorData);
          toast.success("Payment successful!", {
            description: "Your consultation will be confirmed shortly.",
          });
        }
      } catch (error) {
        console.error("[Booking] Confirmation error:", error);
        toast.success("Payment successful!", {
          description: "Your consultation will be confirmed shortly.",
        });
      }

      setBookingHoldId(null);
      setHoldExpiry(null);
    } else {
      toast.success("Payment successful!", { description: "Your consultation is booked." });
    }

    animateToStep(21, "forward");
  };

  const handleCheckoutPaymentError = (error: string) => {
    setPaymentError(error);
    toast.error("Payment failed", { description: error });
  };

  // ─── Step 20: Unified checkout (booking + payment) ─────────────────────────
  const renderUnifiedCheckoutScreen = () => (
    <UnifiedCheckoutScreen
      formData={{
        consultationDate: formData.consultationDate,
        consultationTime: formData.consultationTime,
        selectedSlotId: formData.selectedSlotId,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      }}
      userId={userId}
      bookingHoldId={bookingHoldId}
      holdCountdown={holdCountdown}
      offerCountdown={offerCountdown}
      slotsError={slotsError}
      slotsRefreshKey={slotsRefreshKey}
      creatingHold={creatingHold}
      selectingSlotId={selectingSlotId}
      onSlotSelect={handleSlotSelection}
      onSlotsError={setSlotsError}
      onPaymentSuccess={handleCheckoutPaymentSuccess}
      onPaymentError={handleCheckoutPaymentError}
      patientTimezone={patientTimezone}
    />
  );


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
        animateToStep(21, 'forward');
        return;
      }

      setIsSubmitting(true);
      try {
        // Save biomarker selection to database
        await saveFinalQuizData();
        setBiomarkersPaid(true);
        toast.success("Biomarker panels added!", { description: `${selectedCount} panel(s) added to your order.` });
        animateToStep(21, 'forward');
      } catch (error) {
        console.error("Biomarker save error:", error);
        toast.error("Payment failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fdfbf7] to-white">
        <div className="px-6 pt-6 pb-40">
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
              onClick={() => animateToStep(21, 'forward')}
              className="w-full py-4 bg-[#2c3628] hover:bg-[#34412f] text-white font-semibold rounded-full text-lg transition-colors"
            >
              Continue without biomarkers
            </button>
          )}

          <button
            onClick={() => animateToStep(21, 'forward')}
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
    const portalLink = portalMagicLink
      ? buildPortalActivationMagicLink(portalMagicLink)
      : WM_POST_CHECKOUT_PATH;
    const buttonText = portalMagicLink ? "Activate my portal" : "Go to my program";

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
            Your consultation is booked. Activate your portal to follow your program journey.
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
              Use the button below to set your password and open your weight program home. Progress tracking unlocks when your treatment is active. During your appointment, your doctor will confirm whether treatment is clinically appropriate for you.
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
              Check your email for your activation link, or sign in if you already have an account
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

    // Step 20: Unified checkout (booking + payment)
    if (step === 20) {
      return renderUnifiedCheckoutScreen();
    }

    // Step 21: Thank you (step 22 biomarker upsell removed — post-consult only)
    if (step === 21) {
      return renderThankYouScreen();
    }

    switch (step) {
      // Step 1 - How much weight to lose
      case 1:
        return (
          <QuizStepShell title="How much weight are you looking to lose?">
            <div className="flex flex-col gap-2.5 pt-1">
              {weightLossGoals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => {
                    updateFormData("weightLossGoal", goal.id);
                  }}
                  className={`w-full px-5 py-3 rounded-full border-2 text-left text-base font-medium transition-all duration-200 ${
                    formData.weightLossGoal === goal.id
                      ? "border-[#5c7a52] bg-[#5c7a52] text-white"
                      : "border-[#e6ebe3] bg-white text-[#2c3628] hover:border-[#5c7a52]"
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </QuizStepShell>
        );

      // Step 2 - First Name
      case 2:
        return (
          <QuizStepShell title="What's your first name?">
            <div className="pt-2">
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => updateFormData("firstName", e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white text-center text-lg"
                placeholder="Enter your first name"
                autoFocus
              />
            </div>
          </QuizStepShell>
        );

      // Step 3 - Current Weight
      case 3:
        return (
          <QuizStepShell title="What's your current weight?" greeting={renderGreeting()}>
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.currentWeight}
                  onChange={(e) => updateFormData("currentWeight", e.target.value.replace(/[^\d.]/g, ""))}
                  className="w-40 px-4 py-3.5 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white text-center text-2xl font-medium"
                  placeholder="85"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7e9a72] font-medium">kg</span>
              </div>
              {formData.targetWeight && formData.currentWeight && (
                <p className="text-sm text-[#5c7a52]">
                  That&apos;s {(parseFloat(formData.currentWeight) - parseFloat(formData.targetWeight)).toFixed(1)} kg to lose
                </p>
              )}
            </div>
          </QuizStepShell>
        );

      // Step 4 - Height
      case 4:
        return (
          <QuizStepShell title="What's your height?" greeting={renderGreeting()}>
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.height}
                  onChange={(e) => updateFormData("height", e.target.value.replace(/\D/g, ""))}
                  className="w-40 px-4 py-3.5 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white text-center text-2xl font-medium"
                  placeholder="170"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7e9a72] font-medium">cm</span>
              </div>
              {bmi && (
                <p className="text-sm text-[#5c7a72]">BMI: {bmi.toFixed(1)}</p>
              )}
            </div>
          </QuizStepShell>
        );

      // Step 8 - Gender (after graph reveal)
      case 8:
        return (
          <QuizStepShell
            title="What gender were you assigned at birth?"
            subtitle="Biological sex affects how your body processes food and stores fat."
            greeting={renderGreeting()}
            headerExtra={
              <button
                type="button"
                onClick={() => setShowWhyAsking("gender")}
                className="mt-2 mx-auto flex items-center gap-1 text-xs text-[#5c7a52] hover:text-[#34412f]"
              >
                <Info className="w-3.5 h-3.5" />
                Why we&apos;re asking this
              </button>
            }
          >
            <div className="space-y-2.5 pt-1">
              {[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    applyGenderToFormData(option.value as "male" | "female");
                    setTimeout(() => animateToStep(step + 1, 'forward'), 300);
                  }}
                  className={`w-full py-3 px-6 rounded-xl border-2 text-center font-medium transition-all ${
                    formData.gender === option.value
                      ? "border-[#5c7a52] bg-[#5c7a52]/10 text-[#2c3628]"
                      : "border-[#e6ebe3] bg-white text-[#2c3628] hover:border-[#cdd8c6]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </QuizStepShell>
        );

      // Step 9 - Date of Birth
      case 9:
        return (
          <QuizStepShell
            title="What's your date of birth?"
            subtitle="You must be 18 or older for this program."
            greeting={renderGreeting()}
          >
            <DateOfBirthInput
              value={formData.dateOfBirth}
              onChange={(dob) => updateFormData("dateOfBirth", dob)}
              age={age}
              isValid={isValidAge}
            />
          </QuizStepShell>
        );

      // Step 10 - Motivations (moved earlier - "What do you want to accomplish?")
      case 10:
        return renderMotivations();

      // Step 12 - Metabolic conditions
      case 12:
        return renderConditionsStep(
          "Do you have any metabolic conditions?",
          "These affect how we prescribe medications.",
          filteredMetabolicConditions,
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
          <QuizStepShell
            title="Have you ever been diagnosed with any of these?"
            subtitle="These conditions may affect treatment eligibility."
            greeting={renderGreeting()}
            headerExtra={
              formData.seriousConditions.some(c => c !== "None of these apply") ? (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-left">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Some conditions may require additional review. Our doctor will discuss this with you.
                  </p>
                </div>
              ) : null
            }
          >
            <div className="space-y-2.5 pt-1">
              {filteredSeriousConditions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleArrayField("seriousConditions", option);
                  }}
                  className={`w-full py-3 px-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer select-none ${
                    formData.seriousConditions.includes(option)
                      ? "border-[#5c7a52] bg-[#5c7a52]/10"
                      : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 pointer-events-none ${
                    formData.seriousConditions.includes(option)
                      ? "border-[#5c7a52] bg-[#5c7a52]"
                      : "border-[#cdd8c6]"
                  }`}>
                    {formData.seriousConditions.includes(option) && (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-[#2c3628] pointer-events-none">{option}</span>
                </button>
              ))}
            </div>
          </QuizStepShell>
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
    <QuizStepShell title={title} subtitle={subtitle} greeting={renderGreeting()}>
      <div className="space-y-2.5 pt-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleArrayField(field, option);
            }}
            className={`w-full py-3 px-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer select-none ${
              (formData[field] as string[]).includes(option)
                ? "border-[#5c7a52] bg-[#5c7a52]/10"
                : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
            }`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 pointer-events-none ${
              (formData[field] as string[]).includes(option)
                ? "border-[#5c7a52] bg-[#5c7a52]"
                : "border-[#cdd8c6]"
            }`}>
              {(formData[field] as string[]).includes(option) && (
                <Check className="w-3.5 h-3.5 text-white" />
              )}
            </div>
            <span className="text-sm text-[#2c3628] pointer-events-none">{option}</span>
          </button>
        ))}
      </div>
    </QuizStepShell>
  );

  const renderMotivations = () => (
    <QuizStepShell
      title="What's driving your decision to lose weight?"
      subtitle="Select all that resonate with you."
      greeting={renderGreeting()}
    >
      <div className="space-y-2.5 pt-1">
        {motivationsOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleArrayField("motivations", option.label, "none");
            }}
            className={`w-full py-3 px-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer select-none ${
              formData.motivations.includes(option.label)
                ? "border-[#5c7a52] bg-[#5c7a52]/10"
                : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
            }`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 pointer-events-none ${
              formData.motivations.includes(option.label)
                ? "border-[#5c7a52] bg-[#5c7a52]"
                : "border-[#cdd8c6]"
            }`}>
              {formData.motivations.includes(option.label) && (
                <Check className="w-3.5 h-3.5 text-white" />
              )}
            </div>
            <span className="text-sm text-[#2c3628] pointer-events-none">{option.label}</span>
          </button>
        ))}
      </div>
    </QuizStepShell>
  );

  // Get button text based on step
  const getButtonText = () => {
    if (step === 7) return ""; // Loading screen has no button
    if (step === 12 || step === 14) return "Continue";
    // Email gate CTA at step 9
    if (step === 9) return "Create my account →";
    return "Continue →";
  };

  const useViewportLayout = VIEWPORT_QUIZ_STEPS.has(step);
  const useCreamTheme = step === 19 || step === 20;

  return (
    <div
      className={
        useViewportLayout
          ? "h-[100dvh] flex flex-col overflow-hidden bg-white"
          : useCreamTheme
          ? "min-h-screen bg-[#fdfbf7] overflow-y-auto"
          : "min-h-screen bg-white overflow-y-auto"
      }
      style={useViewportLayout ? undefined : { WebkitOverflowScrolling: "touch" }}
    >
      {/* UAT8-GAP-010: Legacy Intro Offer Popup - REMOVED
       * The old $50 promotion conflicted with the current $100 first-month discount.
       * The $100 discount is already shown in the payment step:
       * - Core: $349 → $249 (save $100)
       * - Precision: $499 → $399 (save $100)
       *
       * This popup was confusing users by mentioning a different discount amount.
       * The showIntroOffer state is now set to false by default.
       */}

      <header
        className={`${useViewportLayout || useCreamTheme ? "flex-shrink-0" : "sticky top-0"} ${
          useCreamTheme ? "bg-[#fdfbf7]/95" : "bg-white/95"
        } backdrop-blur-sm z-40 border-b border-[#e6ebe3]`}
      >
        <div
          className={`${step === 20 ? "max-w-7xl" : "max-w-2xl"} mx-auto px-4 sm:px-6 ${useViewportLayout ? "pt-3 pb-0" : "pt-4 pb-0"} flex items-center justify-between`}
        >
          <Link href="/" className={`font-serif text-[#34412f] ${useViewportLayout ? "text-xl" : "text-2xl"}`}>
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
        {SHOW_QUIZ_PHASE_PROGRESS(step) && (
          <QuizPhaseProgress
            step={step}
            compact={useViewportLayout}
            wide={step === 20}
          />
        )}
      </header>

      {/* Main content - full width on immersive steps (5–7) and checkout (20) */}
      <main
        className={
          step === 20
            ? "relative z-10 bg-[#fdfbf7]"
            : [5, 6, 7].includes(step)
            ? "relative z-10 w-full max-w-none p-0 overflow-hidden bg-[#fdfbf7]"
            : step === 19
            ? "max-w-2xl mx-auto px-4 py-6 relative z-10 bg-[#fdfbf7]"
            : useViewportLayout
            ? "flex-1 min-h-0 flex flex-col max-w-2xl mx-auto w-full px-4 pt-3 relative z-10 bg-white"
            : "max-w-2xl mx-auto px-4 py-8 relative z-10 bg-white"
        }
      >
        <div
          className={`transition-all duration-300 ease-out ${
            useViewportLayout ? "flex flex-col flex-1 min-h-0" : ""
          } ${
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
      {step < totalSteps && ![5, 6, 7, 18, 19, 20, 21].includes(step) && !showIntroOffer && (
        <div
          className={
            useViewportLayout
              ? "flex-shrink-0 bg-white z-[60] border-t border-[#e6ebe3] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
              : "fixed bottom-0 left-0 right-0 bg-white z-[60] border-t border-[#e6ebe3]"
          }
          style={{
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {!useViewportLayout && (
            <div className="absolute inset-x-0 bottom-0 h-[200px] bg-white -z-10" aria-hidden="true" />
          )}
          <div
            className="p-4"
            style={useViewportLayout ? undefined : { boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.08)" }}
          >
            <div className="max-w-2xl mx-auto flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-3.5 rounded-xl border border-[#cdd8c6] text-[#5c7a52] font-medium hover:bg-[#f4f7f2] transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1 py-3.5 bg-[#5c7a52] text-white font-medium rounded-xl hover:bg-[#4a6343] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {getButtonText()}
                {!getButtonText().includes("→") && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global white background to prevent any color bleeding */}
      <div
        className={`fixed inset-0 -z-50 pointer-events-none ${useCreamTheme ? "bg-[#fdfbf7]" : "bg-white"}`}
        aria-hidden="true"
      />

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

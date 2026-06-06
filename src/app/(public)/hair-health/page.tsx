"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import {
  ArrowRight,
  Microscope,
  Pill,
  HeartPulse,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  ShieldCheck,
  Clock,
  Beaker,
  Stethoscope,
  Star,
  Apple,
  Moon,
  Utensils,
  Brain,
  Activity,
  Dumbbell,
  Droplets,
  Leaf,
} from "lucide-react";

// Before/After Slider Component
function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After 6 Months",
}: {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current || !isDragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden cursor-ew-resize select-none"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onTouchMove={handleTouchMove}
    >
      {/* After Image (Background) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${afterImage})` }}
      />

      {/* Before Image (Foreground with clip) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${beforeImage})`,
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
      />

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
      >
        {/* Slider Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center">
          <div className="flex items-center gap-0.5">
            <ChevronDown className="w-4 h-4 text-[#34412f] -rotate-90" />
            <ChevronDown className="w-4 h-4 text-[#34412f] rotate-90" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-[#34412f]/90 text-white text-sm font-medium rounded-full">
        {beforeLabel}
      </div>
      <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-[#5c7a52]/90 text-white text-sm font-medium rounded-full">
        {afterLabel}
      </div>
    </div>
  );
}

// FAQ Item Component
function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[#e6ebe3]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="text-lg font-medium text-[#2c3628] pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[#5c7a52] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#5c7a52] flex-shrink-0" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-[#5c7a52] leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

function HairHealthPageContent() {
  const searchParams = useSearchParams();
  const [gender, setGender] = useState<"men" | "women">("women");
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [activeCause, setActiveCause] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCause, setPrevCause] = useState(0);

  // Read gender from URL query parameter on mount
  useEffect(() => {
    const genderParam = searchParams.get("gender");
    if (genderParam === "men" || genderParam === "male") {
      setGender("men");
    } else if (genderParam === "women" || genderParam === "female") {
      setGender("women");
    }
  }, [searchParams]);

  // Handle cause change with animation
  const handleCauseChange = (newCause: number) => {
    if (newCause === activeCause || isAnimating) return;
    setIsAnimating(true);
    setPrevCause(activeCause);
    setTimeout(() => {
      setActiveCause(newCause);
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    }, 200);
  };

  // Reset active cause when gender changes
  useEffect(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setActiveCause(0);
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    }, 200);
  }, [gender]);

  const conceptPillars = [
    {
      icon: Microscope,
      title: "Precise Diagnosis",
      subtitle: "Biomarker-driven insights",
      description: "Through comprehensive biomarker analysis — including hormones, thyroid function, iron, and vitamin levels — we identify the root causes of your hair loss at the cellular level.",
      image: "/images/blood-test-tubes.png",
    },
    {
      icon: Pill,
      title: "Evidence-Based Treatment",
      subtitle: "Stimulation at the cellular level",
      description: "Our therapies combine doctor-prescribed medications with a holistic approach — for genuine, lasting transformation.",
      image: "/images/supplements-pills.png",
    },
    {
      icon: HeartPulse,
      title: "Ongoing Support",
      subtitle: "Strong from the inside out",
      description: "Individually developed supplements based on your biomarker profile and hormone status — daily, measurably effective.",
      image: "/images/ongoing-support.png",
    },
  ];

  const hairLossCausesMen = [
    {
      id: "hereditary",
      title: "Hereditary",
      subtitle: "Androgenetic Alopecia",
      description: "Hereditary hair loss in men, also known as androgenetic alopecia, is the most common form of hair loss. Typical signs are a receding hairline, receding hairline and thinning hair on the crown.",
      details: "This is caused by a genetic predisposition in combination with a hypersensitivity to dihydrotestosterone (DHT) — a hormone that causes hair follicles to shrink and shortens hair growth. If left untreated, this can lead to complete baldness.",
      prevalence: "95% of cases",
      image: "https://images.pexels.com/photos/7697913/pexels-photo-7697913.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      id: "diffuse",
      title: "Diffuse Hair Loss",
      subtitle: "Telogen Effluvium",
      description: "Diffuse hair loss in men is characterized by a uniform thinning of the hair over the entire scalp, rather than a specific pattern only on the top of the head as in hereditary hair loss.",
      details: "It can be caused by various factors such as hormonal changes, stress, nutritional deficiencies or disease. A gradual loss of hair density can occur without certain areas of the head being more affected than others.",
      prevalence: "Common",
      image: "https://images.pexels.com/photos/6829573/pexels-photo-6829573.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      id: "circular",
      title: "Circular Hair Loss",
      subtitle: "Alopecia Areata",
      description: "Circular hair loss in men is characterized by the sudden appearance of circular or oval bald patches on the scalp. These bald patches can develop at different rates and vary in size.",
      details: "The exact cause is not fully understood, but it is thought to be an autoimmune disorder in which the immune system attacks the hair follicles. This condition can affect men of any age and may resolve on its own or require treatment.",
      prevalence: "2% of population",
      image: "https://images.pexels.com/photos/5646825/pexels-photo-5646825.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      id: "traction",
      title: "Traction Alopecia",
      subtitle: "Mechanical Hair Loss",
      description: "Traction alopecia is caused by repeated pulling or tugging on the hair, typically by certain hairstyles such as tight ponytails, braids, or man buns worn consistently over time.",
      details: "This pulling can lead to damage to the hair follicles and permanent hair loss in the affected areas. Traction alopecia often appears along the hairline or on the sides of the head. Early intervention is key to preventing permanent damage.",
      prevalence: "Lifestyle-related",
      image: "https://images.pexels.com/photos/32721706/pexels-photo-32721706.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
  ];

  const hairLossCausesWomen = [
    {
      id: "hereditary",
      title: "Hereditary",
      subtitle: "Female Androgenetic Alopecia",
      description: "Hereditary hair loss in women, also known as female androgenetic alopecia, is the most common form of hair loss in women. This genetic form can occur at a young age and is usually characterized by a gradual thinning of the hair on the crown.",
      details: "Hormonal changes, particularly increased androgen levels such as testosterone, have a significant influence on the development of this form of hair loss, as they reduce the size of the hair follicles and slow down hair growth. Early intervention and targeted treatment can help to stop the progression.",
      prevalence: "Most common",
      image: "https://images.pexels.com/photos/3764568/pexels-photo-3764568.jpeg?auto=compress&cs=tinysrgb&w=600",
      patternImage: "https://cdn-joddj.nitrocdn.com/ZwCNHXcYUInPGlkxtPSBefGLXZGKEkkk/assets/images/optimized/rev-664b77c/www.forhair.com/wp-content/uploads/2006/10/ludwig-scale-female-hair-loss-grades.webp-1024x687.jpg",
    },
    {
      id: "hormonal",
      title: "Hormonal Changes",
      subtitle: "Life Stage Related",
      description: "Hormonal changes during a woman's life, such as pregnancy, the menopause or after stopping hormonal contraceptives, can lead to significant hair loss or changes in hair condition.",
      details: "After giving birth, many women experience increased hair loss due to hormonal changes. During menopause, oestrogen levels decrease and the effect of androgens increases, which can trigger thinning. Stopping the pill can also cause temporary telogen effluvium as the body adjusts.",
      prevalence: "Very common",
      image: "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=600",
      patternImage: "https://images.pexels.com/photos/7176319/pexels-photo-7176319.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      id: "diffuse",
      title: "Diffuse Hair Loss",
      subtitle: "Telogen Effluvium",
      description: "Diffuse hair loss in women is characterized by evenly distributed hair loss over the entire head, which leads to an overall thin hair structure and usually lasts for several months.",
      details: "This type of hair loss can be caused by various factors such as hormonal changes, nutritional deficiencies, psychological or physical stress, illness or medication. Unlike circular hair loss, no clear bald patches are recognizable — just overall thinning.",
      prevalence: "Common",
      image: "https://images.pexels.com/photos/3764568/pexels-photo-3764568.jpeg?auto=compress&cs=tinysrgb&w=600",
      patternImage: "https://kopelmanhair.com/wp-content/uploads/2025/08/ludwig-scale-female-hair-loss-e1755057003343-1200x720.webp",
    },
    {
      id: "circular",
      title: "Circular Hair Loss",
      subtitle: "Alopecia Areata",
      description: "Circular hair loss in women, also known as alopecia areata, is an autoimmune disorder that leads to sudden hair loss causing circular or oval bald patches on the scalp.",
      details: "These bald patches can vary in size and quickly increase or disappear. The exact cause is not fully understood, but it is thought that the immune system mistakenly regards hair follicles as foreign bodies and attacks them. Treatment can help manage the condition.",
      prevalence: "2% of population",
      image: "https://images.pexels.com/photos/3771120/pexels-photo-3771120.jpeg?auto=compress&cs=tinysrgb&w=600",
      patternImage: "https://images.pexels.com/photos/3771120/pexels-photo-3771120.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      id: "traction",
      title: "Traction Alopecia",
      subtitle: "Styling-Related",
      description: "Traction alopecia in women is hair loss caused by repeated tension or pulling on the hair, such as from tight hairstyles, hair extensions, or regular styling with heat tools.",
      details: "This causes damage to the hair follicles and can lead to permanent hair loss, especially along the hairline or in areas where hair has been pulled tight. Avoiding tight hairstyles and giving hair regular breaks from extensions can help prevent this type of hair loss.",
      prevalence: "Lifestyle-related",
      image: "https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=600",
      patternImage: "https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
  ];

  // Lifestyle factors for women
  const lifestyleFactorsWomen = [
    {
      icon: Utensils,
      title: "Diet & Nutrition",
      description: "Iron deficiency is one of the most common causes of hair loss in women. A balanced diet rich in protein, iron, zinc, biotin, and vitamins A, C, D, and E supports healthy hair growth.",
      tips: ["Increase iron-rich foods like leafy greens and lean meats", "Ensure adequate protein intake (45-55g daily)", "Include omega-3 fatty acids from fish or flaxseed"],
      color: "bg-[#c17a58]",
    },
    {
      icon: Brain,
      title: "Stress Management",
      description: "Chronic stress triggers telogen effluvium, pushing hair follicles into a resting phase. Cortisol also disrupts the hair growth cycle and can worsen hormonal imbalances.",
      tips: ["Practice mindfulness or meditation daily", "Maintain regular sleep schedule", "Consider adaptogenic herbs like ashwagandha"],
      color: "bg-[#5c7a52]",
    },
    {
      icon: Moon,
      title: "Sleep Quality",
      description: "During sleep, your body repairs and regenerates cells, including hair follicles. Poor sleep disrupts melatonin production and growth hormone release, affecting hair health.",
      tips: ["Aim for 7-9 hours of quality sleep", "Keep consistent sleep/wake times", "Create a dark, cool sleeping environment"],
      color: "bg-[#34412f]",
    },
    {
      icon: Activity,
      title: "Hormonal Balance",
      description: "Fluctuating hormones during menstruation, pregnancy, postpartum, and menopause significantly impact hair. PCOS and thyroid disorders are common hormonal causes of hair loss.",
      tips: ["Regular hormone panel blood tests", "Monitor thyroid function (TSH, T3, T4)", "Consider bioidentical hormone therapy if needed"],
      color: "bg-[#7e9a72]",
    },
    {
      icon: Dumbbell,
      title: "Exercise & Circulation",
      description: "Regular exercise improves blood circulation to the scalp, delivering essential nutrients to hair follicles. It also helps regulate hormones and reduce stress.",
      tips: ["30 minutes moderate exercise 5x weekly", "Include scalp massage for circulation", "Avoid over-exercising which can stress the body"],
      color: "bg-[#a8bb9e]",
    },
    {
      icon: Droplets,
      title: "Hydration & Detox",
      description: "Dehydration affects hair shaft strength and scalp health. Water helps flush toxins that can damage follicles and transports nutrients to hair cells.",
      tips: ["Drink 2-3 liters of water daily", "Limit alcohol and caffeine intake", "Eat water-rich fruits and vegetables"],
      color: "bg-[#cdd8c6]",
    },
  ];

  const hairLossCauses = gender === "men" ? hairLossCausesMen : hairLossCausesWomen;

  const processSteps = [
    {
      number: "01",
      title: "Online Assessment",
      description: "Complete a comprehensive health questionnaire covering your medical history, hair loss patterns, lifestyle factors, and treatment goals. Takes about 10 minutes.",
      details: [
        "Hair loss pattern & timeline",
        "Family history assessment",
        "Current medications review",
        "Lifestyle & stress factors",
      ],
    },
    {
      number: "02",
      title: "Biomarker Analysis",
      description: "Based on your assessment, we recommend targeted blood tests to identify underlying causes. Blood sample collection at a pathology centre near you.",
      details: [
        "Hormone panel (DHT, testosterone)",
        "Thyroid function markers",
        "Iron & ferritin levels",
        "Vitamin D & B12 status",
      ],
    },
    {
      number: "03",
      title: "Doctor Consultation",
      description: "An Australian-registered doctor reviews your results, explains the findings, and creates a personalised treatment plan tailored to your needs.",
      details: [
        "AHPRA-registered practitioners",
        "Video or phone consultation",
        "Detailed results explanation",
        "Treatment recommendations",
      ],
    },
    {
      number: "04",
      title: "Treatment & Monitoring",
      description: "Begin your personalised treatment with ongoing clinical support. Regular check-ins ensure your progress is on track and adjustments are made as needed.",
      details: [
        "Discreet delivery to your door",
        "Scheduled progress reviews",
        "Photo tracking app",
        "Dose optimisation support",
      ],
    },
  ];

  const treatments = [
    {
      name: "Minoxidil",
      type: "Topical Solution",
      description: "Clinically-proven treatment that stimulates hair follicles and promotes regrowth. Available in various strengths.",
      forWho: ["Men", "Women"],
    },
    {
      name: "Finasteride",
      type: "Oral Medication",
      description: "Blocks DHT hormone that causes male pattern baldness. Clinically proven to stop hair loss and promote regrowth.",
      forWho: ["Men"],
    },
    {
      name: "Spironolactone",
      type: "Oral Medication",
      description: "Anti-androgen treatment for female pattern hair loss. Reduces the effects of hormones that cause thinning.",
      forWho: ["Women"],
    },
    {
      name: "Custom Supplements",
      type: "Nutritional Support",
      description: "Biomarker-guided supplements targeting specific deficiencies like iron, biotin, zinc, and vitamin D.",
      forWho: ["Men", "Women"],
    },
  ];

  const effectivenessData = [
    { label: "Our Holistic Approach", percentage: 90, color: "bg-[#5c7a52]" },
    { label: "Medication Alone", percentage: 65, color: "bg-[#a8bb9e]" },
    { label: "OTC Supplements Only", percentage: 35, color: "bg-[#cdd8c6]" },
    { label: "No Treatment", percentage: 5, color: "bg-[#e6ebe3]" },
  ];

  const faqs = [
    {
      question: "How quickly will I see results?",
      answer: "Most patients begin to notice reduced shedding within 2-3 months. Visible regrowth typically appears between 4-6 months, with optimal results at 12 months. Hair growth is a gradual process, and consistency with treatment is key to success.",
    },
    {
      question: "Are these treatments safe?",
      answer: "All treatments we prescribe have been extensively studied and approved for use in Australia. Our AHPRA-registered doctors carefully review your health history to ensure suitability. Side effects are generally mild and uncommon, and we monitor your progress throughout treatment.",
    },
    {
      question: "Do I need a blood test?",
      answer: "While not always mandatory, blood tests help us identify underlying causes of hair loss such as hormonal imbalances, thyroid issues, or nutritional deficiencies. This allows for more targeted and effective treatment. We'll recommend tests based on your assessment.",
    },
    {
      question: "Will my hair loss return if I stop treatment?",
      answer: "For conditions like androgenetic alopecia (pattern hair loss), ongoing treatment is typically needed to maintain results. However, addressing underlying deficiencies may provide lasting benefits even after supplementation stops. Your doctor will discuss long-term management options.",
    },
    {
      question: "Is treatment different for men and women?",
      answer: "Yes, the causes and treatments for hair loss differ between men and women. Men often benefit from DHT-blocking medications like finasteride, while women may require different approaches such as anti-androgens or hormonal treatments. We personalise every treatment plan.",
    },
    {
      question: "How much does treatment cost?",
      answer: "Treatment costs vary depending on your personalised plan. Basic treatments start from $59/month, while comprehensive programs including supplements and ongoing support range from $99-199/month. All prices include doctor consultations and delivery.",
    },
  ];

  // Before/After images - using actual patient photos
  const beforeAfterImages = {
    men: [
      {
        before: "/images/men-before-1.jpg",
        after: "/images/men-after-1.jpg",
        name: "James M.",
        treatment: "Finasteride + Minoxidil",
        duration: "8 months",
      },
      {
        before: "/images/men-before-2.jpg",
        after: "/images/men-after-2.jpg",
        name: "Michael R.",
        treatment: "Complete Hair Program",
        duration: "12 months",
      },
    ],
    women: [
      {
        before: "/images/female-before-1.webp",
        after: "/images/female-after-1.jpg",
        name: "Sarah L.",
        treatment: "Minoxidil + Supplements",
        duration: "6 months",
      },
      {
        before: "/images/female-before-2.webp",
        after: "/images/female-after-2.jpg",
        name: "Emma T.",
        treatment: "Spironolactone + Biotin",
        duration: "10 months",
      },
    ],
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fdfbf7]">
        {/* Hero Section */}
        <section className="relative py-8 lg:py-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#cdd8c6] via-[#e6ebe3] to-[#f4f7f2]" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#a8bb9e]/20 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                {/* Gender Toggle - Moved to top */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm text-[#5c7a52]">I am:</span>
                  <div className="flex bg-white rounded-full p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setGender("women")}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                        gender === "women"
                          ? "bg-[#5c7a52] text-white"
                          : "text-[#5c7a52] hover:bg-[#f4f7f2]"
                      }`}
                    >
                      Female
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender("men")}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                        gender === "men"
                          ? "bg-[#5c7a52] text-white"
                          : "text-[#5c7a52] hover:bg-[#f4f7f2]"
                      }`}
                    >
                      Male
                    </button>
                  </div>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#2c3628] leading-tight mb-6">
                  Grow{" "}
                  <span className="text-[#5c7a52] italic">fuller</span>,{" "}
                  <span className="text-[#5c7a52] italic">healthier</span>{" "}
                  hair
                </h1>
                <p className="text-lg text-[#5c7a52] mb-6 max-w-lg">
                  Personalised treatment plans backed by biomarker analysis. Prescribed by Australian-registered doctors, delivered to your door.
                </p>

                {/* Pricing & Membership Banner */}
                <div className="mb-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-serif text-[#2c3628]">$39</span>
                      <span className="text-[#5c7a52]">/month for Members</span>
                    </div>
                    <Link
                      href="/membership"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c17a58] hover:bg-[#a9634a] text-white text-sm font-medium rounded-full transition-all hover:scale-105"
                    >
                      Become a Member
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="relative overflow-hidden flex items-center gap-2 bg-gradient-to-r from-[#5c7a52] to-[#4a6343] text-white px-4 py-2.5 rounded-xl w-fit group">
                    {/* Animated shine effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out" />
                    <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    {/* GAP-023: Removed "free biomarker" positioning */}
                    <Sparkles className="w-4 h-4 flex-shrink-0 animate-pulse" />
                    <span className="text-sm font-medium relative">Blood tests requested where clinically appropriate</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/hair-assessment"
                    className="btn-primary inline-flex items-center justify-center gap-2"
                  >
                    Start your assessment
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="btn-secondary inline-flex items-center justify-center"
                  >
                    Learn how it works
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap gap-6 mt-10 text-sm text-[#5c7a52]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#5c7a52]" />
                    <span>AHPRA Doctors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#5c7a52]" />
                    <span>AHPRA Doctors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#5c7a52]" />
                    <span>Discreet Delivery</span>
                  </div>
                </div>
              </div>

              {/* Hero Image */}
              <div className="relative">
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={gender === "women"
                      ? "https://images.pexels.com/photos/1308881/pexels-photo-1308881.jpeg?auto=compress&cs=tinysrgb&w=800&h=1000&dpr=1"
                      : "https://images.pexels.com/photos/6829574/pexels-photo-6829574.jpeg?auto=compress&cs=tinysrgb&w=800&h=1000&dpr=1"
                    }
                    alt={`${gender === "women" ? "Woman" : "Man"} with healthy hair`}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#34412f]/40 to-transparent" />

                  {/* Floating Stats Card */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#7e9a72]">Average results after 6 months</p>
                        <p className="text-2xl font-serif text-[#2c3628]">83% see visible improvement</p>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-[#5c7a52]/20 flex items-center justify-center">
                        <Sparkles className="w-7 h-7 text-[#5c7a52]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Concept Section */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Our approach
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                Medicine with{" "}
                <span className="text-[#5c7a52] italic">depth and vision</span>
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
                We stand for a holistic, personalised treatment approach that goes far beyond conventional solutions and promotes natural, visible results.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-stretch">
              {conceptPillars.map((pillar, index) => (
                <div
                  key={pillar.title}
                  className="group bg-[#f4f7f2] rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="p-8 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mb-6">
                      <pillar.icon className="w-7 h-7 text-[#5c7a52]" />
                    </div>
                    <h3 className="text-xl font-serif text-[#2c3628] mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-[#7e9a72] mb-4">{pillar.subtitle}</p>
                    <p className="text-[#5c7a52] leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                  <div className={`relative h-64 overflow-hidden rounded-b-3xl ${
                    pillar.title === "Ongoing Support" ? "bg-[#f5f0e8]" : ""
                  }`}>
                    <img
                      src={pillar.image}
                      alt={pillar.title}
                      className={`w-full h-full group-hover:scale-105 transition-transform duration-500 ${
                        pillar.title === "Ongoing Support"
                          ? "object-contain object-center"
                          : "object-cover object-bottom"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hair Loss Causes Section - Updated with animations */}
        <section className="py-20 lg:py-28 bg-[#f4f7f2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#5c7a52]/20 text-[#5c7a52] rounded-full mb-4">
                Understanding the problem
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                What are the causes of{" "}
                <span className="text-[#5c7a52] italic">
                  hair loss in {gender === "men" ? "men" : "women"}?
                </span>
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
                {gender === "men"
                  ? "Hair loss and thinning hair in men is a multifaceted problem that can manifest itself in different ways. Understanding the cause is the first step to effective treatment."
                  : "Hair loss and thinning hair in women is an often underestimated problem that can manifest in many different ways. The causes are diverse and can vary from genetic factors to hormonal changes."}
              </p>
            </div>

            {/* Cause Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {hairLossCauses.map((cause, index) => (
                <button
                  key={cause.id}
                  type="button"
                  onClick={() => handleCauseChange(index)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform ${
                    activeCause === index
                      ? "bg-[#5c7a52] text-white shadow-lg scale-105"
                      : "bg-white text-[#5c7a52] hover:bg-[#e6ebe3] border border-[#cdd8c6] hover:scale-102"
                  }`}
                >
                  {cause.title}
                </button>
              ))}
            </div>

            {/* Active Cause Content with Animation */}
            <div
              className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center transition-all duration-300 ${
                isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
              }`}
            >
              <div className="order-2 lg:order-1">
                <div className="bg-white rounded-3xl p-8 shadow-sm transform transition-all duration-500 hover:shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 text-xs font-semibold bg-[#c17a58]/20 text-[#c17a58] rounded-full animate-pulse">
                      {hairLossCauses[activeCause].prevalence}
                    </span>
                    <span className="text-sm text-[#7e9a72]">
                      {hairLossCauses[activeCause].subtitle}
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif text-[#2c3628] mb-4">
                    {hairLossCauses[activeCause].title}
                  </h3>
                  <p className="text-[#5c7a52] leading-relaxed mb-4">
                    {hairLossCauses[activeCause].description}
                  </p>
                  <p className="text-[#7e9a72] leading-relaxed mb-6">
                    {hairLossCauses[activeCause].details}
                  </p>
                  <Link
                    href="/hair-assessment"
                    className="inline-flex items-center gap-2 text-[#5c7a52] font-medium hover:text-[#34412f] transition-colors group"
                  >
                    Get diagnosed
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl transform transition-all duration-500 hover:scale-[1.02]">
                  <img
                    src={hairLossCauses[activeCause].image}
                    alt={hairLossCauses[activeCause].title}
                    className="w-full h-full object-cover transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#34412f]/30 to-transparent" />
                </div>
              </div>
            </div>

            {/* Quick Navigation Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {hairLossCauses.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleCauseChange(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    activeCause === index
                      ? "bg-[#5c7a52] w-8"
                      : "bg-[#cdd8c6] w-2.5 hover:bg-[#a8bb9e]"
                  }`}
                  aria-label={`View cause ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Women's Hair Loss Patterns & Lifestyle Section - Only shown for women */}
        {gender === "women" && (
          <section className="py-12 sm:py-16 lg:py-20 bg-[#fdfbf7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Ludwig Scale Header */}
              <div className="text-center mb-8 sm:mb-12">
                <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium bg-[#c17a58]/20 text-[#c17a58] rounded-full mb-3 sm:mb-4">
                  Female pattern recognition
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-[#2c3628] mb-4 sm:mb-6">
                  Understanding the{" "}
                  <span className="text-[#5c7a52] italic">Ludwig Scale</span>
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-[#5c7a52] max-w-2xl mx-auto">
                  The standard classification system for female pattern hair loss.
                </p>
              </div>

              {/* Ludwig Scale Visual */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10 shadow-sm border border-[#e6ebe3]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    {
                      stage: "Type I",
                      title: "Mild Thinning",
                      description: "Early stage with minimal visible hair loss. Most treatable stage.",
                      image: "https://images.pexels.com/photos/1308881/pexels-photo-1308881.jpeg?auto=compress&cs=tinysrgb&w=400",
                      treatability: "95%",
                    },
                    {
                      stage: "Type II",
                      title: "Moderate Thinning",
                      description: "Noticeable widening of the part line. Scalp more visible.",
                      image: "https://images.pexels.com/photos/3764568/pexels-photo-3764568.jpeg?auto=compress&cs=tinysrgb&w=400",
                      treatability: "80%",
                    },
                    {
                      stage: "Type III",
                      title: "Advanced Thinning",
                      description: "Significant hair loss. Requires intensive treatment.",
                      image: "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=400",
                      treatability: "60%",
                    },
                  ].map((stage) => (
                    <div
                      key={stage.stage}
                      className="bg-[#f4f7f2] rounded-xl sm:rounded-2xl overflow-hidden group"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={stage.image}
                          alt={stage.title}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 px-2.5 py-0.5 bg-[#5c7a52] text-white text-xs font-medium rounded-full">
                          {stage.stage}
                        </div>
                        <div className="absolute bottom-3 right-3 px-2.5 py-0.5 bg-white/90 backdrop-blur-sm text-[#5c7a52] text-xs font-medium rounded-full">
                          {stage.treatability} treatable
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-base sm:text-lg font-serif text-[#2c3628] mb-1">{stage.title}</h3>
                        <p className="text-xs sm:text-sm text-[#5c7a52] leading-relaxed">{stage.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lifestyle Factors - Integrated Card */}
              <div className="mt-6 sm:mt-8 bg-white rounded-2xl sm:rounded-3xl border border-[#e6ebe3] overflow-hidden shadow-sm">
                {/* Header */}
                <div className="bg-[#f4f7f2] px-4 sm:px-6 py-3 sm:py-4 border-b border-[#e6ebe3]">
                  <h3 className="text-base sm:text-lg font-serif text-[#2c3628]">
                    6 lifestyle factors that affect your hair
                  </h3>
                </div>

                {/* Compact Grid Infographic - Mobile optimized */}
                <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-[#e6ebe3]">
                  {lifestyleFactorsWomen.map((factor) => (
                    <div
                      key={factor.title}
                      className="p-3 sm:p-4 flex flex-col items-center text-center group cursor-default hover:bg-[#f4f7f2] transition-colors"
                    >
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${factor.color} flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform`}>
                        <factor.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-[#2c3628] leading-tight">{factor.title}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-[#5c7a52] to-[#34412f] px-4 sm:px-6 py-4 sm:py-5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <p className="text-white text-center sm:text-left text-sm sm:text-base">
                      <span className="font-medium">Not sure which is affecting you?</span>
                      <span className="text-[#a8bb9e] block sm:inline sm:ml-1">Our biomarker test finds out in 48 hours.</span>
                    </p>
                    <Link
                      href="/hair-assessment"
                      className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white text-[#34412f] text-xs sm:text-sm font-medium rounded-full hover:bg-[#f4f7f2] transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      Take the test
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Before/After Results Section */}
        <section className="py-20 lg:py-28 bg-[#34412f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-white/10 text-[#a8bb9e] rounded-full mb-4">
                Real experiences
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6">
                Visible results,{" "}
                <span className="text-[#a8bb9e] italic">real people</span>
              </h2>
              <p className="text-lg text-[#a8bb9e] max-w-2xl mx-auto mb-8">
                Drag the slider to see the transformation. These are real patients who followed their personalised treatment plans.
              </p>

              {/* Gender Toggle */}
              <div className="flex justify-center mb-12">
                <div className="flex bg-white/10 rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => setGender("women")}
                    className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all ${
                      gender === "women"
                        ? "bg-white text-[#34412f]"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    Women&apos;s Results
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("men")}
                    className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all ${
                      gender === "men"
                        ? "bg-white text-[#34412f]"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    Men&apos;s Results
                  </button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {beforeAfterImages[gender].map((result, index) => (
                <div key={result.name} className="bg-white/5 rounded-3xl p-6 backdrop-blur-sm">
                  <BeforeAfterSlider
                    beforeImage={result.before}
                    afterImage={result.after}
                    beforeLabel="Before"
                    afterLabel={`After ${result.duration}`}
                  />
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-serif text-white">{result.name}</h3>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-[#c17a58] text-[#c17a58]" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[#a8bb9e] text-sm">
                      <span className="text-white font-medium">{result.treatment}</span> · {result.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-sm text-[#7e9a72]">
                Individual results may vary. Photos are from consenting patients.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div className="lg:sticky lg:top-32">
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                  Your journey
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                  A clinically rigorous{" "}
                  <span className="text-[#5c7a52] italic">process</span>
                </h2>
                <p className="text-lg text-[#5c7a52] mb-8">
                  From initial assessment through ongoing care, every step is guided by evidence-based medicine and supervised by qualified healthcare professionals.
                </p>
                <Link
                  href="/hair-assessment"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Start your assessment
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="space-y-4">
                {processSteps.map((step, index) => (
                  <div
                    key={step.number}
                    className={`bg-white rounded-2xl border transition-all duration-300 ${
                      activeStep === index
                        ? "border-[#5c7a52] shadow-lg"
                        : "border-[#e6ebe3] hover:border-[#cdd8c6]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveStep(activeStep === index ? null : index)}
                      className="w-full p-6 flex items-start gap-4 text-left"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#5c7a52] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-white">{step.number}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-serif text-[#2c3628] mb-2">
                          {step.title}
                        </h3>
                        <p className="text-[#5c7a52] text-sm leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-[#5c7a52] flex-shrink-0 transition-transform ${
                          activeStep === index ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        activeStep === index ? "max-h-64" : "max-h-0"
                      }`}
                    >
                      <div className="px-6 pb-6 pl-[88px]">
                        <div className="grid sm:grid-cols-2 gap-3">
                          {step.details.map((detail) => (
                            <div key={detail} className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-[#5c7a52]" />
                              <span className="text-sm text-[#5c7a52]">{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Effectiveness Section */}
        <section className="py-20 lg:py-28 bg-[#f4f7f2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#5c7a52]/20 text-[#5c7a52] rounded-full mb-4">
                  Why it works
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                  Our approach is{" "}
                  <span className="text-[#5c7a52] italic">more effective</span>
                </h2>
                <p className="text-lg text-[#5c7a52] mb-8">
                  Unlike conventional treatments, we combine medical diagnostics, targeted treatments, and personalised care strategies to create a multi-therapy approach proven to be more effective than isolated treatments.
                </p>
                <Link
                  href="/hair-assessment"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  Learn more about our method
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="space-y-6">
                {effectivenessData.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#2c3628]">{item.label}</span>
                      <span className="text-sm font-bold text-[#5c7a52]">{item.percentage}%</span>
                    </div>
                    <div className="h-4 bg-white rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-[#7e9a72] mt-4">
                  *Based on internal patient outcome data. Individual results may vary.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Treatments Section */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Our treatments
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                Evidence-based{" "}
                <span className="text-[#5c7a52] italic">solutions</span>
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
                Doctor-prescribed medications and supplements, prescribed by AHPRA-registered doctors based on your unique biomarker profile.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {treatments.map((treatment) => (
                <div
                  key={treatment.name}
                  className="bg-white rounded-2xl p-6 border border-[#e6ebe3] hover:border-[#5c7a52] hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-wrap gap-2 mb-4">
                    {treatment.forWho.map((who) => (
                      <span
                        key={who}
                        className="px-2 py-0.5 text-xs font-medium bg-[#f4f7f2] text-[#5c7a52] rounded-full"
                      >
                        {who}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-xl font-serif text-[#2c3628] mb-1">
                    {treatment.name}
                  </h3>
                  <p className="text-sm text-[#7e9a72] mb-3">{treatment.type}</p>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">
                    {treatment.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-20 lg:py-28 bg-[#e6ebe3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">AHPRA Registered</h3>
                <p className="text-sm text-[#5c7a52]">All doctors are fully registered with the Australian Health Practitioner Regulation Agency</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">Australian Pharmacy</h3>
                <p className="text-sm text-[#5c7a52]">All medications are dispensed by licensed Australian pharmacies</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">10,000+ Patients</h3>
                <p className="text-sm text-[#5c7a52]">Trusted by thousands of Australians on their hair regrowth journey</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-[#5c7a52]" />
                </div>
                <h3 className="text-lg font-serif text-[#2c3628] mb-2">Ongoing Support</h3>
                <p className="text-sm text-[#5c7a52]">Regular check-ins and dose adjustments throughout your treatment</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Common questions
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                Frequently asked questions
              </h2>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === index}
                  onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 lg:py-28 bg-[#34412f]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6">
              Discover the cause of your hair loss —{" "}
              <span className="text-[#a8bb9e] italic">start with a diagnosis</span>
            </h2>
            <p className="text-lg text-[#a8bb9e] mb-10 max-w-2xl mx-auto">
              Our experienced team uses professional biomarker analysis to precisely identify the causes of your hair loss. Based on this, we develop a customised, medically sound therapy.
            </p>
            <Link
              href="/hair-assessment"
              className="btn-white inline-flex items-center gap-2 text-lg px-8 py-4"
            >
              Start your assessment
              <ArrowRight className="w-5 h-5" />
            </Link>
            {/* GAP-026: Removed 'No commitment' - payment required */}
            <p className="mt-6 text-sm text-[#7e9a72]">
              Free assessment · Refund if not suitable · Results in 48 hours
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function HairHealthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fdfbf7]" />}>
      <HairHealthPageContent />
    </Suspense>
  );
}

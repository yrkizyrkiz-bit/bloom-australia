import { Beaker, Video, LineChart, Sparkles } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: Beaker,
      title: "Check your health",
      description: [
        "All our programs start with a",
        "comprehensive health check.",
        "Choose the Sanative",
        "biomarker panel (85+ markers)",
        "for holistic insight into your",
        "health for $1/day.",
      ].join("\n"),
    },
    {
      number: "02",
      icon: Video,
      title: "Doctor consultation",
      description: [
        "A telehealth consultation with",
        "an AHPRA registered doctor.",
        "Share your health history and",
        "goals so we can tailor insights",
        "to you. Get your pathology",
        "referral for your blood test.",
      ].join("\n"),
    },
    {
      number: "03",
      icon: LineChart,
      title: "Get your biomarker results",
      description: [
        "After completing your blood test,",
        "clear results appear with insight.",
        "Monitor health changes, targets",
        "and progress over time, all in",
        "one place, easy to track and",
        "understand on the Sanative app.",
      ].join("\n"),
    },
    {
      number: "04",
      icon: Sparkles,
      title: "Unlock your health action plan",
      description: [
        "Join the many staying ahead of",
        "their health with preventative",
        "care, customised based on your",
        "results, or unlock any Sanative",
        "program with your first month",
        "membership on us.",
      ].join("\n"),
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-[#fdfbf7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-serif text-[#2c3628]">
            How <span className="text-[#5c7a52] italic">sanative</span> works
          </h2>
          <p className="mt-4 text-lg text-[#5c7a52] max-w-2xl mx-auto">
            Healthcare that fits your life. No waiting rooms, no hassle.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
          {steps.map((step, index) => (
            <div key={step.number} className="relative flex h-full">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gradient-to-r from-[#cdd8c6] to-[#a8bb9e] z-0" />
              )}

              <div className="relative z-10 flex h-full w-full flex-col bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-[#e6ebe3] hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-[#cdd8c6] to-[#a8bb9e] flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-[#34412f]" />
                  </div>
                  <span className="text-3xl font-serif text-[#a8bb9e] leading-none">
                    {step.number}
                  </span>
                </div>

                <h3 className="min-h-[3.25rem] text-xl font-serif text-[#2c3628] mb-3 leading-snug">
                  {step.title}
                </h3>
                <p className="min-h-[9.75rem] flex-1 text-[#5c7a52] text-sm leading-relaxed whitespace-pre-line">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Stats */}
        {/* GAP-019: Removed star rating - health service advertising risk */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {[
            { value: "85+", label: "Biomarkers available" },
            { value: "100%", label: "AHPRA-registered" },
            { value: "100%", label: "Australian doctors" },
            { value: "24hrs", label: "Typical doctor response" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl lg:text-4xl font-serif text-[#34412f]">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-[#5c7a52]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

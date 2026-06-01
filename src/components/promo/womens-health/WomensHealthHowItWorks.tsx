import { ClipboardCheck, Video, FileText, Heart } from "lucide-react";

export function WomensHealthHowItWorks() {
  const steps = [
    {
      number: "01",
      icon: ClipboardCheck,
      title: "Complete your assessment",
      description: "Answer a few questions about your symptoms, health history, and goals. It only takes 5 minutes and helps our doctors prepare for your consultation.",
      color: "from-[#f8e1e1] to-[#fce4d8]"
    },
    {
      number: "02",
      icon: Video,
      title: "Book your 30-min consultation",
      description: "Schedule a telehealth appointment with one of our experienced female health doctors at a time that suits you. No waiting rooms, no rush.",
      color: "from-[#e8d5e8] to-[#f0e4f0]"
    },
    {
      number: "03",
      icon: FileText,
      title: "Receive your treatment plan",
      description: "Your doctor will create a personalised treatment plan. Any prescriptions are sent directly to your preferred pharmacy or delivered to your door.",
      color: "from-[#d8e8e8] to-[#e4f0f0]"
    },
    {
      number: "04",
      icon: Heart,
      title: "Ongoing care & support",
      description: "Regular follow-ups to monitor your progress and adjust treatment as needed. Our care team is always available to answer your questions.",
      color: "from-[#fce4d8] to-[#fef4f0]"
    },
  ];

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#fdf8f6] to-[#fdfbf7]" />

      {/* Decorative elements */}
      <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-[#f8e1e1]/30 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-[250px] h-[250px] bg-[#e8d5e8]/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight">
            How <span className="text-[#c17a58] italic">sanative</span> works
          </h2>
          <p className="mt-4 text-lg text-[#5c7a52] max-w-2xl mx-auto">
            Getting the care you deserve is simple. From your first consultation to ongoing support, we're with you every step of the way.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector Line (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px">
                  <div className="w-full h-full bg-gradient-to-r from-[#e8b4b4]/50 to-[#c9b3c9]/50" />
                </div>
              )}

              <div className={`
                relative bg-gradient-to-br ${step.color}
                rounded-3xl p-6 lg:p-8
                border border-white/50 shadow-sm
                hover:shadow-lg transition-shadow
              `}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm">
                    <step.icon className="w-6 h-6 text-[#c17a58]" />
                  </div>
                  <span className="text-3xl font-serif text-[#c17a58]/30">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-serif text-[#2c3628] mb-3">
                  {step.title}
                </h3>
                <p className="text-[#5c7a52] text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        {/* GAP-019: Removed star rating - health service advertising risk */}
        <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {[
            { value: "30,000+", label: "Women helped" },
            { value: "100%", label: "AHPRA-registered" },
            { value: "100%", label: "Female specialists" },
            { value: "24-48hrs", label: "Response time" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-6 bg-white/60 rounded-2xl border border-[#f8e1e1]">
              <p className="text-3xl lg:text-4xl font-serif text-[#c17a58]">
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

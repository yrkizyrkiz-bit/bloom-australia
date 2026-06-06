import { ClipboardCheck, Video, Package, Heart } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: ClipboardCheck,
      title: "Complete your health assessment",
      description: "Answer questions about your health history and goals. It only takes 5 minutes.",
    },
    {
      number: "02",
      icon: Video,
      title: "Consult with an Australian doctor",
      description: "Our AHPRA-registered doctors review your profile and discuss your treatment options.",
    },
    {
      number: "03",
      icon: Package,
      title: "Receive your treatment",
      description: "Your prescription is filled by an Australian pharmacy and delivered discreetly to your door.",
    },
    {
      number: "04",
      icon: Heart,
      title: "Ongoing care & support",
      description: "Regular check-ins with your care team. Adjust your treatment as needed.",
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gradient-to-r from-[#cdd8c6] to-[#a8bb9e]" />
              )}

              <div className="relative bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-[#e6ebe3] hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#cdd8c6] to-[#a8bb9e] flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-[#34412f]" />
                  </div>
                  <span className="text-3xl font-serif text-[#a8bb9e]">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-serif text-[#2c3628] mb-2">
                  {step.title}
                </h3>
                <p className="text-[#5c7a52] text-sm leading-relaxed">
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
            { value: "50,000+", label: "Australians helped" },
            { value: "100%", label: "AHPRA-registered" },
            { value: "100%", label: "Australian doctors" },
            { value: "2-3 days", label: "Average delivery" },
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

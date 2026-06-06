import Link from "next/link";
import { Pill, Heart, FlaskConical } from "lucide-react";

// GAP-022: No public medication names (GLP-1, Ozempic, Semaglutide, Tirzepatide)
// Treatment options are discussed privately with your Sanative doctor

export function TreatmentsSection() {
  const treatments = [
    {
      name: "Core Program",
      type: "Doctor-led weight management",
      price: "From $249/mo",
      badge: "Most Popular",
      description: "Comprehensive weight management with doctor consultations and care partner support",
      icon: Pill,
      href: "/weight-management",
    },
    {
      name: "Precision Program",
      type: "Enhanced clinical support",
      price: "From $399/mo",
      badge: "Premium",
      description: "Advanced program with additional biomarker monitoring and dietitian support",
      icon: Heart,
      href: "/weight-management",
    },
    {
      name: "Custom Program",
      type: "Tailored to your needs",
      price: "From consultation",
      badge: "Personalised",
      description: "Bespoke treatment plan designed by your doctor based on your health profile",
      icon: FlaskConical,
      href: "/weight-management",
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-[#3d4f38] to-[#34412f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white">
            Access personalised
            <br />
            <span className="text-[#cdd8c6]">Doctor-led programs</span>
          </h2>
          <p className="mt-4 text-[#a8bb9e] text-lg max-w-2xl mx-auto">
            Treatment options are discussed privately with your Sanative doctor and supplied only where clinically appropriate
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {treatments.map((treatment) => (
            <Link
              key={treatment.name}
              href={treatment.href}
              className="group relative bg-[#f4f7f2] rounded-3xl p-6 lg:p-8 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
            >
              {treatment.badge && (
                <span className="absolute top-4 right-4 px-3 py-1 text-xs font-medium bg-[#c17a58] text-white rounded-full">
                  {treatment.badge}
                </span>
              )}

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#cdd8c6] to-[#a8bb9e] flex items-center justify-center mb-6">
                <treatment.icon className="w-8 h-8 text-[#34412f]" />
              </div>

              <h3 className="text-xl lg:text-2xl font-serif text-[#2c3628] mb-2">
                {treatment.name}
              </h3>
              <p className="text-[#7e9a72] text-sm font-medium mb-3">
                {treatment.type}
              </p>
              <p className="text-[#5c7a52] text-sm mb-6">
                {treatment.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[#e6ebe3]">
                <span className="text-[#34412f] font-medium">
                  {treatment.price}
                </span>
                <span className="text-[#5c7a52] text-sm group-hover:text-[#34412f] transition-colors">
                  Learn more →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-[#7e9a72]">
          Doctor consultation required. Treatment is only prescribed where clinically appropriate.
          <br />
          All prescriptions are dispensed by Australian-registered pharmacies.
        </p>
      </div>
    </section>
  );
}

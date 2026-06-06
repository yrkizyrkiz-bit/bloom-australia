import Link from "next/link";

export function DoctorsSection() {
  const doctors = [
    {
      name: "Dr. Sarah Chen",
      title: "Chief Medical Officer",
      initials: "SC",
      specialties: ["Women's Health", "Hormone Health"],
      description: "A board-certified GP with 15+ years experience in women's health. Dr. Chen leads our medical team with a focus on personalised, evidence-based care.",
      color: "from-[#c17a58] to-[#a9634a]",
    },
    {
      name: "Dr. Emma Thompson",
      title: "Head of Weight Management",
      initials: "ET",
      specialties: ["Metabolic Health", "Obesity Medicine"],
      description: "Specialist in metabolic medicine and obesity treatment. Dr. Thompson ensures our weight management protocols meet the highest clinical standards.",
      color: "from-[#5c7a52] to-[#4a6243]",
    },
    {
      name: "Dr. Priya Sharma",
      title: "Dermatology Lead",
      initials: "PS",
      specialties: ["Skin Health", "Anti-Ageing"],
      description: "Fellow of the Australasian College of Dermatologists with expertise in medical dermatology and cosmetic treatments.",
      color: "from-[#7e9a72] to-[#5c7a52]",
    },
    {
      name: "Dr. Rachel Williams",
      title: "Mental Health Lead",
      initials: "RW",
      specialties: ["Psychiatry", "Women's Mental Health"],
      description: "Psychiatrist specialising in women's mental health, anxiety, and mood disorders. Dr. Williams brings compassionate care to our mental wellness programs.",
      color: "from-[#a8bb9e] to-[#7e9a72]",
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#c17a58] font-serif text-lg italic">The best care</span>
          <h2 className="text-4xl sm:text-5xl font-serif text-[#2c3628] mt-2">
            by the best in medicine
          </h2>
          <p className="mt-4 text-lg text-[#5c7a52] max-w-2xl mx-auto">
            Meet our team of AHPRA-registered doctors with decades of combined experience across key specialties.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {doctors.map((doctor) => (
            <div
              key={doctor.name}
              className="group bg-[#f4f7f2] rounded-3xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Avatar Header */}
              <div className={`bg-gradient-to-br ${doctor.color} p-6 pb-12`}>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-medium">
                    {doctor.initials}
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">{doctor.title}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doctor.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 -mt-6">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="text-lg font-serif text-[#2c3628] mb-2">
                    {doctor.name}
                  </h3>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">
                    {doctor.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/doctors"
            className="btn-secondary"
          >
            Meet the full team
          </Link>
        </div>
      </div>
    </section>
  );
}

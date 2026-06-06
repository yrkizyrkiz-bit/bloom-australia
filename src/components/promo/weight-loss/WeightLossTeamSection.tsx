"use client";

interface TeamMember {
  name: string;
  title: string;
  specialties: string[];
  description: string;
  image?: string;
  initials: string;
  color: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Dr Phillip Seeley",
    title: "General Practitioner",
    specialties: ["MBBS (USyd)", "20+ Years"],
    description:
      "Experienced GP with expertise in Preventative Medicine and Weight Management. Dr Seeley has worked across Neonatal, Geriatric, and Emergency care settings.",
    initials: "PS",
    color: "from-[#5c7a52] to-[#4a6243]",
  },
  {
    name: "Dr George Wassif",
    title: "General Practitioner",
    specialties: ["MBBS", "Men's Health"],
    description:
      "Dedicated practitioner specialising in men's health and metabolic care. Dr Wassif takes a patient-centred approach to weight management treatment.",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face",
    initials: "GW",
    color: "from-[#7e9a72] to-[#5c7a52]",
  },
  {
    name: "Mia",
    title: "Care Partner",
    specialties: ["Patient Care Journey"],
    description:
      "With years of experience in health and wellbeing support, Mia ensures you feel cared for at every step of your weight management journey.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
    initials: "M",
    color: "from-[#c17a58] to-[#a9634a]",
  },
  {
    name: "Olfat Zekry",
    title: "Clinical Pharmacist",
    specialties: ["BPharm", "Medication Safety"],
    description:
      "Olly brings clinical pharmacy expertise to ensure your treatment is safe and effective. She reviews prescriptions and answers all your medication questions.",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=face",
    initials: "OZ",
    color: "from-[#a8bb9e] to-[#7e9a72]",
  },
];

export function WeightLossTeamSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[#c17a58] font-serif text-lg italic">
            The best care
          </span>
          <h2 className="text-4xl sm:text-5xl font-serif text-[#2c3628] mt-2">
            by the best in medicine
          </h2>
          <p className="mt-4 text-lg text-[#5c7a52] max-w-2xl mx-auto">
            Meet our team of AHPRA-registered doctors with decades of combined
            experience across key specialties.
          </p>
        </div>

        {/* Team Grid - Same as homepage */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="group bg-[#f4f7f2] rounded-3xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Avatar Header */}
              <div className={`bg-gradient-to-br ${member.color} p-6 pb-12`}>
                <div className="flex items-center gap-3">
                  {member.image ? (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-sm">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials on error
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white text-xl font-medium">${member.initials}</div>`;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-medium">
                      {member.initials}
                    </div>
                  )}
                  <div>
                    <p className="text-white/80 text-sm">{member.title}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {member.specialties.map((specialty) => (
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
                    {member.name}
                  </h3>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">
                    {member.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

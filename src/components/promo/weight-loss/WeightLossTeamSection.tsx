"use client";

interface TeamMember {
  name: string;
  title: string;
  subtitle?: string;
  specialties: string[];
  description: string;
  image?: string;
  initials: string;
  color: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Dr Phillip Seeley",
    title: "Chief Medical Officer",
    subtitle: "Preventative Medicine | Weight Management",
    specialties: [],
    description:
      "Specialist in preventative medicine, metabolic medicine and obesity treatment. Dr. Seeley ensures our weight management protocols meet the highest clinical standards.",
    initials: "PS",
    color: "from-[#7b8967] to-[#5d6a4d]",
  },
  {
    name: "Dr George Wassif",
    title: "General Practitioner",
    specialties: ["MBBS", "Men's Health"],
    description:
      "Dedicated practitioner specialising in men's health and metabolic care. Dr Wassif takes a patient-centred approach to metabolic weight management.",
    image: "/images/remote/unsplash/photo-1612349317150-e413f6a5b16d.webp",
    initials: "GW",
    color: "from-[#9abdb1] to-[#7b8967]",
  },
  {
    name: "Mia Davies",
    title: "Head of Metabolic Health | Care Partner",
    specialties: ["Patient Care Journey"],
    description:
      "With years of experience in health and wellbeing support, Mia ensures you feel cared for at every step of your weight management journey. She focuses on metabolic health, helping you understand your markers and stay on track.",
    image: "/images/team/mia.webp",
    initials: "MD",
    color: "from-[#5d6a4d] to-[#313630]",
  },
  {
    name: "Olfat Zekry",
    title: "Clinical Pharmacist",
    specialties: ["BPharm", "Clinical Safety"],
    description:
      "Olly brings clinical pharmacy expertise to support safe, effective care. She helps ensure your care plan is clinically sound and answers questions about your program.",
    image: "/images/team/olfat-zekry.webp",
    initials: "OZ",
    color: "from-[#b4cdc4] to-[#7b8967]",
  },
];

export function WeightLossTeamSection() {
  return (
    <section className="pt-4 pb-20 lg:pt-6 lg:pb-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[#7b8967] font-serif text-3xl sm:text-4xl italic">
            Earlier insight.
          </span>
          <h2 className="text-4xl sm:text-5xl font-serif text-[#313630] mt-2">
            Precise care. Trusted Australian doctors
          </h2>
          <p className="mt-4 text-lg text-[rgba(0,0,0,0.5)] max-w-2xl mx-auto">
            Meet our team of AHPRA-registered doctors with decades of combined
            experience across key specialties.
          </p>
        </div>

        {/* Team Grid - Same as homepage */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="group bg-[#f5faf6] rounded-3xl overflow-hidden border border-[#d3e0db] hover:shadow-lg transition-shadow"
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
                    {member.subtitle ? (
                      <p className="mt-1 text-xs leading-snug text-white/75">
                        {member.subtitle}
                      </p>
                    ) : null}
                    {member.specialties.length > 0 ? (
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
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 -mt-6">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#d3e0db]">
                  <h3 className="text-lg font-serif text-[#313630] mb-2">
                    {member.name}
                  </h3>
                  <p className="text-sm text-[rgba(0,0,0,0.55)] leading-relaxed">
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

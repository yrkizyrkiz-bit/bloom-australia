"use client";

type TeamMember = {
  name: string;
  title: string;
  subtitle?: string;
  specialties: string[];
  description: string;
  image?: string;
  initials: string;
  color: string;
};

/** Same clinical team as weight-management “Precise care. Trusted Australian doctors”. */
const doctors: TeamMember[] = [
  {
    name: "Dr Phillip Seeley",
    title: "Chief Medical Officer",
    subtitle: "Preventative Medicine | Weight Management",
    specialties: [],
    description:
      "Experienced in preventative medicine, metabolic health and obesity care. Dr. Seeley ensures our weight management protocols meet the highest clinical standards.",
    image: "/images/team/phillip-seeley.webp",
    initials: "PS",
    color: "from-[#7b8967] to-[#5d6a4d]",
  },
  {
    name: "Kath Edwards",
    title: "Health Coach",
    specialties: ["Health Coach", "Nutrition"],
    description:
      "Kath is our Health Coach. She works with Sanative members on personalised nutrition plans, healthy weight management, and lasting lifestyle change.",
    image: "/images/team/kath-edwards.webp",
    initials: "KE",
    color: "from-[#9abdb1] to-[#7b8967]",
  },
  {
    name: "Mia Davies",
    title: "Head of Metabolic Health | Care Partner",
    specialties: ["Patient Care Journey"],
    description:
      "With years of experience in health and wellbeing support, Mia ensures you feel cared for at every step of your Sanative journey, so you understand your metabolic health and stay on track.",
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

export function DoctorsSection() {
  return (
    <section
      className="relative z-[2] py-20 lg:py-28 bg-white"
      style={{
        marginTop: "clamp(-36px, -5vw, -56px)",
        borderTopLeftRadius: "clamp(1.5rem, 2.5vw, 2rem)",
        borderTopRightRadius: "clamp(1.5rem, 2.5vw, 2rem)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#c17a58] font-serif text-3xl sm:text-4xl italic">
            Earlier insight.
          </span>
          <h2 className="text-4xl sm:text-5xl font-serif text-[#2c3628] mt-2">
            Precise care. Trusted Australian doctors
          </h2>
          <p className="mt-4 text-lg text-[#5c7a52] max-w-2xl mx-auto">
            Meet our team of AHPRA-registered doctors with decades of combined
            experience across key specialties.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {doctors.map((doctor) => (
            <div
              key={doctor.name}
              className="group bg-[#f4f7f2] rounded-3xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className={`bg-gradient-to-br ${doctor.color} p-6 pb-12`}>
                <div className="flex items-center gap-3">
                  {doctor.image ? (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={doctor.image}
                        alt={doctor.name}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white text-xl font-medium">${doctor.initials}</div>`;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-medium">
                      {doctor.initials}
                    </div>
                  )}
                  <div>
                    <p className="text-white/80 text-sm">{doctor.title}</p>
                    {doctor.subtitle ? (
                      <p className="mt-1 text-xs leading-snug text-white/75">
                        {doctor.subtitle}
                      </p>
                    ) : null}
                    {doctor.specialties.length > 0 ? (
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
                    ) : null}
                  </div>
                </div>
              </div>

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
      </div>
    </section>
  );
}

import { ShieldCheck } from "lucide-react";
import Image from "next/image";

const team = [
  {
    name: "Dr Phillip Seeley",
    title: "Chief Medical Officer",
    subtitle: "Preventative Medicine | Weight Management",
    specialties: [] as string[],
    img: "/images/team/phillip-seeley.webp",
    bio: "Experienced in preventative medicine, metabolic health and obesity care. Ensures our weight management protocols meet the highest clinical standards.",
    color: "from-[#7b8967] to-[#5d6a4d]",
  },
  {
    name: "Kath Edwards",
    title: "Health Coach",
    subtitle: undefined,
    specialties: ["Health Coach", "Nutrition"],
    img: "/images/team/kath-edwards.webp",
    bio: "Works with members on personalised nutrition plans, healthy weight management and lasting lifestyle change.",
    color: "from-[#9abdb1] to-[#7b8967]",
  },
  {
    name: "Mia Davies",
    title: "Head of Metabolic Health | Care Partner",
    subtitle: undefined,
    specialties: ["Patient Care Journey"],
    img: "/images/team/mia.webp",
    bio: "Makes sure you feel cared for at every step, understand your metabolic health and stay on track.",
    color: "from-[#5d6a4d] to-[#313630]",
  },
  {
    name: "Olfat Zekry",
    title: "Clinical Pharmacist",
    subtitle: undefined,
    specialties: ["BPharm", "Clinical Safety"],
    img: "/images/team/olfat-zekry.webp",
    bio: "Brings clinical pharmacy expertise to keep your care plan safe and clinically sound.",
    color: "from-[#b4cdc4] to-[#7b8967]",
  },
];

export function TeamSection() {
  return (
    <section className="bg-secondary">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-sage-deep">
              Your care team
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
              Real Australian doctors,{" "}
              <em className="font-serif font-medium italic text-sage-deep">not just an app.</em>
            </h2>
          </div>
          <div className="flex max-w-md items-start gap-1.5 rounded-2xl border border-border bg-card p-4 text-sm leading-snug text-muted-foreground shadow-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage-deep" />
            <p>
              Led by experienced doctors who have supported thousands of Australians with weight
              management.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {team.map((p) => (
            <article
              key={p.name}
              className="group overflow-hidden rounded-3xl bg-[#f4f7f2] transition-shadow hover:shadow-lg"
            >
              <div className={`bg-gradient-to-br ${p.color} p-6 pb-12`}>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/20">
                    <Image
                      src={p.img}
                      alt={`${p.name}, ${p.title}`}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">{p.title}</p>
                    {p.subtitle ? (
                      <p className="mt-1 text-xs leading-snug text-white/75">{p.subtitle}</p>
                    ) : null}
                    {p.specialties.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.specialties.map((specialty) => (
                          <span
                            key={specialty}
                            className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="-mt-6 p-6">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <h3 className="mb-2 font-serif text-lg text-[#2c3628]">{p.name}</h3>
                  <p className="text-sm leading-relaxed text-[#5c7a52]">{p.bio}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

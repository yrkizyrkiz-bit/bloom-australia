import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.about;

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="relative overflow-hidden bg-[#f4f7f2]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#e6ebe3_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_#cdd8c6_0%,_transparent_50%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[12%] h-[28rem] w-[28rem] rounded-full bg-[#eef3eb] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-[8%] h-[22rem] w-[22rem] rounded-full bg-[#cdd8c6]/40 blur-3xl"
        />
        <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-20 lg:items-start">
            <h1 className="lg:sticky lg:top-32 font-serif text-[2.5rem] sm:text-5xl lg:text-[3.65rem] leading-[1.12] tracking-tight text-[#2c3628]">
              Sanative was founded to help Australians add more healthy years
              to their life,{" "}
              <span className="italic text-[#c17a58]">
                and more life to their years.
              </span>
            </h1>

            <div className="max-w-xl text-[15px] sm:text-base leading-[1.7] text-[#2c3628]">
              <h2 className="font-serif text-2xl sm:text-[1.75rem] tracking-tight text-[#2c3628]">
                About Sanative
              </h2>
              <p className="mt-5 italic text-[#4a6243]">
                Sanative (adj.), from the Latin <em>sanare</em>, &ldquo;to
                heal&rdquo;: that which restores and preserves health.
              </p>
              <p className="mt-6">
                The Romans had a phrase for the life worth living:{" "}
                <em>mens sana in corpore sano</em>, a sound mind in a sound
                body. Over the door of the temple at Delphi, the Greeks carved
                two words: know thyself. Two thousand years later, both still
                hold. A fulfilling life rests on health, and health rests on
                understanding.
              </p>
              <p className="mt-6">
                Your body keeps a quiet record of how you live: how you sleep,
                eat, move and cope. Most of that story goes unread until
                something goes wrong. We believe you deserve to read it sooner.
              </p>
              <p className="mt-6">
                That&apos;s where Sanative begins. Your membership starts with
                a doctor-led health check: a blood test at a pathology
                collection centre near you, with your results reviewed by an
                AHPRA-registered Australian doctor. It isn&apos;t a verdict.
                It&apos;s a starting point: a clearer picture of what&apos;s
                happening inside you, so you can make choices with your eyes
                open.
              </p>

              <h2 className="mt-12 font-serif text-2xl sm:text-[1.75rem] tracking-tight text-[#2c3628]">
                Why we built Sanative
              </h2>
              <p className="mt-5">
                Across our team, we&apos;ve seen medicine at its most
                brilliant, and we&apos;ve seen how often care arrives too late.
                It happens in rushed appointments, in results scattered across
                clinics, and in a system built to respond to illness rather
                than protect health.
              </p>
              <p className="mt-6">
                We think care should work the other way around:
              </p>
              <ul className="mt-5 space-y-4">
                <li>
                  <span className="font-medium text-[#2c3628]">
                    No waiting rooms.
                  </span>{" "}
                  Book online and get tested close to home.
                </li>
                <li>
                  <span className="font-medium text-[#2c3628]">
                    One continuous story.
                  </span>{" "}
                  Your results and history sit together in the Sanative app, so
                  you can see how your health changes over time.
                </li>
                <li>
                  <span className="font-medium text-[#2c3628]">
                    Privacy first.
                  </span>{" "}
                  Your health information is protected and stays yours.
                </li>
                <li>
                  <span className="font-medium text-[#2c3628]">
                    Real doctors.
                  </span>{" "}
                  AHPRA-registered Australian doctors review your results and
                  recommend only what&apos;s clinically appropriate for you.
                </li>
              </ul>
              <p className="mt-6">
                Health isn&apos;t a fixed state. It changes with you, year by
                year and decade by decade. Sanative is here for the long view:
                to help you understand your health, own it and look after it
                for the life you want to live.
              </p>
              <Link
                href="/biomarker-intake"
                className="mt-8 inline-flex min-h-[48px] max-w-full items-center justify-center rounded-full bg-[#c17a58] px-6 py-3 text-center text-[15px] font-medium text-white transition-colors hover:bg-[#a96848] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c17a58] focus-visible:ring-offset-2 sm:px-8"
              >
                Welcome to Sanative - Check your health and stay ahead
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import Link from "next/link";
import { Instagram, Facebook, Linkedin, Mail } from "lucide-react";
import { GetTheAppCard } from "@/components/promo/GetTheAppCard";

export function Footer() {
  const footerLinks = {
    popular: [
      { label: "Biomarker Labs", href: "/labs" },
      { label: "Weight Loss", href: "/weight-management" },
      { label: "Hair Health", href: "/hair-health" },
      { label: "Menopause", href: "/womens-health/menopause" },
      { label: "Erectile Dysfunction", href: "/mens-health/erectile-dysfunction" },
      { label: "Fatty Liver", href: "/metabolic-care/fatty-liver#fatty-liver" },
      { label: "Organ Care", href: "/organ-care" },
    ],
    resources: [
      { label: "Health Guides", href: "/guides" },
      { label: "Biomarkers A–Z", href: "/biomarkers" },
      { label: "Health Check Guide", href: "/guides/health-check-australia" },
      { label: "Heart & Cardiovascular Risk", href: "/guides/heart-health-cardiovascular-disease-risk" },
      { label: "BMI Calculator", href: "/weight-management#bmi" },
      { label: "Heart Risk Assessment", href: "/metabolic-care/heart-health#heart-assessment" },
      { label: "Kidney Risk Assessment", href: "/metabolic-care/kidney-health#kidney-assessment" },
      { label: "Liver Risk Assessment", href: "/metabolic-care/fatty-liver#liver-assessment" },
      { label: "Member Login", href: "/login" },
      { label: "Contact", href: "/contact" },
    ],
    company: [
      { label: "About Us", href: "/about" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  };

  return (
    <footer className="bg-[#34412f] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(240px,320px)_1fr] lg:items-start lg:gap-14 xl:gap-16">
          <GetTheAppCard />

          <div className="flex flex-col">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <h4 className="mb-4 text-sm font-medium uppercase tracking-wider text-[#cdd8c6]">
                  Popular
                </h4>
                <ul className="space-y-3">
                  {footerLinks.popular.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#a8bb9e] transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-medium uppercase tracking-wider text-[#cdd8c6]">
                  Resources
                </h4>
                <ul className="space-y-3">
                  {footerLinks.resources.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#a8bb9e] transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-medium uppercase tracking-wider text-[#cdd8c6]">
                  Company
                </h4>
                <ul className="space-y-3">
                  {footerLinks.company.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#a8bb9e] transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4a6243] transition-colors hover:bg-[#5c7a52]"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4a6243] transition-colors hover:bg-[#5c7a52]"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4a6243] transition-colors hover:bg-[#5c7a52]"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="mailto:info@sanative.com.au"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4a6243] transition-colors hover:bg-[#5c7a52]"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>

            <div className="mt-12 border-t border-[#4a6243] pt-8">
              <p className="text-sm text-[#a8bb9e]">
                2026 Sanative. All rights reserved.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#a8bb9e]">
                <span>AHPRA Registered Doctors</span>
                <span className="h-1 w-1 rounded-full bg-[#5c7a52]" />
                <span>Australian Owned</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { Instagram, Facebook, Linkedin, Mail } from "lucide-react";
import { GetTheAppCard } from "@/components/promo/GetTheAppCard";

export function Footer() {
  const footerLinks = {
    treatments: [
      { label: "Weight Management", href: "/weight-management" },
      { label: "Women's Health", href: "/womens-health" },
      { label: "Hair Health", href: "/hair-health" },
      { label: "Organ Care", href: "/organ-care" },
      { label: "Lab Testing", href: "/labs" },
    ],
    resources: [
      { label: "FAQs", href: "/faqs" },
      { label: "Member Login", href: "/login" },
      { label: "Contact", href: "/contact" },
    ],
    company: [
      { label: "About Us", href: "#" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Medical Disclaimer", href: "/medical-disclaimer" },
      { label: "Telehealth Consent", href: "/telehealth-consent" },
      { label: "Subscription Terms", href: "/subscription-terms" },
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
                  Treatments
                </h4>
                <ul className="space-y-3">
                  {footerLinks.treatments.map((link) => (
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
                href="mailto:hello@sanative.com.au"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4a6243] transition-colors hover:bg-[#5c7a52]"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>

            <div className="mt-12 border-t border-[#4a6243] pt-8">
              <p className="text-sm text-[#a8bb9e]">
                2026 Sanative Health Pty Ltd. All rights reserved. ABN 12 345 678 901
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#a8bb9e]">
                <span>AHPRA Registered</span>
                <span className="h-1 w-1 rounded-full bg-[#5c7a52]" />
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

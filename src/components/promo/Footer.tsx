import Link from "next/link";
import { Instagram, Facebook, Linkedin, Mail } from "lucide-react";

export function Footer() {
  const footerLinks = {
    treatments: [
      { label: "Weight Management", href: "/weight-management" },
      { label: "Women's Health", href: "/womens-health" },
      { label: "Hair Health", href: "/hair-health" },
      { label: "Metabolic Care", href: "/metabolic-care" },
      { label: "Lab Testing", href: "/labs" },
    ],
    resources: [
      { label: "FAQs", href: "/faqs" },
      { label: "Pricing", href: "/pricing" },
      { label: "Member Login", href: "/login" },
    ],
    company: [
      { label: "About Us", href: "#" },
      { label: "Contact", href: "#" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  };

  return (
    <footer className="bg-[#34412f] text-white">
      {/* Newsletter Section */}
      <div className="border-b border-[#4a6243]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl lg:text-4xl font-serif mb-3">
                Your wellness journey starts here
              </h3>
              <p className="text-[#a8bb9e] text-lg">
                Get expert health tips and exclusive offers delivered to your inbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-3.5 rounded-full bg-[#4a6243] border border-[#5c7a52] text-white placeholder:text-[#a8bb9e] focus:outline-none focus:border-[#a8bb9e] transition-colors"
              />
              <button
                type="button"
                className="px-8 py-3.5 bg-white text-[#34412f] rounded-full font-medium hover:bg-[#e6ebe3] transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-4xl font-serif tracking-tight">sanative</span>
            </Link>
            <p className="mt-4 text-[#a8bb9e] text-sm leading-relaxed">
              Personalised healthcare for every Australian. Doctor-prescribed treatments, delivered to your door.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#4a6243] flex items-center justify-center hover:bg-[#5c7a52] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#4a6243] flex items-center justify-center hover:bg-[#5c7a52] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#4a6243] flex items-center justify-center hover:bg-[#5c7a52] transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:hello@sanative.com.au"
                className="w-10 h-10 rounded-full bg-[#4a6243] flex items-center justify-center hover:bg-[#5c7a52] transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-4 text-[#cdd8c6]">
              Treatments
            </h4>
            <ul className="space-y-3">
              {footerLinks.treatments.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#a8bb9e] hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-4 text-[#cdd8c6]">
              Resources
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#a8bb9e] hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-4 text-[#cdd8c6]">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#a8bb9e] hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-4 text-[#cdd8c6]">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#a8bb9e] hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#4a6243]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#a8bb9e] text-sm text-center md:text-left">
              2026 Sanative Health Pty Ltd. All rights reserved. ABN 12 345 678 901
            </p>
            <div className="flex items-center gap-4 text-sm text-[#a8bb9e]">
              <span>AHPRA Registered</span>
              <span className="w-1 h-1 rounded-full bg-[#5c7a52]" />
              <span>AHPRA Registered Doctors</span>
              <span className="w-1 h-1 rounded-full bg-[#5c7a52]" />
              <span>Australian Owned</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

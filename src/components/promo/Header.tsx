"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navItems = [
    {
      label: "Biomarker Labs",
      href: "/labs",
      dropdown: [
        { label: "Full Biomarker Panel", href: "/labs/biomarkers" },
        { label: "Book a Test", href: "/biomarker-intake" },
      ],
    },
    {
      label: "Weight Management",
      href: "/weight-management",
      dropdown: [
        { label: "Start Assessment", href: "/weight-management/assessment" },
        { label: "Dietitian Support", href: "/weight-management/dietitian-support" },
      ],
    },
    {
      label: "Women's Health",
      href: "/womens-health",
      dropdown: [
        { label: "Menopause Care", href: "/womens-health/assessment?category=menopause" },
        { label: "HRT", href: "/womens-health/assessment?category=hrt" },
        { label: "Contraception", href: "/womens-health/assessment?category=contraception" },
        { label: "Fertility Support", href: "/womens-health/assessment?category=fertility" },
      ],
    },
    {
      label: "Metabolic Care",
      href: "/metabolic-care",
      dropdown: [
        { label: "Fatty Liver Program", href: "/metabolic-care/fatty-liver" },
        { label: "Heart Health Program", href: "/metabolic-care/heart-health" },
        { label: "Kidney Health Program", href: "/metabolic-care/kidney-health" },
      ],
    },
    {
      label: "For Doctors",
      href: "/for-doctors",
    },
  ];

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-[#2c3628] via-[#3d4f38] to-[#2c3628] text-white text-center py-3 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative flex items-center justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-2">
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#a8bb9e] animate-pulse" />
            <span className="font-serif text-[15px] sm:text-base tracking-wide italic">
              Australia&apos;s only biomarker-first telehealth clinic
            </span>
            <span className="hidden sm:inline text-[#a8bb9e] mx-1">—</span>
            <span className="text-[13px] sm:text-sm font-light text-[#cdd8c6]">
              AHPRA doctors + NATA-accredited labs
            </span>
          </span>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-1 text-[13px] sm:text-sm font-medium text-[#a8bb9e] hover:text-white transition-colors group"
          >
            See how it works
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-[#fdfbf7]/95 backdrop-blur-md border-b border-[#e6ebe3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1">
              <span className="text-3xl lg:text-4xl font-serif tracking-tight text-[#34412f]">
                sanative
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 px-4 py-2 text-[15px] text-[#34412f] hover:text-[#5c7a52] transition-colors rounded-full hover:bg-[#e6ebe3]/50"
                  >
                    {item.label}
                    {item.dropdown && (
                      <ChevronDown className="w-4 h-4 opacity-60" />
                    )}
                  </Link>

                  {item.dropdown && activeDropdown === item.label && (
                    <div className="absolute top-full left-0 pt-2 w-56">
                      <div className="bg-white rounded-2xl shadow-xl border border-[#e6ebe3] p-2 animate-fade-in">
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            className="block px-4 py-2.5 text-sm text-[#34412f] hover:bg-[#e6ebe3] rounded-xl transition-colors"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="text-[13px] sm:text-[15px] text-[#34412f] hover:text-[#5c7a52] transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/weight-management/assessment"
                className="btn-primary text-xs sm:text-sm lg:text-[15px] px-3 sm:px-4"
              >
                Get Started
              </Link>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 text-[#34412f]"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-[#fdfbf7] border-b border-[#e6ebe3] animate-fade-in">
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    className="block text-lg text-[#34412f] font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.dropdown && (
                    <div className="pl-4 space-y-2 mt-2">
                      {item.dropdown.map((subItem) => (
                        <Link
                          key={subItem.label}
                          href={subItem.href}
                          className="block text-[#5c7a52] py-1"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-4 border-t border-[#e6ebe3]">
                <Link
                  href="/login"
                  className="block text-lg text-[#34412f] py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

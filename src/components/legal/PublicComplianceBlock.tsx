import { Stethoscope } from "lucide-react";
import {
  CLINICAL_INDIVIDUALITY_COPY,
  DOCTOR_LED_DISCLAIMER,
  NO_TESTIMONIALS_DISCLAIMER,
} from "@/lib/legal/marketing-compliance";

type PublicComplianceBlockProps = {
  dark?: boolean;
  title?: string;
  className?: string;
};

export function PublicComplianceBlock({
  dark = false,
  title = "Doctor-led care, built around you",
  className = "",
}: PublicComplianceBlockProps) {
  const shell = dark
    ? "bg-white/5 border-white/10 text-white"
    : "bg-white border-[#e6ebe3] text-[#2c3628]";
  const body = dark ? "text-[#a8bb9e]" : "text-[#5c7a52]";
  const fine = dark ? "text-[#7e9a72]" : "text-[#7e9a72]";

  return (
    <section className={`py-16 lg:py-20 ${className}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`rounded-3xl p-8 lg:p-12 border shadow-sm ${shell}`}>
          <div className="flex justify-center mb-6">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                dark ? "bg-white/10" : "bg-[#f4f7f2]"
              }`}
            >
              <Stethoscope className={`w-7 h-7 ${dark ? "text-[#a8bb9e]" : "text-[#5c7a52]"}`} />
            </div>
          </div>
          <h2 className={`text-2xl lg:text-3xl font-serif text-center mb-4 ${dark ? "text-white" : ""}`}>
            {title}
          </h2>
          <p className={`text-lg leading-relaxed text-center font-serif ${body}`}>
            {CLINICAL_INDIVIDUALITY_COPY}
          </p>
          <p className={`mt-6 text-sm text-center leading-relaxed ${fine}`}>
            {DOCTOR_LED_DISCLAIMER} {NO_TESTIMONIALS_DISCLAIMER}
          </p>
        </div>
      </div>
    </section>
  );
}

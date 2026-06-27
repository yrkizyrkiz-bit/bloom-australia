"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "How does the biomarker testing work?",
    answer: "Blood tests are requested only where clinically appropriate by an Australian doctor. Many standard pathology tests are Medicare-rebated or bulk-billed for eligible Medicare card holders, depending on the test, provider and billing arrangements. Some tests may attract an out-of-pocket cost. Your doctor uses these insights to personalise your care plan based on your individual health profile.",
  },
  {
    question: "What is a Care Partner and how do they help?",
    answer: "Your Care Partner is a real person (not a chatbot) who supports you throughout your journey. They check in weekly, answer questions between doctor consultations, help you stay accountable, and celebrate your progress. Think of them as your personal health ally who genuinely cares about your success.",
  },
  {
    question: "How much does the program cost?",
    answer: "We offer two plans: Sanative Core starts at $249 for your first month (then from $349/month ongoing), and Sanative Precision starts at $399 for your first month (then from $499/month ongoing). Both include doctor consultations, Care Partner support, portal access, and ongoing clinical monitoring. Precision includes more frequent doctor check-ins and enhanced biomarker monitoring. No hidden fees or lock-in contracts — cancel anytime.",
  },
  {
    question: "What does the monthly fee cover?",
    answer: "Your monthly fee covers doctor consultations, clinical monitoring, Care Partner support, and portal access. Some care options may involve additional costs, discussed before proceeding.",
  },
  {
    question: "Who is eligible for the program?",
    answer: "Generally, you need a BMI of 30+ or BMI 27+ with weight-related health conditions such as type 2 diabetes, high blood pressure, or PCOS. Women experiencing hormonal or metabolic weight gain may also be eligible. Our doctors assess your full health picture including biomarkers during consultation.",
  },
  {
    question: "What results can I expect?",
    answer: "Results vary significantly based on individual biology, adherence, and starting point. Your doctor will discuss realistic expectations during your consultation and use biomarker results to help personalise your plan.",
  },
  {
    question: "Are the doctors real Australian doctors?",
    answer: "Yes, absolutely. Every Sanative doctor is AHPRA-registered and practising in Australia. Your Sanative doctor consultation is completed by telehealth where clinically appropriate. Your doctor may recommend alternative care or in-person assessment if needed. They review your health profile, discuss your symptoms, and adjust your care plan accordingly.",
  },
  {
    question: "What about treatment options?",
    answer: "Treatment options are discussed privately with your doctor if clinically appropriate. Your monthly program fee covers clinical assessment, monitoring, and portal access — not medicine bundles.",
  },
  {
    question: "How long should I stay on the program?",
    answer: "Program duration varies based on your goals and response. Our doctors work with you to create a sustainable long-term plan, including guidance on maintaining results.",
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel anytime with no penalties or cancellation fees. Simply contact our support team or cancel through the app. Your subscription ends at the end of your current billing period. We believe in earning your trust every month.",
  },
  {
    question: "What is your refund policy?",
    answer: "If your Sanative doctor determines after assessment that the program is not clinically appropriate for you, your first-month payment will be refunded in accordance with our Refund Policy.",
  },
  {
    question: "Is my information kept private?",
    answer: "Completely. Your health data is encrypted, protected under Australian privacy law, and never shared without your explicit consent. Program coordination is handled discreetly.",
  },
  {
    question: "Can I claim through private health insurance?",
    answer: "Some patients may be able to claim part of eligible services depending on their cover. Please check directly with your insurer for details about telehealth consultation coverage and any applicable rebates.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative py-12 lg:py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#fdfbf7]" />

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#5c7a52]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#c17a58]/5 rounded-full blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight mb-4">
            Frequently asked{" "}
            <span className="text-[#5c7a52] italic">questions</span>
          </h2>
          <p className="text-lg text-[#5c7a52]">
            Everything you need to know about our weight management program
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq.question}
              className={`
                bg-white rounded-2xl border overflow-hidden transition-all duration-300
                ${openIndex === index ? "border-[#5c7a52] shadow-lg" : "border-[#e6ebe3] hover:border-[#cdd8c6]"}
              `}
            >
              <button
                type="button"
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className={`text-lg font-serif pr-4 ${openIndex === index ? "text-[#5c7a52]" : "text-[#2c3628]"}`}>
                  {faq.question}
                </span>
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    transition-all duration-300
                    ${openIndex === index ? "bg-[#5c7a52] rotate-180" : "bg-[#f4f7f2]"}
                  `}
                >
                  <ChevronDown className={`w-5 h-5 ${openIndex === index ? "text-white" : "text-[#5c7a52]"}`} />
                </div>
              </button>

              <div
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${openIndex === index ? "max-h-96" : "max-h-0"}
                `}
              >
                <div className="px-6 pb-6">
                  <div className="pt-4 border-t border-[#e6ebe3]">
                    <p className="text-[#5c7a52] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <p className="text-[#7e9a72]">
            Still have questions?{" "}
            <a href="mailto:support@sanative.com.au" className="text-[#5c7a52] underline underline-offset-2 hover:text-[#34412f] transition-colors">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

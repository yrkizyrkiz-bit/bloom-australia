"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "How do I know if I'm in perimenopause or menopause?",
    answer: "Perimenopause typically begins in your 40s and is marked by irregular periods, hot flushes, night sweats, mood changes, and sleep disturbances. Menopause is confirmed when you've gone 12 consecutive months without a period. Our doctors can assess your symptoms and, if needed, arrange hormone testing to help determine where you are in your journey."
  },
  {
    question: "Is hormone replacement therapy (HRT) safe?",
    answer: "Modern body-identical HRT has been shown to be safe and effective for most women when prescribed appropriately. Our doctors carefully assess your medical history, risk factors, and symptoms to determine if HRT is suitable for you. We use TGA-approved bioidentical hormones and monitor your treatment regularly. The benefits often outweigh the risks, especially when started within 10 years of menopause."
  },
  {
    question: "What can I expect during a 30-minute consultation?",
    answer: "During your consultation, our doctor will review your health assessment, discuss your symptoms and concerns in detail, explain your treatment options, and create a personalised care plan. You'll have time to ask questions and discuss any concerns. If treatment is prescribed, your doctor will explain how it works and what to expect."
  },
  {
    question: "How much does a consultation cost?",
    // GAP-024: Removed unsupported insurance claimability promise
    answer: "Initial consultations are $149 for a comprehensive 30-minute telehealth appointment with one of our women's health specialists. Follow-up consultations are $99. Some patients may be able to claim part of eligible services depending on their cover. Please check directly with your insurer."
  },
  {
    question: "Can you prescribe the contraceptive pill via telehealth?",
    answer: "Yes, our doctors can prescribe oral contraceptives, the mini-pill, and other hormonal contraceptives via telehealth. We'll discuss your health history, lifestyle, and preferences to find the best option for you. For methods requiring insertion (like IUDs or implants), we can provide referrals to local providers."
  },
  {
    question: "What is PCOS and how can you help?",
    answer: "Polycystic Ovary Syndrome (PCOS) is a hormonal condition affecting up to 1 in 10 women. Symptoms include irregular periods, excess hair growth, acne, and difficulty losing weight. Our doctors can help diagnose PCOS through symptom assessment and blood tests, then create a management plan that may include lifestyle modifications, medications to regulate cycles, or treatments for specific symptoms."
  },
  {
    question: "Do you offer fertility consultations?",
    answer: "Yes, we provide preconception health consultations and fertility hormone testing. Our doctors can assess your reproductive health, optimise your hormonal balance, and identify any issues that might affect fertility. For more complex fertility concerns, we work with specialist fertility clinics and can provide referrals."
  },
  {
    question: "How quickly can I get an appointment?",
    answer: "We typically have appointments available within 24-48 hours. After completing your health assessment, you can book a consultation time that suits your schedule. Evening and weekend appointments are often available for your convenience."
  },
];

export function WomensHealthFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#fdfbf7]" />

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#f8e1e1]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#e8d5e8]/15 rounded-full blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f8e1e1]/40 border border-[#e8b4b4]/20 mb-6">
            <HelpCircle className="w-4 h-4 text-[#c17a58]" />
            <span className="text-sm font-medium text-[#8b5a5a]">FAQs</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-tight">
            Common{" "}
            <span className="text-[#c17a58] italic">questions</span>
          </h2>
          <p className="mt-4 text-lg text-[#5c7a52]">
            Everything you need to know about our women's health services
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq.question}
              className={`
                bg-white rounded-2xl border overflow-hidden transition-all duration-300
                ${openIndex === index
                  ? "border-[#c17a58]/30 shadow-lg"
                  : "border-[#f8e1e1] hover:border-[#e8b4b4]/50"}
              `}
            >
              <button
                type="button"
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className={`text-lg font-serif pr-4 ${
                  openIndex === index ? "text-[#c17a58]" : "text-[#2c3628]"
                }`}>
                  {faq.question}
                </span>
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    transition-all duration-300
                    ${openIndex === index
                      ? "bg-[#c17a58] rotate-180"
                      : "bg-[#f8e1e1]"}
                  `}
                >
                  <ChevronDown className={`w-5 h-5 ${
                    openIndex === index ? "text-white" : "text-[#c17a58]"
                  }`} />
                </div>
              </button>

              <div
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${openIndex === index ? "max-h-[500px]" : "max-h-0"}
                `}
              >
                <div className="px-6 pb-6">
                  <div className="pt-4 border-t border-[#f8e1e1]">
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
            <a href="mailto:support@sanative.com.au" className="text-[#c17a58] underline underline-offset-2 hover:text-[#a86548] transition-colors">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

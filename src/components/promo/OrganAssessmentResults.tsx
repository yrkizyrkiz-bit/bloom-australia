"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { membershipCheckoutPath, trackMetaEvent } from "@/lib/analytics/meta-pixel";
import { GuestSupportChat } from "@/components/promo/contact/GuestSupportChat";
import { LEGAL_LINKS } from "@/lib/legal/constants";
import type { OrganAssessmentUiCopy, OrganDriver, OrganResultTier } from "@/lib/promo/organ-assessment-results";

export function OrganAssessmentResults({
  copy,
  tier,
  drivers,
}: {
  copy: OrganAssessmentUiCopy;
  tier: OrganResultTier;
  drivers: OrganDriver[];
}) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  async function handleEmailResults(event: FormEvent) {
    event.preventDefault();
    if (emailStatus === "sending" || emailStatus === "sent") return;
    if (!emailConsent) {
      setEmailError(`Tick the box to email your results and ${copy.consentOrgan} health tips.`);
      return;
    }
    setEmailStatus("sending");
    setEmailError(null);
    try {
      const response = await fetch(copy.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organ: copy.organ,
          firstName,
          email,
          consent: emailConsent,
          tier,
          drivers: drivers.map((driver) => driver.title),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Please try again.");
      }
      trackMetaEvent("Lead", { content_name: copy.leadContentName });
      setEmailStatus("sent");
    } catch (submitError) {
      setEmailStatus("error");
      setEmailError(submitError instanceof Error ? submitError.message : "Please try again.");
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#7e9a72]">
          {tier === "high" ? "High" : tier === "moderate" ? "Moderate" : "Low"}
        </p>
        <h3 className="font-serif text-2xl leading-snug text-[#2c3628]">
          {copy.headlines[tier]}
        </h3>

        {drivers.length > 0 ? (
          <div>
            <h4 className="mb-2 text-sm font-medium text-[#2c3628]">What&apos;s driving your result</h4>
            <ul className="space-y-2">
              {drivers.map((driver) => (
                <li key={driver.id} className="rounded-xl bg-[#f4f7f2] px-3 py-2.5">
                  <p className="text-sm font-medium text-[#34412f]">{driver.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#5c7a52]">{driver.body}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <h4 className="mb-2 text-sm font-medium text-[#2c3628]">What a blood test would show</h4>
          <div className="flex flex-wrap gap-1.5">
            {copy.markers.map((marker) => (
              <span
                key={marker}
                className="rounded-full border border-[#cdd8c6] bg-white px-2.5 py-1 text-xs text-[#34412f]"
              >
                {marker}
              </span>
            ))}
          </div>
        </div>

        <div>
          <Link
            href={membershipCheckoutPath(copy.checkoutSource, copy.checkoutButton)}
            className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm"
          >
            {copy.ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-[#5c7a52]">
            85+ biomarkers · results reviewed by top doctors · health plan · biological clock · results in your app
          </p>
        </div>

        <form onSubmit={handleEmailResults} className="rounded-2xl border border-[#e6ebe3] bg-[#fdfbf7] p-4 space-y-3">
          <h4 className="text-sm font-medium text-[#2c3628]">Not ready yet? Get your results by email.</h4>
          {emailStatus === "sent" ? (
            <p className="text-sm leading-relaxed text-[#5c7a52]">
              We&apos;ve sent your results to {email}.
            </p>
          ) : (
            <>
              <label className="block">
                <span className="mb-1 block text-xs text-[#5c7a52]">First name</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  autoComplete="given-name"
                  required
                  className="w-full rounded-xl border border-[#e6ebe3] px-3 py-2 text-sm text-[#2c3628] outline-none focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-[#5c7a52]">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-[#e6ebe3] px-3 py-2 text-sm text-[#2c3628] outline-none focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
                />
              </label>
              <label className="flex items-start gap-2 text-xs leading-relaxed text-[#5c7a52]">
                <input
                  type="checkbox"
                  checked={emailConsent}
                  onChange={(event) => setEmailConsent(event.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Email me my results and {copy.consentOrgan} health tips from Sanative. I can unsubscribe any time.{" "}
                  <Link href={LEGAL_LINKS.privacy} className="underline underline-offset-2">
                    Privacy policy
                  </Link>
                  .
                </span>
              </label>
              <button
                type="submit"
                disabled={emailStatus === "sending"}
                className="w-full rounded-full border border-[#34412f] px-4 py-2.5 text-sm font-medium text-[#34412f] hover:bg-[#f4f7f2] disabled:opacity-50"
              >
                {emailStatus === "sending" ? "Sending…" : "Send my results"}
              </button>
              {emailError ? <p className="text-xs text-[#c17a58]">{emailError}</p> : null}
            </>
          )}
        </form>

        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="w-full text-center text-sm font-medium text-[#34412f] underline underline-offset-4"
        >
          Got a question? Ask our Care Partner
        </button>

        <p className="text-[11px] leading-relaxed text-[#7e9a72]">{copy.disclaimer}</p>
      </div>
      <GuestSupportChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        initialEmail={email}
        initialFirstName={firstName}
        requireMobile
      />
    </div>
  );
}

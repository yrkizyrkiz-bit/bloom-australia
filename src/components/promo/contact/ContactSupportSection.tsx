"use client";

import { useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { GuestSupportChat } from "@/components/promo/contact/GuestSupportChat";

export function ContactSupportSection() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <div className="space-y-5">
        <article className="flex flex-col gap-5 rounded-[28px] border border-[#e6ebe3] bg-white px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="max-w-xl">
            <h2 className="font-serif text-2xl sm:text-[1.75rem] text-[#2c3628]">
              Not yet a member?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#5c7a52]">
              George, our AI care companion, is available around the clock for general
              questions. If you need a person, we will pass your note to the team.
              <span className="ml-1 inline-flex align-middle text-[#7e9a72]" title="Not medical advice">
                <Info className="h-3.5 w-3.5" />
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="btn-primary shrink-0 self-start sm:self-center"
          >
            Start chat
          </button>
        </article>

        <article className="flex flex-col gap-5 rounded-[28px] border border-[#e6ebe3] bg-white px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="max-w-xl">
            <h2 className="font-serif text-2xl sm:text-[1.75rem] text-[#2c3628]">
              Already a member?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#5c7a52]">
              For the most secure and personal support, start a conversation in your
              member portal.
              <span className="ml-1 inline-flex align-middle text-[#7e9a72]" title="Portal chat is for signed-in members">
                <Info className="h-3.5 w-3.5" />
              </span>
            </p>
          </div>
          <Link href="/login" className="btn-primary shrink-0 self-start sm:self-center">
            Log in
          </Link>
        </article>
      </div>

      <GuestSupportChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}

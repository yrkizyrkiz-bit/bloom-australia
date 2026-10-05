"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

/** Footer left panel: Get the app + phone frame. Mobile installs Sanative → /login. */
export function GetTheAppCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    setInstalled(isStandaloneDisplay());

    const loginUrl = `${window.location.origin}/login`;
    void QRCode.toDataURL(loginUrl, {
      width: 160,
      margin: 1,
      color: { dark: "#2c3628", light: "#ffffff" },
    }).then(setQrDataUrl);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setHint(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleGetTheApp = async () => {
    if (installed) {
      setHint("Sanative is already on your home screen.");
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setHint("Sanative was added to your home screen.");
      }
      setDeferredPrompt(null);
      return;
    }

    if (isIosDevice()) {
      setHint("Tap Share, then Add to Home Screen. The shortcut opens portal login.");
      return;
    }

    setHint("desktop-fallback");
  };

  return (
    <div className="mx-auto flex min-h-[560px] w-full max-w-[320px] flex-col overflow-hidden rounded-[2rem] bg-[#3d4f38] sm:min-h-[640px]">
      <div className="flex flex-col px-5 pb-3 pt-8 text-center sm:px-6 sm:pt-10">
        <p className="text-sm text-[#a8bb9e]">Sanative Portal</p>
        <h2 className="mt-3 font-serif text-3xl leading-tight text-white sm:text-[2rem]">
          Care built
          <br />
          for real life
        </h2>

        <button
          type="button"
          onClick={handleGetTheApp}
          className="mx-auto mt-8 flex w-full max-w-[240px] items-center justify-between gap-3 rounded-2xl bg-[#2c3628] px-4 py-3 text-left transition-colors hover:bg-[#243028] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8bb9e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#3d4f38]"
        >
          <span className="text-sm font-medium text-white">Portal Access</span>
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-1">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR code to Sanative login" className="h-full w-full" />
            ) : (
              <span className="h-full w-full animate-pulse bg-[#e6ebe3]" />
            )}
          </span>
        </button>

        <p className="mt-3 text-sm text-[#a8bb9e]">For iOS and Android</p>
        {hint && (
          <p className="mt-3 text-xs leading-relaxed text-[#cdd8c6]">
            {hint === "desktop-fallback" ? (
              <>
                Scan the QR on your phone, or{" "}
                <Link href="/login" className="underline underline-offset-2 hover:text-white">
                  click here
                </Link>{" "}
                and follow the link.
              </>
            ) : (
              hint
            )}
          </p>
        )}
      </div>

      <div className="relative mx-auto mt-auto w-full flex-1 px-5 sm:px-6">
        <div className="relative mx-auto h-full min-h-[280px] w-[72%] overflow-hidden rounded-t-[2rem] border-[6px] border-b-0 border-[#2c3628] bg-[#2c3628] shadow-xl">
          <div className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-[#4a6243]" />
          <Image
            src="/images/membership/sanative-doctor-screens.webp"
            alt="Sanative clinician on the member app"
            fill
            className="object-cover object-[center_18%]"
            sizes="200px"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2c3628]/90 to-transparent px-3 pb-4 pt-10">
            <p className="font-serif text-sm text-white">sanative</p>
            <p className="text-[10px] text-[#cdd8c6]">Your care, in one place</p>
          </div>
        </div>
      </div>
    </div>
  );
}

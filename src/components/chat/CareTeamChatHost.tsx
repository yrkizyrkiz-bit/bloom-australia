"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { LiveChat } from "@/components/chat/LiveChat";
import { GeorgeMascot } from "@/components/george/GeorgeMascot";
import { GEORGE_NAME } from "@/lib/george";

type CareTeamChatContextValue = {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
};

const CareTeamChatContext = createContext<CareTeamChatContextValue | null>(null);

export function useCareTeamChat() {
  return useContext(CareTeamChatContext);
}

export function CareTeamChatHost({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const onCareTeamPage = pathname.startsWith("/dashboard/weight-management/support");

  useEffect(() => {
    setMounted(true);
  }, []);

  const launcher =
    mounted && onCareTeamPage && !isOpen
      ? createPortal(
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label={`Chat with ${GEORGE_NAME}`}
            className="fixed bottom-8 right-6 z-[200] flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[#4a6243] bg-white shadow-xl"
          >
            <GeorgeMascot size="md" cropFace />
          </button>,
          document.body
        )
      : null;

  return (
    <CareTeamChatContext.Provider
      value={{
        isOpen,
        openChat: () => setIsOpen(true),
        closeChat: () => setIsOpen(false),
      }}
    >
      {children}
      {launcher}
      {onCareTeamPage ? (
        <LiveChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
      ) : null}
    </CareTeamChatContext.Provider>
  );
}

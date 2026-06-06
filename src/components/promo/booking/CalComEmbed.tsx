"use client";

import { useEffect, useRef } from "react";

interface CalComEmbedProps {
  calLink: string;
  config?: {
    name?: string;
    email?: string;
    notes?: string;
    theme?: "light" | "dark";
    hideEventTypeDetails?: boolean;
  };
}

declare global {
  interface Window {
    Cal?: {
      (action: string, ...args: unknown[]): void;
      ns?: Record<string, unknown>;
      loaded?: boolean;
      q?: unknown[];
    };
  }
}

export function CalComEmbed({ calLink, config }: CalComEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Cal.com embed script
    const script = document.createElement("script");
    script.src = "https://app.cal.com/embed/embed.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.Cal && containerRef.current) {
        window.Cal("init", { origin: "https://app.cal.com" });

        // Configure the embed
        window.Cal("ui", {
          theme: config?.theme || "light",
          styles: {
            branding: {
              brandColor: "#c17a58",
            },
          },
          hideEventTypeDetails: config?.hideEventTypeDetails || false,
        });

        // Create inline embed
        window.Cal("inline", {
          elementOrSelector: containerRef.current,
          calLink: calLink,
          config: {
            name: config?.name,
            email: config?.email,
            notes: config?.notes,
          },
        });
      }
    };

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://app.cal.com/embed/embed.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [calLink, config]);

  return (
    <div className="cal-embed-container rounded-3xl overflow-hidden bg-white" style={{ minHeight: "600px" }}>
      <div ref={containerRef} style={{ minHeight: "600px", width: "100%" }} />
    </div>
  );
}

// Alternative: Popup trigger button
export function CalComButton({
  calLink,
  children,
  config,
  className = ""
}: CalComEmbedProps & { children: React.ReactNode; className?: string }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.cal.com/embed/embed.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.Cal) {
        window.Cal("init", { origin: "https://app.cal.com" });
        window.Cal("ui", {
          theme: config?.theme || "light",
          styles: {
            branding: {
              brandColor: "#c17a58",
            },
          },
        });
      }
    };

    return () => {
      const existingScript = document.querySelector('script[src="https://app.cal.com/embed/embed.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [config]);

  const handleClick = () => {
    if (window.Cal) {
      window.Cal("modal", {
        calLink,
        config: {
          name: config?.name,
          email: config?.email,
          notes: config?.notes,
          theme: config?.theme || "light",
        },
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      data-cal-link={calLink}
      className={className}
      type="button"
    >
      {children}
    </button>
  );
}

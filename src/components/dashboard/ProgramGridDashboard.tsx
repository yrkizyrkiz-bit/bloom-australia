"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalContext } from "@/hooks/usePortalContext";
import {
  BIOMARKERS_HERO,
  ORGAN_CARE_CARD,
  SUPPLEMENTS_CARD,
  getProgramCardsForGender,
  type CardTheme,
  type CardTone,
  type DashboardProgramCard,
} from "@/lib/programs/catalog";
import type { DerivedMembershipEntitlements } from "@/lib/membership/entitlements";
import type { EntitlementState } from "@/lib/membership/biomarker-readiness";
import type { ProgramKey } from "@/lib/membership/keys";
import { cn } from "@/lib/utils";

type TileCta = {
  badgeLabel: string | null;
  ctaLabel: string;
  href: string;
  state: EntitlementState;
};

/** Badge copy for tiles where the member already has access. */
function getEnrollmentBadgeLabel(
  hasEntitlement: boolean,
  status: string | null | undefined,
  state: EntitlementState
): string | null {
  if (!hasEntitlement || status === "INACTIVE" || state === "inactive") return null;
  if (state === "pending_results" || status === "PENDING") {
    return "Enrolled · awaiting results";
  }
  return "Enrolled";
}

function EnrolledBadge({ label, tone }: { label: string; tone: CardTone }) {
  const colors = toneClasses(tone);
  return (
    <span
      className={cn(
        "inline-flex max-w-[9.5rem] items-center rounded-full px-2 py-1 text-[9px] font-bold uppercase leading-tight tracking-wide shadow-sm sm:max-w-none sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-wider",
        colors.activeBadge
      )}
    >
      {label}
    </span>
  );
}

function toneClasses(tone: CardTone) {
  return tone === "dark"
    ? {
        title: "text-white",
        accent: "text-[#cdd8c6]",
        body: "text-[#a8bb9e]",
        cta: "text-white",
        price: "text-[#cdd8c6]",
        status: "bg-white/15 text-white",
        activeBadge: "bg-white text-[#34412f]",
      }
    : {
        title: "text-[#2c3628]",
        accent: "text-[#4a6243]",
        body: "text-[#5c7a52]",
        cta: "text-[#34412f]",
        price: "text-[#4a6243]",
        status: "bg-[#e6ebe3] text-[#5c7a52]",
        activeBadge: "bg-[#4a6243] text-white",
      };
}

function programTileCta(
  card: DashboardProgramCard,
  membership: DerivedMembershipEntitlements | undefined
): TileCta {
  const program = membership?.programs?.[card.key as ProgramKey];

  if (!program?.hasEntitlement || program.state === "inactive" || program.status === "INACTIVE") {
    if (program?.status === "INACTIVE" || program?.state === "inactive") {
      return {
        badgeLabel: "Paused",
        ctaLabel: "Reactivate",
        href: card.quizRoute,
        state: "inactive",
      };
    }
    return {
      badgeLabel: null,
      ctaLabel: "Start quiz",
      href: card.quizRoute,
      state: "locked_upgrade",
    };
  }

  return {
    badgeLabel: getEnrollmentBadgeLabel(
      program.hasEntitlement,
      program.status,
      program.state
    ),
    ctaLabel: "Open program",
    href: card.dashboardRoute,
    state: program.state,
  };
}

function organCareTileCta(
  membership: DerivedMembershipEntitlements | undefined
): TileCta {
  const organScope = membership?.scopes?.ORGAN_CARE;
  const state = organScope?.state ?? "locked_upgrade";

  if (!organScope?.hasEntitlement || state === "inactive" || organScope.status === "INACTIVE") {
    if (organScope?.status === "INACTIVE" || state === "inactive") {
      return {
        badgeLabel: "Paused",
        ctaLabel: "Reactivate",
        href: ORGAN_CARE_CARD.quizRoute,
        state: "inactive",
      };
    }
    return {
      badgeLabel: null,
      ctaLabel: "Start quiz",
      href: ORGAN_CARE_CARD.quizRoute,
      state: "locked_upgrade",
    };
  }

  return {
    badgeLabel: getEnrollmentBadgeLabel(
      organScope.hasEntitlement,
      organScope.status,
      state
    ),
    ctaLabel: "Open program",
    href: ORGAN_CARE_CARD.hubRoute,
    state,
  };
}

function BiologicalClock({ active, className }: { active: boolean; className?: string }) {
  return (
    <div className={cn("relative h-16 w-16 shrink-0 sm:h-20 sm:w-20", className)}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="210 276"
          className={active ? "animate-[spin_8s_linear_infinite]" : "opacity-50"}
          style={{ transformOrigin: "50% 50%" }}
        />
        <g
          className={active ? "animate-[spin_3s_linear_infinite]" : ""}
          style={{ transformOrigin: "50% 50%" }}
        >
          <line x1="50" y1="50" x2="50" y2="22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="50" cy="50" r="4" fill="currentColor" />
      </svg>
    </div>
  );
}

function CleanCardShell({
  href,
  theme,
  className,
  children,
  onNavigate,
}: {
  href?: string;
  theme: CardTheme;
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const classes = cn(
    "group relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br p-4 transition-transform duration-300 sm:rounded-3xl sm:p-6 md:hover:scale-[1.02]",
    theme.gradient,
    href && "cursor-pointer",
    className
  );

  const inner = (
    <>
      {theme.tone === "dark" && (
        <div className="pointer-events-none absolute top-6 right-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
      )}
      {children}
    </>
  );

  if (href) {
    return (
      <div
        role="link"
        tabIndex={0}
        className={classes}
        onClick={() => {
          onNavigate?.();
          router.push(href);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onNavigate?.();
            router.push(href);
          }
        }}
      >
        {inner}
      </div>
    );
  }

  return <div className={classes}>{inner}</div>;
}

function BiomarkersHero({
  membership,
  onNavigate,
}: {
  membership: DerivedMembershipEntitlements | undefined;
  onNavigate?: () => void;
}) {
  const clock = membership?.biologicalClock;
  const hasBiomarkersEntitlement = Boolean(membership?.scopes?.BIOLOGICAL_CLOCK?.hasEntitlement);
  const isReady = clock?.state === "ready";
  const coverage = clock?.coverage;
  const href = hasBiomarkersEntitlement
    ? isReady
      ? BIOMARKERS_HERO.route
      : "/dashboard/biomarkers"
    : BIOMARKERS_HERO.biomarkersRoute;
  const theme = BIOMARKERS_HERO.theme;
  const colors = toneClasses(theme.tone);
  const Icon = BIOMARKERS_HERO.icon;
  const enrollmentBadge = getEnrollmentBadgeLabel(
    hasBiomarkersEntitlement,
    membership?.scopes?.BIOLOGICAL_CLOCK?.status,
    clock?.state ?? "locked_upgrade"
  );

  return (
    <CleanCardShell href={href} theme={theme} onNavigate={onNavigate} className="relative min-h-[180px] flex-col justify-between sm:min-h-[200px] sm:flex-row sm:items-center">
      <div className="relative z-10 min-w-0 flex-1">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {theme.badge && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                  theme.badge.className
                )}
              >
                {theme.badge.label}
              </span>
            )}
          </div>
          {enrollmentBadge && <EnrolledBadge label={enrollmentBadge} tone={theme.tone} />}
        </div>
        <h2 className={cn("font-serif text-2xl leading-tight sm:text-3xl", colors.title)}>
          Get My{" "}
          <span className={colors.accent}>{BIOMARKERS_HERO.titleAccent}</span>
        </h2>
        <p className={cn("mt-2 max-w-md text-sm sm:text-base", colors.body)}>{BIOMARKERS_HERO.tagline}</p>
        {coverage && coverage.requiredCount > 0 && (
          <p className={cn("mt-2 text-sm font-medium", colors.price)}>
            {isReady
              ? "Your biological age is ready to view"
              : hasBiomarkersEntitlement
                ? "Your panel is active — results will appear here"
                : `${coverage.availableCount} of ${coverage.requiredCount} core markers ready`}
          </p>
        )}
        <div className={cn("mt-4 inline-flex items-center gap-2 text-sm font-medium", colors.cta)}>
          {isReady
            ? "View biological age"
            : hasBiomarkersEntitlement
              ? "View biomarkers"
              : "Get my biomarkers"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
      <div className="relative z-10 mt-4 flex items-end justify-between gap-4 sm:mt-0 sm:ml-6">
        <div className={cn("text-current opacity-80", colors.cta)}>
          <BiologicalClock active={Boolean(isReady)} />
        </div>
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16",
            theme.iconCircle
          )}
        >
          <Icon className={cn("h-7 w-7 sm:h-8 sm:w-8", theme.iconColor)} />
        </div>
      </div>
    </CleanCardShell>
  );
}

function ProgramTile({
  card,
  membership,
  onNavigate,
}: {
  card: DashboardProgramCard;
  membership: DerivedMembershipEntitlements | undefined;
  onNavigate?: () => void;
}) {
  const Icon = card.icon;
  const cta = programTileCta(card, membership);
  const colors = toneClasses(card.theme.tone);

  return (
    <CleanCardShell href={cta.href} theme={card.theme} onNavigate={onNavigate} className="relative min-h-[200px] justify-between sm:min-h-[220px]">
      <div className="relative z-10">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {card.theme.badge && (
              <span
                className={cn(
                  "inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                  card.theme.badge.className
                )}
              >
                {card.theme.badge.label}
              </span>
            )}
            {cta.badgeLabel === "Paused" && (
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", colors.status)}>
                Paused
              </span>
            )}
          </div>
          {cta.badgeLabel && cta.badgeLabel !== "Paused" && (
            <EnrolledBadge label={cta.badgeLabel} tone={card.theme.tone} />
          )}
        </div>
        <h3 className={cn("font-serif text-xl leading-tight lg:text-2xl", colors.title)}>
          {card.label}
        </h3>
        <p className={cn("mt-2 text-sm leading-relaxed", colors.body)}>{card.tagline}</p>
        {card.priceHint && (
          <p className={cn("mt-3 text-sm font-medium", colors.price)}>{card.priceHint}</p>
        )}
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between">
        <div className={cn("flex items-center gap-2 text-sm font-medium", colors.cta)}>
          {cta.ctaLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full lg:h-14 lg:w-14",
            card.theme.iconCircle
          )}
        >
          <Icon className={cn("h-6 w-6 lg:h-7 lg:w-7", card.theme.iconColor)} />
        </div>
      </div>
    </CleanCardShell>
  );
}

function OrganCareTile({
  membership,
  onNavigate,
}: {
  membership: DerivedMembershipEntitlements | undefined;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const cta = organCareTileCta(membership);
  const entitled =
    cta.state === "ready" || cta.state === "partial" || cta.state === "pending_results";
  const theme = ORGAN_CARE_CARD.theme;
  const colors = toneClasses(theme.tone);

  return (
    <CleanCardShell
      href={cta.href}
      theme={theme}
      onNavigate={onNavigate}
      className="relative min-h-[200px] justify-between sm:min-h-[220px]"
    >
      <div className="relative z-10">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {theme.badge && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                  theme.badge.className
                )}
              >
                {theme.badge.label}
              </span>
            )}
            {cta.badgeLabel === "Paused" && (
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", colors.status)}>
                Paused
              </span>
            )}
          </div>
          {cta.badgeLabel && cta.badgeLabel !== "Paused" && (
            <EnrolledBadge label={cta.badgeLabel} tone={theme.tone} />
          )}
        </div>
        <h3 className={cn("font-serif text-xl leading-tight lg:text-2xl", colors.title)}>
          Organ &{" "}
          <span className={colors.accent}>{ORGAN_CARE_CARD.titleAccent}</span>
        </h3>
        <p className={cn("mt-2 text-sm leading-relaxed", colors.body)}>{ORGAN_CARE_CARD.tagline}</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex -space-x-1">
            {ORGAN_CARE_CARD.organPreview.map((organ) => (
              <div
                key={organ.label}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ring-2 ring-[#cdd8c6]",
                  organ.dot
                )}
              >
                {organ.letter}
              </div>
            ))}
          </div>
          <span className={cn("text-xs", colors.body)}>{ORGAN_CARE_CARD.organPreviewCaption}</span>
        </div>
        <p className={cn("mt-3 text-sm font-medium", colors.price)}>{ORGAN_CARE_CARD.priceHint}</p>
      </div>

      {entitled && (
        <div className="relative z-10 mt-4 flex flex-wrap gap-2">
          {ORGAN_CARE_CARD.organs.map((organ) => (
            <button
              key={organ.label}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.();
                router.push(organ.route);
              }}
              className={cn(
                "min-h-9 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                "bg-[#4a6243]/10 text-[#4a6243] hover:bg-[#4a6243]/20"
              )}
            >
              {organ.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative z-10 mt-4 flex items-center justify-between">
        <div className={cn("flex items-center gap-2 text-sm font-medium", colors.cta)}>
          {cta.ctaLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full lg:h-14 lg:w-14",
            theme.iconCircle
          )}
        >
          <Activity className={cn("h-6 w-6 lg:h-7 lg:w-7", theme.iconColor)} />
        </div>
      </div>
    </CleanCardShell>
  );
}

function SupplementsTile({ onNavigate }: { onNavigate?: () => void }) {
  const Icon = SUPPLEMENTS_CARD.icon;
  const theme = SUPPLEMENTS_CARD.theme;
  const colors = toneClasses(theme.tone);

  return (
    <CleanCardShell href={SUPPLEMENTS_CARD.route} theme={theme} onNavigate={onNavigate} className="min-h-[200px] justify-between sm:min-h-[220px]">
      <div className="relative z-10">
        {theme.badge && (
          <span
            className={cn(
              "mb-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
              theme.badge.className
            )}
          >
            {theme.badge.label}
          </span>
        )}
        <h3 className={cn("font-serif text-xl leading-tight lg:text-2xl", colors.title)}>
          Supplements &{" "}
          <span className="text-[#c17a58]">{SUPPLEMENTS_CARD.titleAccent}</span>
        </h3>
        <p className={cn("mt-2 text-sm leading-relaxed", colors.body)}>{SUPPLEMENTS_CARD.tagline}</p>
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between">
        <div className={cn("flex items-center gap-2 text-sm font-medium", colors.cta)}>
          {SUPPLEMENTS_CARD.priceHint}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full lg:h-14 lg:w-14", theme.iconCircle)}>
          <Icon className={cn("h-6 w-6 lg:h-7 lg:w-7", theme.iconColor)} />
        </div>
      </div>
    </CleanCardShell>
  );
}

export function ProgramGridDashboard({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { user } = useAuth();
  const { data: portal } = usePortalContext();
  const membership = portal?.membership;
  const entitledProgramKeys = (Object.keys(membership?.programs ?? {}) as ProgramKey[]).filter(
    (key) => membership?.programs?.[key]?.hasEntitlement
  );
  const cards = getProgramCardsForGender(user?.gender, { entitledProgramKeys });
  const firstName = user?.firstName;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center sm:text-left">
        <span className="mb-3 inline-block rounded-full bg-[#e6ebe3] px-3 py-1.5 text-xs font-medium text-[#5c7a52] sm:px-4 sm:text-sm">
          Your programs
        </span>
        <h1 className="font-serif text-2xl text-[#2c3628] sm:text-3xl md:text-4xl">
          {firstName ? (
            <>
              Welcome back, <span className="text-gradient italic">{firstName}</span>
            </>
          ) : (
            <>
              Welcome <span className="text-gradient italic">back</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-[#5c7a52]">What can we help you with today?</p>
      </div>

      <BiomarkersHero membership={membership} onNavigate={onNavigate} />

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {cards.map((card) => (
          <ProgramTile key={card.key} card={card} membership={membership} onNavigate={onNavigate} />
        ))}
        <OrganCareTile membership={membership} onNavigate={onNavigate} />
        <SupplementsTile onNavigate={onNavigate} />
      </div>
    </div>
  );
}

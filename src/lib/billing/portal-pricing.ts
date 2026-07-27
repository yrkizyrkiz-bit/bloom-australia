import type { BillingInterval } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ProgramKey } from "@/lib/membership/keys";
import type { ProgramBillingTerm, BiomarkersPanelTier, OrganCareBillingTerm } from "@/lib/programs/offers";
import {
  billingIntervalLabel,
  billingIntervalShort,
  billingModelsAvailable,
  ensureBillingCatalog,
} from "@/lib/billing/catalog";

export type BillingPriceRow = {
  id: string;
  billingInterval: BillingInterval;
  amountCents: number;
  amountAud: number;
  label: string | null;
  isDefault: boolean;
  isFirstMonth: boolean;
  isActive: boolean;
  stripePriceId: string | null;
};

export type ProgramProductPricing = {
  productId: string;
  slug: string;
  name: string;
  program: string;
  planTier: string | null;
  prices: BillingPriceRow[];
};

export type ProgramCheckoutQuote = {
  programKey: ProgramKey;
  billingTerm: ProgramBillingTerm;
  planTier: "CORE" | "PRECISION" | null;
  firstMonth: BillingPriceRow;
  recurring: BillingPriceRow;
  dueTodayAud: number;
  dueTodayLabel: string;
  recurringLabel: string;
  priceLabel: string;
  includesConsultation: true;
};

export function programBillingTermToInterval(term: ProgramBillingTerm): BillingInterval {
  switch (term) {
    case "1m":
      return "MONTHLY";
    case "3m":
      return "QUARTERLY";
    case "6m":
      return "BIANNUAL";
    case "12m":
      return "YEARLY";
  }
}

export function formatAudFromCents(cents: number): string {
  const aud = cents / 100;
  return aud % 1 === 0 ? `$${aud.toFixed(0)}` : `$${aud.toFixed(2)}`;
}

export function formatRecurringPriceLabel(amountCents: number, interval: BillingInterval): string {
  const aud = formatAudFromCents(amountCents);
  if (interval === "MONTHLY") return `${aud}/mo`;
  if (interval === "YEARLY") return `${aud}/yr`;
  if (interval === "QUARTERLY") return `${aud} every 3 months`;
  if (interval === "BIANNUAL") return `${aud} every 6 months`;
  return aud;
}

function toPriceRow(row: {
  id: string;
  billingInterval: BillingInterval;
  amountCents: number;
  label: string | null;
  isDefault: boolean;
  isFirstMonth: boolean;
  isActive: boolean;
  stripePriceId: string | null;
}): BillingPriceRow {
  return {
    id: row.id,
    billingInterval: row.billingInterval,
    amountCents: row.amountCents,
    amountAud: row.amountCents / 100,
    label: row.label,
    isDefault: row.isDefault,
    isFirstMonth: row.isFirstMonth,
    isActive: row.isActive,
    stripePriceId: row.stripePriceId,
  };
}

export async function getProgramProductPricing(
  programKey: ProgramKey,
  planTier: "CORE" | "PRECISION" | null = "CORE"
): Promise<ProgramProductPricing | null> {
  await ensureBillingCatalog();
  if (!billingModelsAvailable()) return null;

  const product = await prisma.product.findFirst({
    where: {
      program: programKey,
      isActive: true,
      ...(programKey === "WEIGHT_MANAGEMENT"
        ? { planTier: planTier ?? "CORE" }
        : { planTier: null }),
    },
    include: {
      billingPrices: {
        where: { isActive: true },
        orderBy: [{ isFirstMonth: "desc" }, { amountCents: "asc" }],
      },
    },
  });

  if (!product) return null;

  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    program: product.program,
    planTier: product.planTier,
    prices: product.billingPrices.map(toPriceRow),
  };
}

export async function resolveProgramCheckoutQuote(
  programKey: ProgramKey,
  billingTerm: ProgramBillingTerm,
  planTier: "CORE" | "PRECISION" | null = "CORE"
): Promise<ProgramCheckoutQuote> {
  const catalog = await getProgramProductPricing(programKey, planTier);
  if (!catalog) {
    throw new Error(`No pricing configured for ${programKey}`);
  }

  const firstMonth = catalog.prices.find((p) => p.isFirstMonth);
  const interval = programBillingTermToInterval(billingTerm);
  const recurring =
    catalog.prices.find((p) => !p.isFirstMonth && p.billingInterval === interval) ??
    catalog.prices.find((p) => !p.isFirstMonth && p.isDefault) ??
    catalog.prices.find((p) => !p.isFirstMonth);

  if (!firstMonth || !recurring) {
    throw new Error(`Incomplete pricing for ${programKey} — configure first month and recurring prices in admin`);
  }

  const dueTodayLabel = `${formatAudFromCents(firstMonth.amountCents)} today`;
  const recurringLabel = `then ${formatRecurringPriceLabel(recurring.amountCents, recurring.billingInterval)}`;

  return {
    programKey,
    billingTerm,
    planTier: programKey === "WEIGHT_MANAGEMENT" ? planTier ?? "CORE" : null,
    firstMonth,
    recurring,
    dueTodayAud: firstMonth.amountAud,
    dueTodayLabel,
    recurringLabel,
    priceLabel: `${dueTodayLabel}, ${recurringLabel}`,
    includesConsultation: true,
  };
}

export async function listAllMembershipPricing(): Promise<ProgramProductPricing[]> {
  await ensureBillingCatalog();
  if (!billingModelsAvailable()) return [];

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ program: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: {
      billingPrices: { orderBy: [{ isFirstMonth: "desc" }, { billingInterval: "asc" }] },
    },
  });

  return products.map((p) => ({
    productId: p.id,
    slug: p.slug,
    name: p.name,
    program: p.program,
    planTier: p.planTier,
    prices: p.billingPrices.map(toPriceRow),
  }));
}

/** Biomarkers panel tier maps to product slug. */
export const BIOMARKERS_PRODUCT_SLUGS: Record<BiomarkersPanelTier, string> = {
  essential: "biomarkers_essential",
  extended: "biomarkers_extended",
  comprehensive: "biomarkers_comprehensive",
};

export const ORGAN_CARE_PRODUCT_SLUG = "organ_care";

export async function getBiomarkersPanelPrice(tier: BiomarkersPanelTier): Promise<BillingPriceRow | null> {
  await ensureBillingCatalog();
  const slug = BIOMARKERS_PRODUCT_SLUGS[tier];
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { billingPrices: { where: { isActive: true, billingInterval: "YEARLY", isFirstMonth: false } } },
  });
  const row = product?.billingPrices[0];
  return row ? toPriceRow(row) : null;
}

export function organCareTermToInterval(term: OrganCareBillingTerm): BillingInterval {
  return term === "monthly" ? "MONTHLY" : "YEARLY";
}

export async function getOrganCarePricingOptions(): Promise<{
  monthly: BillingPriceRow | null;
  annual: BillingPriceRow | null;
}> {
  await ensureBillingCatalog();
  const product = await prisma.product.findUnique({
    where: { slug: ORGAN_CARE_PRODUCT_SLUG },
    include: {
      billingPrices: {
        where: { isActive: true, isFirstMonth: false },
      },
    },
  });
  if (!product) return { monthly: null, annual: null };

  const rows = product.billingPrices.map(toPriceRow);
  return {
    monthly: rows.find((r) => r.billingInterval === "MONTHLY") ?? null,
    annual: rows.find((r) => r.billingInterval === "YEARLY") ?? null,
  };
}

export async function getPublicOrganCareAnnualPricing(): Promise<{
  amountCents: number;
  amountAud: number;
  priceLabel: string;
}> {
  const { annual } = await getOrganCarePricingOptions();
  const amountCents = annual?.amountCents ?? 49900;
  return {
    amountCents,
    amountAud: amountCents / 100,
    priceLabel: annual
      ? formatRecurringPriceLabel(annual.amountCents, annual.billingInterval)
      : "$499/yr",
  };
}

/** @deprecated Use getOrganCarePricingOptions */
export async function getOrganCarePrice(): Promise<BillingPriceRow | null> {
  const { annual } = await getOrganCarePricingOptions();
  return annual;
}

export async function resolveOrganCarePrice(
  term: OrganCareBillingTerm
): Promise<BillingPriceRow> {
  const options = await getOrganCarePricingOptions();
  const row = term === "monthly" ? options.monthly : options.annual;
  if (!row) {
    throw new Error(`Organ Care ${term} pricing is not configured in admin`);
  }
  return row;
}

export async function resolveOrganCareCheckoutQuote(
  organCareTerm: OrganCareBillingTerm,
  addBiomarkers: boolean,
  panelTier: BiomarkersPanelTier = "essential"
) {
  const organ = await resolveOrganCarePrice(organCareTerm);
  let panel: BillingPriceRow | null = null;
  if (addBiomarkers) {
    panel = await getBiomarkersPanelPrice(panelTier);
    if (!panel) throw new Error(`No annual pricing for biomarkers panel: ${panelTier}`);
  }

  const totalCents = organ.amountCents + (panel?.amountCents ?? 0);
  const organLabel = formatRecurringPriceLabel(organ.amountCents, organ.billingInterval);
  const panelLabel = panel
    ? formatRecurringPriceLabel(panel.amountCents, panel.billingInterval)
    : null;

  return {
    organCareTerm,
    organ,
    panelTier: addBiomarkers ? panelTier : null,
    panel,
    addBiomarkers,
    totalAud: totalCents / 100,
    priceLabel: panelLabel
      ? `${formatAudFromCents(totalCents)} due today (${organLabel} organ care + ${panelLabel} biomarkers)`
      : organLabel,
    dueTodayLabel: formatAudFromCents(totalCents),
  };
}

export async function resolveBiomarkersCheckoutQuote(
  panelTier: BiomarkersPanelTier,
  _addOrganCare: boolean,
  organCareTerm: OrganCareBillingTerm = "annual"
) {
  const panel = await getBiomarkersPanelPrice(panelTier);
  if (!panel) throw new Error(`No annual pricing for biomarkers panel: ${panelTier}`);

  // Organ Care is included with every panel — never charged as an add-on.
  const addOrganCare = false as boolean;
  const organ = null as BillingPriceRow | null;

  const totalCents = panel.amountCents + (organ?.amountCents ?? 0);
  const organLabel = organ
    ? formatRecurringPriceLabel(organ.amountCents, organ.billingInterval)
    : null;

  return {
    panelTier,
    panel,
    organ,
    organCareTerm: addOrganCare ? organCareTerm : null,
    addOrganCare,
    totalAud: totalCents / 100,
    priceLabel: organLabel
      ? `${formatAudFromCents(totalCents)} due today (${formatAudFromCents(panel.amountCents)} panel + ${organLabel} organ care)`
      : `${formatAudFromCents(totalCents)}/yr`,
    dueTodayLabel: formatAudFromCents(totalCents),
  };
}

export function billingIntervalDisplay(interval: BillingInterval): string {
  return billingIntervalLabel(interval);
}

export function billingIntervalShortLabel(interval: BillingInterval): string {
  return billingIntervalShort(interval);
}

import { redirect } from "next/navigation";

/**
 * DEPRECATED FUNNEL — consolidated into Sanative Membership.
 * All biomarker panel purchases now go through /membership/checkout
 * ($365/yr including the Essential panel). The `source` query param from
 * program assessments (hair, men's, women's) maps to the funnel intent.
 */
export default async function DeprecatedBiomarkersCheckout({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const source = typeof params.source === "string" ? params.source : "";

  const intent = source.startsWith("womens_health")
    ? "womens_health"
    : source === "mens_health"
      ? "mens_health"
      : source === "hair_loss"
        ? "hair_loss"
        : "biomarkers";

  redirect(`/membership/checkout?intent=${intent}${source ? `&source=${source}` : ""}`);
}

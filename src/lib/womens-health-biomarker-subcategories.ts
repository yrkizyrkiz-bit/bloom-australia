import { DERIVED_BIOMARKER_IDS } from "@/lib/derived-biomarkers";

export type WomensHealthSubcategorySlug =
  | "hormones"
  | "menopause"
  | "pcos"
  | "fertility";

export interface WomensHealthSubcategory {
  slug: WomensHealthSubcategorySlug;
  label: string;
  description: string;
  markerIds: string[];
}

export const WOMENS_HEALTH_SUBCATEGORIES: WomensHealthSubcategory[] = [
  {
    slug: "hormones",
    label: "Hormone Health",
    description:
      "Cycle, mood, libido, energy, thyroid and nutrient markers for hormone balance.",
    markerIds: [
      "estradiol",
      "progesterone",
      "fsh",
      "lh",
      "prolactin",
      "testosterone_total",
      "shbg",
      "free_androgen_index",
      "tsh",
      "free_t4",
      "ferritin",
      "iron",
      "transferrin_saturation",
      "vitamin_d",
    ],
  },
  {
    slug: "menopause",
    label: "Menopause & Perimenopause",
    description:
      "Reproductive, thyroid, iron, vitamin D and metabolic markers for menopausal transition.",
    markerIds: [
      "estradiol",
      "progesterone",
      "fsh",
      "lh",
      "tsh",
      "free_t4",
      "ferritin",
      "iron",
      "transferrin_saturation",
      "vitamin_d",
      "glucose",
      "hba1c",
      "insulin",
      "homa_ir",
      "tyg_index",
    ],
  },
  {
    slug: "pcos",
    label: "PCOS & Metabolic Health",
    description:
      "Androgen, cycle, glucose, insulin and thyroid markers for PCOS and metabolic risk.",
    markerIds: [
      "testosterone_total",
      "shbg",
      "free_androgen_index",
      "glucose",
      "hba1c",
      "insulin",
      "homa_ir",
      "tyg_index",
      "fsh",
      "lh",
      "estradiol",
      "progesterone",
      "tsh",
      "free_t4",
    ],
  },
  {
    slug: "fertility",
    label: "Fertility & Reproductive Health",
    description:
      "Cycle, reproductive hormone, thyroid, iron, vitamin and metabolic markers for fertility planning.",
    markerIds: [
      "fsh",
      "lh",
      "estradiol",
      "progesterone",
      "prolactin",
      "tsh",
      "free_t4",
      "ferritin",
      "iron",
      "transferrin_saturation",
      "vitamin_d",
      "glucose",
      "hba1c",
      "insulin",
      "homa_ir",
    ],
  },
];

export function getWomensHealthSubcategory(
  slug?: string | null
): WomensHealthSubcategory | undefined {
  return WOMENS_HEALTH_SUBCATEGORIES.find((item) => item.slug === slug);
}

export function isDerivedBiomarkerId(markerId: string): boolean {
  return (DERIVED_BIOMARKER_IDS as readonly string[]).includes(markerId);
}

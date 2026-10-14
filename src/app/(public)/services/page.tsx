import { redirect } from "next/navigation";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.services;

/** Public services hub retired; keep this URL for old links. */
export default function ServicesPage() {
  redirect("/");
}

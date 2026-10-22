import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/site";


export const metadata = buildPageMetadata({
  title: "FAQs | Sanative",
  description: "Sanative’s FAQ page now lives on the contact page.",
  path: "/faqs",
  index: false,
});

/** Legacy FAQ URL; keep it from 404ing by sending old links to contact. */
export default function FaqsPage() {
  redirect("/contact");
}

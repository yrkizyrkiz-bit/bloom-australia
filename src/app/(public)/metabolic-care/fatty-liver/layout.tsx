import type { ReactNode } from "react";
import { publicPageMeta } from "@/lib/seo/public-page-meta";

export const metadata = publicPageMeta.fattyLiver;

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

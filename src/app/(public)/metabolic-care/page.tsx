import { redirect } from "next/navigation";

/** Public hub is Organ Care. Keep /metabolic-care URLs working. */
export default function MetabolicCareRedirect() {
  redirect("/organ-care");
}

"use client";

import { ProgramFocusLanding } from "@/components/dashboard/ProgramFocusLanding";

export default function WomensSexualHealthPage() {
  return (
    <ProgramFocusLanding
      programKey="WOMENS_HEALTH_SEXUAL"
      title="Sexual Health"
      intro="Confidential, judgement-free care for libido, intimacy and sexual wellbeing, guided by your hormones and a clinical care team."
      focusItems={[
        "Low libido and desire changes",
        "Hormone-related symptoms",
        "Comfort, arousal and wellbeing",
        "Menopause and perimenopause effects",
      ]}
      biomarkerItems={[
        "Testosterone and Free Androgen Index",
        "Estradiol and Progesterone",
        "SHBG",
        "Prolactin",
        "TSH and Free T4",
      ]}
      quizRoute="/dashboard/programs/womens_health_sexual"
    />
  );
}

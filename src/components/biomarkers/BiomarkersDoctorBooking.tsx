"use client";

import { MembershipConsultationBooking } from "@/components/membership/MembershipConsultationBooking";

type Props = {
  userId: string;
  paymentIntentId: string;
  consentRecordId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  postcode?: string;
  onComplete: () => void;
};

/** Doctor telehealth booking for biomarkers checkout. */
export function BiomarkersDoctorBooking(props: Props) {
  return (
    <MembershipConsultationBooking
      {...props}
      programType="BIOLOGICAL_CLOCK"
      riskFlags={["BIOMARKERS_PANEL"]}
    />
  );
}

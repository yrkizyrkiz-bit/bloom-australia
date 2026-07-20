"use client";

import { MembershipConsultationBooking } from "@/components/membership/MembershipConsultationBooking";
import {
  consultRiskFlagsForSource,
  resolveConsultProgramType,
} from "@/lib/funnel/resolve-consult-program-type";

type Props = {
  userId: string;
  paymentIntentId: string;
  consentRecordId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  postcode?: string;
  sourceProgram?: string;
  onComplete: () => void;
};

/** Doctor telehealth booking for biomarkers checkout. */
export function BiomarkersDoctorBooking({ sourceProgram, ...props }: Props) {
  return (
    <MembershipConsultationBooking
      {...props}
      programType={resolveConsultProgramType(sourceProgram)}
      riskFlags={consultRiskFlagsForSource(sourceProgram)}
    />
  );
}

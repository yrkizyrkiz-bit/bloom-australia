export type PathologyReferralDoctor = {
  fullName: string;
  providerNumber: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export type PathologyReferralPatient = {
  fullName: string;
  surname: string;
  givenNames: string;
  sex?: string | null;
  dateOfBirth: string;
  medicareNumber: string;
  medicareIrn: string;
  address: string;
  postcode?: string | null;
  phone?: string | null;
};

export type PathologyReferralPayload = {
  referralId: string;
  issuedAt: Date;
  doctor: PathologyReferralDoctor;
  patient: PathologyReferralPatient;
  programSlugs?: string[];
  programLabels?: string[];
  testIds: string[];
  customTests?: string;
  clinicalIndication: string;
  fastingRequired: boolean;
  urgent: boolean;
};

export function downloadPathologyReferralPdf(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export type PathologyReferralSubmitPayload = {
  userId: string;
  consultationId?: string;
  programSlugs: string[];
  additionalTestIds: string[];
  customTests?: string;
  clinicalIndication: string;
  fastingRequired: boolean;
  urgent: boolean;
  medicareNumber?: string;
  medicareIrn?: string;
  emailToPatient: boolean;
  doctor: {
    fullName: string;
    providerNumber: string;
    phone: string;
    email: string;
  };
};

export type PathologyReferralSubmitResult = {
  pdfBase64?: string;
  pdfFilename?: string;
  emailSent?: boolean;
  emailError?: string;
  error?: string;
};

export async function submitPathologyReferral(
  payload: PathologyReferralSubmitPayload
): Promise<{ ok: true; data: PathologyReferralSubmitResult } | { ok: false; error: string }> {
  const res = await fetch("/api/admin/doctor/pathology-referral", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as PathologyReferralSubmitResult;
  if (!res.ok) {
    return { ok: false, error: data.error || "Failed to record referral" };
  }

  return { ok: true, data };
}

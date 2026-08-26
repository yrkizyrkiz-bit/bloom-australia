"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  downloadPathologyReferralPdf,
  submitPathologyReferral,
} from "@/lib/pathology/pathology-referral-client";
import {
  ALL_PATHOLOGY_PANEL_SLUGS,
  buildPathologyIndicationNotes,
  mergePathologyTestIds,
  normalizePatientGender,
  programSlugsRequireFasting,
  resolveDefaultPathologyPanels,
  type PathologyPanelSlug,
} from "@/lib/pathology/pathology-program-panels";

export type PathologyReferralPatientInput = {
  id: string;
  fullName: string;
  email: string;
  dateOfBirth: string | null;
  address: string;
  phone: string | null;
  gender?: string | null;
  subscriptionTier?: string | null;
};

type UsePathologyReferralFormOptions = {
  patient: PathologyReferralPatientInput;
  consultationId?: string | null;
  active: boolean;
};

export function usePathologyReferralForm({
  patient,
  consultationId,
  active,
}: UsePathologyReferralFormOptions) {
  const indicationEditedRef = useRef(false);
  const referralDetailsRef = useRef<HTMLDivElement>(null);
  const providerInputRef = useRef<HTMLInputElement>(null);
  const doctorUserIdRef = useRef<string | null>(null);
  const openInitTokenRef = useRef(0);

  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [providerError, setProviderError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [providerNumber, setProviderNumber] = useState("");
  const [providerSource, setProviderSource] = useState<string | null>(null);
  const [doctorPhone, setDoctorPhone] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [medicareNumber, setMedicareNumber] = useState("");
  const [medicareIrn, setMedicareIrn] = useState("");
  const [selectedPanels, setSelectedPanels] = useState<PathologyPanelSlug[]>([]);
  const [additionalTests, setAdditionalTests] = useState<string[]>([]);
  const [customTests, setCustomTests] = useState("");
  const [clinicalIndication, setClinicalIndication] = useState("");
  const [fastingRequired, setFastingRequired] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [emailToPatient, setEmailToPatient] = useState(true);
  const [quizSubmissions, setQuizSubmissions] = useState<
    Array<{ programKey: string; answers: unknown; result: unknown }>
  >([]);
  const [intakeDataList, setIntakeDataList] = useState<unknown[]>([]);

  const patientGender = normalizePatientGender(patient.gender);

  const getProviderNumberValue = () =>
    (providerInputRef.current?.value ?? providerNumber).trim();

  const persistProviderNumber = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || !doctorUserIdRef.current) return;

    try {
      localStorage.setItem(`sanative-doctor-provider-${doctorUserIdRef.current}`, trimmed);
      await fetch("/api/admin/doctor/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicareProviderNumber: trimmed }),
      });
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    if (!active) return;

    const initToken = ++openInitTokenRef.current;
    indicationEditedRef.current = false;
    doctorUserIdRef.current = null;
    setProviderError(false);
    setSelectedPanels(resolveDefaultPathologyPanels(patient.subscriptionTier));
    setAdditionalTests([]);
    setCustomTests("");
    setClinicalIndication("");
    setQuizSubmissions([]);
    setIntakeDataList([]);
    setMedicareNumber("");
    setMedicareIrn("");
    setProviderSource(null);
    setDoctorName("");
    setDoctorPhone("");
    setDoctorEmail("");
    setFastingRequired(false);
    setUrgent(false);
    setEmailToPatient(true);

    setLoadingPrefill(true);
    Promise.all([
      fetch("/api/admin/doctor/account").then((res) => (res.ok ? res.json() : null)),
      fetch(`/api/admin/doctor/pathology-referral?userId=${encodeURIComponent(patient.id)}`).then(
        (res) => (res.ok ? res.json() : null)
      ),
    ])
      .then(([doctorData, patientData]) => {
        if (initToken !== openInitTokenRef.current) return;

        if (doctorData?.doctor) {
          doctorUserIdRef.current = doctorData.doctor.id;
          const storedProvider = localStorage.getItem(
            `sanative-doctor-provider-${doctorData.doctor.id}`
          );
          const resolvedProvider =
            doctorData.doctor.registrationNumber || storedProvider || "";

          setDoctorName(
            doctorData.doctor.fullName
              ? `Dr ${doctorData.doctor.fullName}`.replace(/^Dr Dr /, "Dr ")
              : ""
          );
          setProviderNumber(resolvedProvider);
          setProviderSource(doctorData.doctor.registrationSource || null);
          setDoctorPhone(doctorData.doctor.phone || "");
          setDoctorEmail(doctorData.doctor.email || "");
        }

        if (patientData?.patient?.medicareNumber) {
          setMedicareNumber(patientData.patient.medicareNumber);
          setMedicareIrn(patientData.patient.medicareIrn || "");
        }

        if (Array.isArray(patientData?.quizSubmissions)) {
          setQuizSubmissions(patientData.quizSubmissions);
        }
        if (Array.isArray(patientData?.intakeDataList)) {
          setIntakeDataList(patientData.intakeDataList);
        }
      })
      .catch(() => toast.error("Could not load referral details"))
      .finally(() => {
        if (initToken === openInitTokenRef.current) {
          setLoadingPrefill(false);
        }
      });
  }, [active, patient.id, patient.subscriptionTier]);

  const resolvedTestIds = useMemo(
    () => mergePathologyTestIds(selectedPanels, patientGender, additionalTests),
    [selectedPanels, patientGender, additionalTests]
  );

  const suggestedIndication = useMemo(
    () =>
      buildPathologyIndicationNotes({
        programSlugs: selectedPanels,
        testIds: resolvedTestIds,
        customTests,
        quizSubmissions,
        intakeDataList,
      }),
    [selectedPanels, resolvedTestIds, customTests, quizSubmissions, intakeDataList]
  );

  useEffect(() => {
    if (indicationEditedRef.current) return;
    setClinicalIndication(suggestedIndication);
  }, [suggestedIndication]);

  useEffect(() => {
    if (programSlugsRequireFasting(selectedPanels, patientGender, additionalTests)) {
      setFastingRequired(true);
    }
  }, [selectedPanels, patientGender, additionalTests]);

  const hasTestsSelected =
    selectedPanels.length > 0 || additionalTests.length > 0 || Boolean(customTests.trim());

  const getResolvedIndication = () =>
    clinicalIndication.trim() || suggestedIndication.trim();

  const togglePanel = (slug: PathologyPanelSlug, checked: boolean) => {
    setSelectedPanels((prev) => {
      if (checked) return [...new Set([...prev, slug])];
      return prev.filter((s) => s !== slug);
    });
  };

  const selectAllPanels = () => {
    setSelectedPanels([...ALL_PATHOLOGY_PANEL_SLUGS]);
  };

  const toggleAdditionalTest = (testId: string, checked: boolean) => {
    setAdditionalTests((prev) =>
      checked ? [...prev, testId] : prev.filter((id) => id !== testId)
    );
  };

  const validateForGenerate = (): boolean => {
    const trimmedProvider = getProviderNumberValue();
    if (!trimmedProvider) {
      setProviderError(true);
      referralDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      providerInputRef.current?.focus();
      toast.error(
        "Your Medicare provider number is required, enter it in the first field under Referral details (not the patient Medicare number)"
      );
      return false;
    }
    setProviderError(false);
    if (!hasTestsSelected) {
      toast.error("Select at least one program panel or additional test");
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const trimmedProvider = getProviderNumberValue();
    return {
      userId: patient.id,
      consultationId: consultationId || undefined,
      programSlugs: selectedPanels,
      additionalTestIds: additionalTests,
      customTests: customTests.trim() || undefined,
      clinicalIndication: getResolvedIndication(),
      fastingRequired,
      urgent,
      medicareNumber: medicareNumber.trim() || undefined,
      medicareIrn: medicareIrn.trim() || undefined,
      emailToPatient,
      doctor: {
        fullName: doctorName,
        providerNumber: trimmedProvider,
        phone: doctorPhone,
        email: doctorEmail,
      },
    };
  };

  const generateReferral = async (options?: { closeOnSuccess?: boolean; onSuccess?: () => void }) => {
    if (!validateForGenerate()) return false;

    setSubmitting(true);
    try {
      const trimmedProvider = getProviderNumberValue();
      await persistProviderNumber(trimmedProvider);

      const result = await submitPathologyReferral(buildPayload());
      if (!result.ok) {
        throw new Error(result.error);
      }

      const data = result.data;
      if (data.pdfBase64 && data.pdfFilename) {
        downloadPathologyReferralPdf(data.pdfBase64, data.pdfFilename);
      }

      if (emailToPatient) {
        if (data.emailSent) {
          toast.success(`Referral saved, PDF downloaded, and emailed to ${patient.email}`);
        } else {
          toast.warning(
            data.emailError
              ? `Referral saved but email failed: ${data.emailError}`
              : "Referral saved but email was not sent (check email configuration)"
          );
        }
      } else {
        toast.success("Pathology referral saved and PDF downloaded");
      }

      options?.onSuccess?.();
      return true;
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to generate referral");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    patientEmail: patient.email,
    loadingPrefill,
    providerError,
    submitting,
    referralDetailsRef,
    providerInputRef,
    doctorName,
    setDoctorName,
    providerNumber,
    updateProviderNumber: (value: string) => {
      setProviderError(false);
      setProviderNumber(value);
    },
    providerSource,
    doctorPhone,
    setDoctorPhone,
    doctorEmail,
    setDoctorEmail,
    medicareNumber,
    setMedicareNumber,
    medicareIrn,
    setMedicareIrn,
    selectedPanels,
    additionalTests,
    customTests,
    setCustomTests,
    clinicalIndication,
    setClinicalIndication,
    indicationEditedRef,
    fastingRequired,
    setFastingRequired,
    urgent,
    setUrgent,
    emailToPatient,
    setEmailToPatient,
    resolvedTestIds,
    hasTestsSelected,
    getResolvedIndication,
    getTestsRequiredIds: () => resolvedTestIds,
    getProviderNumberValue,
    persistProviderNumber,
    togglePanel,
    selectAllPanels,
    toggleAdditionalTest,
    validateForGenerate,
    generateReferral,
  };
}

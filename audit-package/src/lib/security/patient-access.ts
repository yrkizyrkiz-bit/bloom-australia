export function canAccessPatientClinicalRecord(params: {
  actorRole: string;
  actorUserId: string;
  patientUserId: string;
  assignedDoctorId?: string | null;
}): boolean {
  const role = params.actorRole.toUpperCase();

  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return true;
  }

  if (role === "CARE_PARTNER") {
    return true;
  }

  if (role === "DOCTOR") {
    if (!params.assignedDoctorId) {
      return true;
    }
    return params.assignedDoctorId === params.actorUserId;
  }

  return false;
}

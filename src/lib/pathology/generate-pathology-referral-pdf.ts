import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { SANATIVE_LEGAL } from "@/lib/legal/constants";
import { formatAustralianPathologyTestsForPdf } from "@/lib/pathology/blood-test-catalog";
import { formatClinicalIndicationForPdf } from "@/lib/pathology/pathology-program-panels";
import type { PathologyReferralPayload } from "@/lib/pathology/types";

const PAGE_W = 210;
const PAGE_H = 297;
const M = 5;
const W = PAGE_W - M * 2;

const COL = {
  border: [29, 158, 117] as [number, number, number],
  borderLight: [180, 210, 200] as [number, number, number],
  labelBg: [232, 244, 240] as [number, number, number],
  labelText: [44, 65, 47] as [number, number, number],
  body: [30, 30, 30] as [number, number, number],
  muted: [100, 100, 100] as [number, number, number],
  red: [190, 45, 45] as [number, number, number],
  watermark: [225, 238, 233] as [number, number, number],
};

const GAP = 0.8;

function wrapLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function setDrawBorder(doc: jsPDF, light = false) {
  doc.setDrawColor(...(light ? COL.borderLight : COL.border));
  doc.setLineWidth(light ? 0.15 : 0.25);
}

function drawOuterFrame(doc: jsPDF, x: number, y: number, w: number, h: number) {
  setDrawBorder(doc);
  doc.rect(x, y, w, h);
}

type FieldOpts = {
  labelHeight?: number;
  fontSize?: number;
  lineHeight?: number;
  boldValue?: boolean;
};

function drawField(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  opts: FieldOpts = {}
) {
  const labelHeight = opts.labelHeight ?? 4.2;
  const fontSize = opts.fontSize ?? 7;
  const lineHeight = opts.lineHeight ?? 3.1;
  const maxLines = Math.max(1, Math.floor((h - labelHeight - 2) / lineHeight));

  setDrawBorder(doc);
  doc.rect(x, y, w, h);
  doc.setFillColor(...COL.labelBg);
  doc.rect(x, y, w, labelHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.8);
  doc.setTextColor(...COL.labelText);
  doc.text(label.toUpperCase(), x + 1.2, y + 2.9);
  doc.setFont("helvetica", opts.boldValue ? "bold" : "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...COL.body);

  const lines = wrapLines(doc, value || "", w - 2.5);
  let ty = y + labelHeight + 2.8;
  for (const line of lines.slice(0, maxLines)) {
    doc.text(line, x + 1.5, ty);
    ty += lineHeight;
  }
}

function drawCheckbox(doc: jsPDF, x: number, y: number, label: string, checked: boolean) {
  setDrawBorder(doc, true);
  doc.rect(x, y, 3.2, 3.2);
  if (checked) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("✓", x + 0.55, y + 2.7);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.2);
  doc.setTextColor(...COL.body);
  doc.text(label, x + 4.2, y + 2.7);
}

function buildTestsText(payload: PathologyReferralPayload): string {
  return formatAustralianPathologyTestsForPdf(payload.testIds, payload.customTests);
}

function drawMedicareFieldBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  payload: PathologyReferralPayload
) {
  drawField(doc, x, y, w, h, "Medicare card number", "", { labelHeight: 3.8 });
  const medicare = payload.patient.medicareNumber
    ? `${payload.patient.medicareNumber}${payload.patient.medicareIrn ? `  IRN ${payload.patient.medicareIrn}` : ""}`
    : "";
  const placeholder = "Patient to present Medicare card at collection";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(compactMedicareFont(medicare || placeholder));
  doc.setTextColor(...COL.body);
  doc.text(medicare || placeholder, x + w - 2, y + h - 2, {
    align: "right",
    maxWidth: w - 3,
  });
}

function drawSanativeHeader(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  compact = false,
  payload?: PathologyReferralPayload
) {
  const h = compact ? 7 : 14;
  const medicareW = compact ? 0 : w * 0.34;
  const leftW = compact ? w : w - medicareW - 0.5;

  drawOuterFrame(doc, x, y, leftW, h);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(compact ? 8 : 12);
  doc.setTextColor(...COL.border);
  doc.text("SANATIVE", x + 2.5, y + (compact ? 4.5 : 6.5));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(compact ? 5 : 7.5);
  doc.setTextColor(...COL.body);
  doc.text("Clinic Pathology Request", x + 2.5, y + (compact ? 6.5 : 10.5));

  if (!compact) {
    doc.setFontSize(4.8);
    doc.setTextColor(...COL.muted);
    doc.text(SANATIVE_LEGAL.entityName, x + 2.5, y + 13);
    doc.text(`Support: ${SANATIVE_LEGAL.supportEmail}`, x + leftW * 0.38, y + 6);
    doc.text(SANATIVE_LEGAL.website.replace("https://", ""), x + leftW * 0.38, y + 9.5);
    doc.text(SANATIVE_LEGAL.address, x + leftW * 0.38, y + 12.5, { maxWidth: leftW * 0.42 });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.8);
    doc.setTextColor(...COL.red);
    doc.text("* Mobile number required for SMS notification", x + leftW - 52, y + 6, {
      maxWidth: 50,
    });

    if (payload) {
      drawMedicareFieldBox(doc, x + leftW + 0.5, y, medicareW, h, payload);
    }
  }

  return y + h + GAP;
}

function compactMedicareFont(value: string): number {
  if (!value) return 8;
  return value.length > 18 ? 8 : 9.5;
}

function drawPatientDemographics(doc: jsPDF, x: number, y: number, w: number, payload: PathologyReferralPayload) {
  const rowH = 9;

  const row1 = [
    { label: "Patient surname", value: payload.patient.surname, w: w * 0.21 },
    { label: "Given name(s)", value: payload.patient.givenNames, w: w * 0.27 },
    { label: "Sex", value: payload.patient.sex || "", w: w * 0.07 },
    { label: "Date of birth", value: payload.patient.dateOfBirth, w: w * 0.17 },
    { label: "Your reference", value: payload.referralId, w: w * 0.28 },
  ];
  let cx = x;
  for (const col of row1) {
    drawField(doc, cx, y, col.w - 0.4, rowH, col.label, col.value, { labelHeight: 3.8, fontSize: 7 });
    cx += col.w;
  }
  y += rowH + GAP;

  const row2 = [
    { label: "Patient address", value: payload.patient.address, w: w * 0.48 },
    { label: "Postcode", value: payload.patient.postcode || "", w: w * 0.1 },
    { label: "Tel (mobile)", value: payload.patient.phone || "", w: w * 0.2 },
    { label: "Tel (other)", value: "", w: w * 0.22 },
  ];
  cx = x;
  for (const col of row2) {
    drawField(doc, cx, y, col.w - 0.4, rowH, col.label, col.value, { labelHeight: 3.8, fontSize: 7 });
    cx += col.w;
  }
  return y + rowH + GAP;
}

function drawClinicalSection(doc: jsPDF, x: number, y: number, w: number, payload: PathologyReferralPayload) {
  const sidebarW = 26;
  const mainW = w - sidebarW - 1;
  const testsH = 76;
  const notesH = 22;
  const sectionH = testsH + notesH + GAP;

  drawField(doc, x, y, mainW, testsH, "Tests requested (MBS / panel)", buildTestsText(payload), {
    labelHeight: 4.2,
    fontSize: 6,
    lineHeight: 2.75,
    boldValue: false,
  });

  const indication =
    formatClinicalIndicationForPdf(payload.clinicalIndication) || payload.clinicalIndication;
  drawField(doc, x, y + testsH + GAP, mainW, notesH, "Clinical notes", indication, {
    labelHeight: 4.2,
    fontSize: 6.5,
    lineHeight: 2.9,
  });

  const sx = x + mainW + 1;
  drawOuterFrame(doc, sx, y, sidebarW, sectionH);
  doc.setFillColor(...COL.labelBg);
  doc.rect(sx, y, sidebarW, 4.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.8);
  doc.setTextColor(...COL.labelText);
  doc.text("COLLECTION", sx + 1, y + 2.9);

  const checks: Array<[string, boolean]> = [
    ["Fasting", payload.fastingRequired],
    ["Non fasting", !payload.fastingRequired],
    ["Pregnant", false],
    ["Horm therapy", false],
  ];
  let sy = y + 6;
  for (const [label, checked] of checks) {
    drawCheckbox(doc, sx + 1.5, sy, label, checked);
    sy += 4.8;
  }

  drawField(doc, sx + 0.5, sy, sidebarW - 1, 7, "LNMP", "", { labelHeight: 3.2, fontSize: 6 });
  sy += 7.5;
  drawField(doc, sx + 0.5, sy, sidebarW - 1, 7, "EDC", "", { labelHeight: 3.2, fontSize: 6 });

  return y + sectionH + GAP;
}

function drawPractitionerSection(doc: jsPDF, x: number, y: number, w: number, payload: PathologyReferralPayload) {
  const leftW = w * 0.54;
  const rightW = w - leftW - 1;
  const h = 16;

  drawOuterFrame(doc, x, y, leftW, h);
  doc.setFillColor(...COL.labelBg);
  doc.rect(x, y, leftW, 4.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.8);
  doc.text("URGENCY / BILLING", x + 1, y + 2.9);

  const row1: Array<[string, boolean]> = [
    ["Emergency", payload.urgent],
    ["Phone", true],
    ["Fax", false],
    ["By time", false],
  ];
  let cx = x + 2;
  for (const [label, checked] of row1) {
    drawCheckbox(doc, cx, y + 5.5, label, checked);
    cx += 22;
  }

  const row2: Array<[string, boolean]> = [
    ["Private", false],
    ["Schedule", false],
    ["Medicare", true],
    ["Veterans / WC", false],
  ];
  cx = x + 2;
  for (const [label, checked] of row2) {
    drawCheckbox(doc, cx, y + 10, label, checked);
    cx += 24;
  }

  drawOuterFrame(doc, x + leftW + 1, y, rightW, h);
  doc.setFillColor(...COL.labelBg);
  doc.rect(x + leftW + 1, y, rightW, 4.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.8);
  doc.text("PRACTITIONER SIGNATURE & DATE", x + leftW + 2, y + 2.9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.text(format(payload.issuedAt, "dd/MM/yyyy"), x + leftW + 2.5, y + 8.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(payload.doctor.fullName, x + leftW + 2.5, y + 11.5);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(4.8);
  doc.setTextColor(...COL.red);
  doc.text("Telehealth, signature on file", x + leftW + 2.5, y + 14.5);
  doc.setTextColor(...COL.body);

  return y + h + GAP;
}

function drawReferringSection(doc: jsPDF, x: number, y: number, w: number, payload: PathologyReferralPayload) {
  const h = 9.5;
  const doctorLine = [
    payload.doctor.providerNumber,
    payload.doctor.fullName,
    payload.doctor.address || SANATIVE_LEGAL.address,
  ]
    .filter(Boolean)
    .join("   ·   ");

  drawField(doc, x, y, w * 0.28, h, "Copy reports to", "Sanative portal", { labelHeight: 3.8, fontSize: 6.5 });
  drawField(
    doc,
    x + w * 0.28 + 0.4,
    y,
    w * 0.5,
    h,
    "Referring practitioner (provider no., name, address)",
    doctorLine,
    { labelHeight: 3.8, fontSize: 6.5, lineHeight: 2.8 }
  );
  drawField(doc, x + w * 0.785, y, w * 0.215 - 0.4, h, "Hospital / ward", "N/A", {
    labelHeight: 3.8,
    fontSize: 6.5,
  });
  return y + h + GAP;
}

function drawSpecimenGrid(doc: jsPDF, x: number, y: number, w: number) {
  const rows: Array<{ label: string; cells: string[] }> = [
    { label: "Tubes", cells: ["GEL", "PLAIN", "EDTA", "GLUC", "CITRATE", "HEPARIN", "BACTO"] },
    { label: "Urine / Swab", cells: ["CYTO", "24 HR", "PCR", "ORANGE", "BLUE", "RED", "OTHER"] },
  ];

  const labelW = 14;
  const rowH = 3.6;
  const rowGap = 0.35;
  const headerH = 4.2;
  const collectionH = 5;
  const gridBodyH = rows.length * rowH + (rows.length - 1) * rowGap;
  const h = headerH + gridBodyH + collectionH + 1.2;

  drawOuterFrame(doc, x, y, w, h);
  doc.setFillColor(...COL.labelBg);
  doc.rect(x, y, w, headerH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.8);
  doc.setTextColor(...COL.labelText);
  doc.text("SPECIMEN TYPE, FOR LABORATORY USE", x + 1.2, y + 2.9);

  let ry = y + headerH + 0.4;
  for (const row of rows) {
    const availableForCells = w - 2 - labelW - 1;
    const cellW = (availableForCells - (row.cells.length - 1) * 0.3) / row.cells.length;

    setDrawBorder(doc, true);
    doc.setFillColor(248, 252, 250);
    doc.rect(x + 1, ry, labelW, rowH, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.3);
    doc.setTextColor(...COL.labelText);
    doc.text(row.label, x + 1.8, ry + 2.5);

    let cx = x + 1 + labelW + 0.5;
    for (const cell of row.cells) {
      setDrawBorder(doc, true);
      doc.rect(cx, ry, cellW, rowH);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(4.1);
      doc.setTextColor(...COL.muted);
      doc.text(cell, cx + 0.8, ry + 2.5);
      cx += cellW + 0.3;
    }
    ry += rowH + rowGap;
  }

  const collY = y + h - collectionH - 0.4;
  setDrawBorder(doc, true);
  doc.rect(x + 1, collY, w - 2, collectionH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.1);
  doc.setTextColor(...COL.labelText);
  doc.text("Collection: location / date / time / initials", x + 2, collY + 2.2);
  doc.setDrawColor(...COL.borderLight);
  doc.line(x + 2, collY + 3.6, x + w - 3, collY + 3.6);

  return y + h + GAP;
}

function drawMedicareConsentStrip(doc: jsPDF, x: number, y: number, w: number) {
  const h = 9.5;
  drawOuterFrame(doc, x, y, w, h);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.8);
  doc.setTextColor(...COL.body);
  doc.text("PATIENT SIGNATURE & DATE", x + 1.2, y + 2.8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.9);
  doc.setTextColor(...COL.muted);
  doc.text(
    "Medicare benefits assigned to approved pathology provider. Patient may choose any NATA-accredited provider.",
    x + 1.2,
    y + 5.2,
    { maxWidth: w * 0.58 }
  );
  const sigX = x + w * 0.62;
  const sigW = w * 0.36 - 1;
  setDrawBorder(doc, true);
  doc.line(sigX, y + 6.8, sigX + sigW, y + 6.8);
  doc.setFontSize(3.6);
  doc.text("Signature / date", sigX, y + 8.4);
  doc.setTextColor(...COL.body);
  return y + h;
}

function drawRequestForm(doc: jsPDF, payload: PathologyReferralPayload): number {
  const x = M;
  const y = M;
  const innerX = x + 1;
  const innerW = W - 2;

  let cy = y + 1;
  cy = drawSanativeHeader(doc, innerX, cy, innerW, false, payload);
  cy = drawPatientDemographics(doc, innerX, cy, innerW, payload);
  cy = drawClinicalSection(doc, innerX, cy, innerW, payload);
  cy = drawPractitionerSection(doc, innerX, cy, innerW, payload);
  cy = drawReferringSection(doc, innerX, cy, innerW, payload);
  cy = drawSpecimenGrid(doc, innerX, cy, innerW);
  cy = drawMedicareConsentStrip(doc, innerX, cy, innerW);

  drawOuterFrame(doc, x, y, W, cy - y + 1);
  return cy + 1.5;
}

function drawPatientCopy(doc: jsPDF, payload: PathologyReferralPayload, startY: number) {
  const x = M;
  const y = startY;
  const h = PAGE_H - y - M;

  doc.setTextColor(...COL.watermark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PATIENT COPY", x + W / 2 - 22, y + h / 2, { angle: 28 });
  doc.setTextColor(...COL.body);

  let cy = y + 0.5;
  cy = drawSanativeHeader(doc, x, cy, W, true);

  const rowH = 5.5;
  drawField(doc, x, cy, W * 0.24, rowH, "Surname", payload.patient.surname, {
    labelHeight: 3,
    fontSize: 5.5,
  });
  drawField(doc, x + W * 0.24, cy, W * 0.26, rowH, "Given names", payload.patient.givenNames, {
    labelHeight: 3,
    fontSize: 5.5,
  });
  drawField(doc, x + W * 0.5, cy, W * 0.07, rowH, "Sex", payload.patient.sex || "", {
    labelHeight: 3,
    fontSize: 5.5,
  });
  drawField(doc, x + W * 0.57, cy, W * 0.13, rowH, "DOB", payload.patient.dateOfBirth, {
    labelHeight: 3,
    fontSize: 5.5,
  });
  drawField(doc, x + W * 0.7, cy, W * 0.3, rowH, "Reference", payload.referralId, {
    labelHeight: 3,
    fontSize: 5.5,
  });
  cy += rowH + 0.5;

  const footerH = 7;
  const testsH = Math.max(12, h - (cy - y) - footerH - 1);
  drawField(doc, x, cy, W, testsH, "Tests requested", buildTestsText(payload), {
    labelHeight: 3.2,
    fontSize: 4.8,
    lineHeight: 2.4,
  });

  doc.setFillColor(248, 252, 250);
  setDrawBorder(doc, true);
  doc.rect(x, y + h - footerH, W, footerH - 0.5, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.6);
  doc.setTextColor(...COL.body);
  doc.text(
    "Take to any NATA-accredited pathology centre. Results upload to your Sanative portal.",
    x + 1,
    y + h - footerH + 3.2,
    { maxWidth: W - 2 }
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.6);
  doc.setTextColor(...COL.red);
  doc.text("You may choose your pathology provider.", x + 1, y + h - 2.2);
}

export function buildPathologyReferralFilename(
  patientFullName: string,
  referralId: string
): string {
  const safeName = patientFullName.replace(/\s+/g, "_").replace(/[^\w-]/g, "");
  return `Pathology_Referral_${safeName}_${referralId}.pdf`;
}

export function generatePathologyReferralPdf(payload: PathologyReferralPayload): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const patientCopyStartY = drawRequestForm(doc, payload);
  drawPatientCopy(doc, payload, patientCopyStartY);

  return doc;
}

export function downloadPathologyReferralPdf(payload: PathologyReferralPayload): void {
  const doc = generatePathologyReferralPdf(payload);
  doc.save(buildPathologyReferralFilename(payload.patient.fullName, payload.referralId));
}

export function pathologyReferralPdfBase64(payload: PathologyReferralPayload): string {
  const doc = generatePathologyReferralPdf(payload);
  const arrayBuffer = doc.output("arraybuffer") as ArrayBuffer;
  return Buffer.from(arrayBuffer).toString("base64");
}

export function pathologyReferralPdfArrayBuffer(payload: PathologyReferralPayload): ArrayBuffer {
  const doc = generatePathologyReferralPdf(payload);
  return doc.output("arraybuffer") as ArrayBuffer;
}

export function splitPatientNameForReferral(firstName: string, lastName: string) {
  return {
    fullName: `${firstName} ${lastName}`.trim(),
    surname: lastName.trim(),
    givenNames: firstName.trim(),
  };
}

export function formatPatientSexForReferral(gender?: string | null): string {
  const g = (gender || "").toLowerCase();
  if (g === "female" || g === "f") return "F";
  if (g === "male" || g === "m") return "M";
  if (g === "other") return "O";
  return "";
}

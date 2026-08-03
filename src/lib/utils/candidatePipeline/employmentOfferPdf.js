import { jsPDF } from "jspdf";

const clean = (value) => String(value ?? "").trim();

function formatLongDate(value) {
  const text = clean(value);
  if (!text) return "";
  const date = new Date(`${text.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function money(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


function createPesoSymbolDataUrl() {
  if (typeof document === "undefined") return "";

  const canvas = document.createElement("canvas");
  const scale = 4;
  canvas.width = 64 * scale;
  canvas.height = 64 * scale;

  const context = canvas.getContext("2d");
  if (!context) return "";

  context.scale(scale, scale);
  context.clearRect(0, 0, 64, 64);
  context.fillStyle = "#000000";
  context.font = 'bold 44px "Arial", "Segoe UI Symbol", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("₱", 32, 33);

  return canvas.toDataURL("image/png");
}

function addPesoSymbol(doc, pesoSymbolDataUrl, x, y) {
  if (pesoSymbolDataUrl) {
    doc.addImage(pesoSymbolDataUrl, "PNG", x - 0.4, y - 4.4, 4.4, 5.2);
    return;
  }

  // Browser canvas is unavailable only in non-browser test environments.
  doc.text("PHP", x, y);
}

async function loadOfferHeaderDataUrl() {
  try {
    const response = await fetch("/EmploymentOfferHeader.png");
    if (!response.ok) return "";
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

function getCandidateAddress(candidate = {}) {
  const metadata = candidate.metadata || candidate.candidateMetadata || {};
  return clean(
    candidate.address ||
      candidate.currentAddress ||
      candidate.current_address ||
      candidate.homeAddress ||
      candidate.home_address ||
      metadata.address ||
      metadata.currentAddress ||
      metadata.current_address,
  );
}

function addWrapped(doc, text, x, y, width, options = {}) {
  const lineHeight = options.lineHeight || 5.15;
  const lines = doc.splitTextToSize(clean(text), width);
  doc.text(lines, x, y, options.textOptions || {});
  return y + lines.length * lineHeight;
}

function writeInline(doc, parts, x, y) {
  let cursor = x;
  parts.forEach(({ text, bold = false }) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(text, cursor, y);
    cursor += doc.getTextWidth(text);
  });
  doc.setFont("helvetica", "normal");
}



function drawHeader(doc, headerImage) {
  if (headerImage) {
    // Exact header artwork extracted from the approved Job Offer template.
    // Keep the original 940 x 232 aspect ratio and physical placement.
    doc.addImage(headerImage, "PNG", 25.4, 12.4, 159.2, 39.3);
    return;
  }

  // Fallback only when the header asset cannot be loaded.
  doc.setTextColor(5, 47, 82);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.3);
  doc.text("NADELA BUSINESS CENTER, INC", 99, 21);
  doc.setFontSize(8.4);
  doc.text("Siblings International Business Solutions", 99, 25.2);
  doc.text("HUMAN RESOURCE DEPARTMENT", 99, 29.4);
  doc.setFont("helvetica", "normal");
  doc.text("Davao: 5F, Robinsons Cybergate Delta, Tower 2, Bajada, Davao City", 99, 33.6);
  doc.text("Tagum: Ramos Bldg., Arellano St., Tagum City", 99, 37.8);
  doc.text("Tel: +639178308169", 99, 42);
  doc.text("Email: hr@thesiblingssolutions.com", 99, 46.2);
  doc.setTextColor(0, 0, 0);
}

export async function generateEmploymentOfferPdf({ candidate = {}, offer = {} }) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 25.5;
  const paragraphLeft = 38;
  const contentRight = 184.5;
  const contentWidth = contentRight - left;
  const paragraphWidth = contentRight - paragraphLeft;

  const rawName = clean(candidate.name || candidate.candidateName);
  const name = rawName.toUpperCase() || "CANDIDATE";
  const firstName = rawName.split(/\s+/)[0] || "Candidate";
  const address = getCandidateAddress(candidate) || "Address not provided";
  const roleTitle = clean(offer.roleTitle || offer.finalRole) || "Position not specified";
  const startDate = formatLongDate(offer.startDate || offer.start_date);
  const basicPay = Number(offer.basicPay || 0);
  const deminimis = Number(offer.deminimisDailyRate || 0);
  const total = basicPay + deminimis;
  const headerImage = await loadOfferHeaderDataUrl();
  const pesoSymbolDataUrl = createPesoSymbolDataUrl();

  drawHeader(doc, headerImage);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("EMPLOYMENT OFFER", pageWidth / 2, 61.5, { align: "center" });

  doc.setFontSize(10.25);
  doc.setFont("helvetica", "normal");
  doc.text(formatLongDate(new Date().toISOString().slice(0, 10)), left, 72.5);

  doc.setFont("helvetica", "bold");
  doc.text(name, left, 82.5);
  doc.setFont("helvetica", "normal");
  doc.text(address, left, 88);
  doc.text(`Dear ${firstName},`, left, 98);

  let y = 108;
  y = addWrapped(
    doc,
    `We are delighted to extend this offer of employment for the position of ${roleTitle} here at SiBS. You will be reporting out our Davao Site located at Robinsons Cybergate Delta, Tower 2, 5th Floor, Bajada, Davao City.`,
    left,
    y,
    contentWidth,
  );

  if (startDate) {
    y += 5;
    writeInline(doc, [
      { text: "Your start date is " },
      { text: startDate, bold: true },
      { text: " under the following terms and conditions:" },
    ], left, y);
  }

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.text("1.", 31.5, y);
  doc.text("Term of Employment Contract", paragraphLeft, y);
  y += 10;

  const employmentText = startDate
    ? `You will be under a Probationary Employment Contract for 180 days (6) months from your starting date on of ${startDate}. Your contract may progress without any need for verbal or written notice unless you decide to cease your employment with the Company or unless poor performance would necessitate the non-progression of your employment.`
    : "You will be under a Probationary Employment Contract for 180 days (6) months from your starting date. Your contract may progress without any need for verbal or written notice unless you decide to cease your employment with the Company or unless poor performance would necessitate the non-progression of your employment.";

  y = addWrapped(doc, employmentText, paragraphLeft, y, paragraphWidth);
  y += 5;
  y = addWrapped(
    doc,
    "We also have our Company’s Code of Conduct and Work Rules Policy and other policies that apply to all employees of the Company. Violation of the Company’s Code of Conduct and Work Rules Policy could lead to termination of the employment Contract.",
    paragraphLeft,
    y,
    paragraphWidth,
  );

  y += 8;
  doc.text("2.", 31.5, y);
  doc.text("Compensation and Other Benefits", paragraphLeft, y);
  y += 10;
  y = addWrapped(
    doc,
    "For and in consideration of the services that you will render, you will be entitled to the following compensation:",
    paragraphLeft,
    y,
    paragraphWidth,
  );

  y += 5;
  doc.text("Basic Daily Rate", paragraphLeft, y);
  addPesoSymbol(doc, pesoSymbolDataUrl, 76, y);
  doc.text(money(basicPay), 82, y);
  y += 5;
  doc.text("Daily De Minimis", paragraphLeft, y);
  addPesoSymbol(doc, pesoSymbolDataUrl, 76, y);
  doc.text(money(deminimis), 82, y);
  y += 5;
  doc.text("Total:", paragraphLeft, y);
  addPesoSymbol(doc, pesoSymbolDataUrl, 76, y);
  doc.text(money(total), 82, y);

  y += 9;
  writeInline(doc, [
    { text: "Upon Regularization, you will be eligible for the " },
    { text: "Company’s Health Plan Benefit.", bold: true },
  ], paragraphLeft, y);

  y += 10;
  doc.text("3.", 31.5, y);
  doc.text("Pre-employment Requirements", paragraphLeft, y);
  y += 10;
  addWrapped(
    doc,
    "A list of pre-employment requirements is listed herein. Please ensure complete submission before the date of the New Hire’s Orientation, which will be communicated to you on a later date. The pre-employment requirements are as follows:",
    paragraphLeft,
    y,
    paragraphWidth,
  );

  doc.addPage();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.8);

  // The approved Job Offer has no visible page number.
  y = 18;
  const requirementLabelX = left;
  const requirementTextX = left + 6.5;
  const requirementTextWidth = contentRight - requirementTextX;
  const requirementLineHeight = 4.65;

  function drawRequirement(label, text) {
    doc.setFont("helvetica", "normal");
    doc.text(label, requirementLabelX, y);
    y = addWrapped(doc, text, requirementTextX, y, requirementTextWidth, {
      lineHeight: requirementLineHeight,
    });
    y += 0.7;
  }

  drawRequirement("a.", "ID picture (2 pcs passport size),");
  drawRequirement("b.", "Transcript of Records and/or Diploma,");

  // Keep item C on the same four lines and indentation as the approved Job Offer.
  doc.setFont("helvetica", "normal");
  doc.text("c.", requirementLabelX, y);
  doc.text(
    "Medical Records and Medical Certificate (Fit to Work certification) (VITALAB for Davao City",
    requirementTextX,
    y,
  );
  y += requirementLineHeight;
  doc.text(
    "applicants) -Urinalysis, Fecalysis, Pregnancy Test (for females only), Drug Test, Chest X-Ray",
    requirementTextX,
    y,
  );
  y += requirementLineHeight;
  doc.text("and Hepa B (Serology) Note:", requirementTextX, y);
  const noteX = requirementTextX + doc.getTextWidth("and Hepa B (Serology) Note: ");
  doc.setFont("helvetica", "italic");
  doc.text(
    "Please present your referral slip or inform the clinic that this",
    noteX,
    y,
  );
  y += requirementLineHeight;
  doc.text(
    "will be for SiBS pre-employment requirements;",
    requirementTextX,
    y,
  );
  doc.setFont("helvetica", "normal");
  y += requirementLineHeight + 0.7;

  drawRequirement("d.", "NBI Clearance (original);");
  drawRequirement("e.", "BIR 2316 Form from previous employment (current year),");
  drawRequirement("f.", "TIN Verification Slip (c/o SiBS if no TIN number yet),");
  drawRequirement("g.", "SSS E1 Form,");
  drawRequirement(
    "h.",
    "PhilHealth Member’s Data Record / PMRF with number (c/o SiBS if no Philhealth number yet),",
  );
  drawRequirement("i.", "Pag-IBIG Member’s Data Form (MDF) with number,");
  drawRequirement(
    "j.",
    "Birth Certificate, Marriage certificate & children’s birth certificate (3 copies each),",
  );
  drawRequirement("k.", "Employment certificate (previous employer/s),");
  drawRequirement("l.", "Occupational Permit, and");
  drawRequirement("m.", "Valid ID with 3 specimen signatures (3 copies).");

  y += 3;
  y = addWrapped(
    doc,
    "The complete submission of all listed pre-employment requirements is necessary for a new-hire to be able to attend the New-Hire’s Orientation (NHO). Failure to comply with the submission of all the pre-employment requirements may result in the new hire being unable to join the NHO and unable to start on their assigned start date. Furthermore, in the event that a new-hire is allowed to start work without completing the submission of all the pre-employment requirements, the Company may withhold the release of his salary until such time that the requirements are all complied with and submitted.",
    left,
    y,
    contentWidth,
    { lineHeight: 4.65 },
  );

  y += 4;
  y = addWrapped(
    doc,
    "Please signify your acceptance of this Employment Offer by signing on the space provided below. We look forward to a fruitful and harmonious working relationship with you.",
    left,
    y,
    contentWidth,
    { lineHeight: 4.65 },
  );

  y += 6;
  doc.text("Very truly yours,", left, y);
  y += 5;
  doc.text("For NADELA BUSINESS CENTER, INC.", left, y);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("HASSANOR M. SUMAGUINA", left, y);
  doc.setFont("helvetica", "normal");
  y += 4.5;
  doc.text("Senior Corporate Services Manager", left, y);

  y += 9;
  doc.text("Acceptance:", left, y);
  y += 5;
  y = addWrapped(
    doc,
    "I hereby certify that I have read and understood the foregoing Employment Offer, and I hereby accept this employment, subject to the execution of the employment contract.",
    left,
    y,
    contentWidth,
    { lineHeight: 4.65 },
  );

  y += 11;
  doc.text("_____________________________", left, y);
  y += 5;
  doc.text("Signature over Printed Name", left, y);
  y += 9;
  doc.text("Date signed: ________________", left, y);

  const filename = `Employment Offer - ${rawName || "Candidate"}.pdf`;
  const dataUri = doc.output("datauristring");
  return {
    filename,
    base64: dataUri.split(",")[1] || "",
  };
}

export default generateEmploymentOfferPdf;

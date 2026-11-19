import { CSR_FIT_MODULE_NAMES } from '../../components/assessment/csrFitModuleGuides.js';

/**
 * Read-only CSR-Fit PDF report, generated from the authenticated HR results payload.
 * No invitation tokens, answer modifications, or undisclosed answer keys.
 * The logo is reused from the same Client public asset as the Employment Offer page.
 */
const MODULES = CSR_FIT_MODULE_NAMES.map((title, index) => [`module${index + 1}`, title]);

const LOGO_URL = '/SiBSLogoNavy.png';
// Mirrors the typography configured in src/index.css: Plus Jakarta Sans for
// application text, and Roboto Condensed for headings. jsPDF needs TTF fonts;
// CSS web fonts cannot be selected through pdf.setFont() without registration.
// Font binaries are fetched only when an HR user exports, never shipped in ZIPs.
const PDF_FONT_FAMILIES = Object.freeze({ body: 'SiBSPlusJakartaSans', heading: 'SiBSRobotoCondensed' });
const PDF_FONT_ASSETS = Object.freeze([
  { key: 'bodyRegular', name: 'PlusJakartaSans-Regular.ttf', urls: [
    'https://cdn.jsdelivr.net/gh/tokotype/PlusJakartaSans@master/fonts/ttf/PlusJakartaSans-Regular.ttf',
    'https://raw.githubusercontent.com/tokotype/PlusJakartaSans/master/fonts/ttf/PlusJakartaSans-Regular.ttf',
  ] },
  { key: 'bodyBold', name: 'PlusJakartaSans-Bold.ttf', urls: [
    'https://cdn.jsdelivr.net/gh/tokotype/PlusJakartaSans@master/fonts/ttf/PlusJakartaSans-Bold.ttf',
    'https://raw.githubusercontent.com/tokotype/PlusJakartaSans/master/fonts/ttf/PlusJakartaSans-Bold.ttf',
  ] },
  { key: 'headingBold', name: 'RobotoCondensed-Bold.ttf', urls: [
    'https://cdn.jsdelivr.net/gh/googlefonts/roboto-2@main/src/hinted/RobotoCondensed-Bold.ttf',
    'https://raw.githubusercontent.com/googlefonts/roboto-2/main/src/hinted/RobotoCondensed-Bold.ttf',
    'https://cdn.jsdelivr.net/gh/googlefonts/roboto-2@master/src/hinted/RobotoCondensed-Bold.ttf',
  ] },
]);
let pdfFontsPromise = null;

function toBase64Font(buffer) {
  const bytes = new Uint8Array(buffer);
  // The endpoint must return an OpenType/TrueType file, not an error page.
  const signature = Array.from(bytes.slice(0, 4));
  const isTtf = signature.length === 4 && signature[0] === 0 && signature[1] === 1 &&
    signature[2] === 0 && signature[3] === 0;
  const isOtf = signature.length === 4 && String.fromCharCode(...signature) === 'OTTO';
  if (!(isTtf || isOtf)) throw new Error('The PDF font source did not return a valid font.');
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

async function loadOnePdfFont(asset) {
  let lastError;
  for (const url of asset.urls) {
    try {
      const response = await fetch(url, { cache: 'force-cache',
        ...(typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? { signal: AbortSignal.timeout(12000) } : {}),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return toBase64Font(await response.arrayBuffer());
    } catch (error) { lastError = error; }
  }
  throw new Error(`Unable to load SiBS HRIS PDF font ${asset.name}: ${lastError?.message || 'network unavailable'}`);
}

async function loadSiBSPdfFonts() {
  if (!pdfFontsPromise) {
    pdfFontsPromise = Promise.all(PDF_FONT_ASSETS.map(async asset =>
      [asset.key, await loadOnePdfFont(asset)]
    )).then(Object.fromEntries).catch(error => {
      pdfFontsPromise = null; // Allow retry after a temporary network failure.
      throw error;
    });
  }
  return pdfFontsPromise;
}

const NAVY = [8, 46, 83];
const ORANGE = [244, 92, 36];
const GREY = [82, 99, 117];
const PALE = [233, 239, 246];

const formatPercent = value => value == null || !Number.isFinite(Number(value))
  ? 'Pending HR review' : `${Number(value).toFixed(2)}%`;
const validPercent = value => value !== null && value !== undefined && value !== '' &&
  Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100;
const formatDate = value => {
  const n = Number(value);
  if (!n) return 'Not recorded';
  const date = new Date(n);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(date);
};
const printable = value => String(value ?? '').replace(/\r\n?/g, '\n')
  .replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[\uD800-\uDFFF]/g, '');
const humanize = key => printable(key).replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/_/g, ' ').replace(/^./, value => value.toUpperCase());
const safeName = value => printable(value || 'Candidate').normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-')
  .replace(/^-+|-+$/g, '').slice(0, 64) || 'Candidate';

/** Mirror the results modal's per-attempt completion calculation. Never use
 * historical fixed totals (e.g. 91) for newly expanded assessment banks.
 */
export function calculateCsrFitPdfCompletion(data) {
  const modules = data?.sevenModule ? MODULES : MODULES.slice(0, 2);
  const items = modules.map(([key, title]) => {
    const records = data?.modules?.[key];
    const reported = data?.answered?.[key];
    const definition = data?.moduleDefinitions?.find?.(item => item.key === key);
    const reportedTotal = reported && typeof reported === 'object' ? Number(reported.total) : NaN;
    const definitionTotal = Number(definition?.count);
    const total = Array.isArray(records) ? records.length
      : Number.isFinite(reportedTotal) && reportedTotal >= 0 ? reportedTotal
      : Number.isFinite(definitionTotal) && definitionTotal >= 0 ? definitionTotal : 0;
    const reportedDone = reported && typeof reported === 'object' ? Number(reported.done) : Number(reported);
    const observedDone = Array.isArray(records)
      ? records.filter(item => Boolean(item.selectedKey)).length : 0;
    const done = Number.isFinite(reportedDone) && reportedDone >= 0 ? reportedDone : observedDone;
    return { key, title, total: Math.max(0, Math.trunc(total)),
      done: Math.min(Math.max(0, Math.trunc(total)), Math.max(0, Math.trunc(done))) };
  });
  return { items, completed: items.reduce((sum, item) => sum + item.done, 0),
    total: items.reduce((sum, item) => sum + item.total, 0) };
}

const ANSWER_LABELS = {
  filename: 'Saved filename', folder: 'Destination folder', customerName: 'Customer full name',
  accountNumber: 'Account number', callbackNumber: 'Callback phone number',
  category: 'Issue category', notes: 'Interaction notes', product: 'Product or service affected',
  issue: 'Reported issue', action: 'Requested action', text: 'Typed passage',
  actions: 'Task activity', simulation: 'Simulated workspace',
};
const answerLabel = key => ANSWER_LABELS[key] || humanize(key);
const printableValue = value => value === null || value === undefined || value === ''
  ? 'Not provided' : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : printable(value);

/** Format actual submitted inputs, never internal JSON or hidden grading keys. */
export function formatCsrFitPdfResponse(response, { moduleKey = '', question = null } = {}) {
  if (response === undefined || response === null || response === '') return ['Not answered / timed out'];
  const optionText = key => {
    const option = question?.options?.find?.(item => String(item.key) === String(key));
    return option ? `Option ${key}: ${printable(option.text)}` : `Option ${printable(key)}`;
  };
  if (Array.isArray(response)) return response.length
    ? response.map(item => typeof item === 'object' && item !== null
      ? Object.entries(item).map(([key, value]) => `${answerLabel(key)}: ${printableValue(value)}`).join('; ')
      : moduleKey === 'module3' ? optionText(item) : printableValue(item))
    : ['None selected'];
  if (typeof response !== 'object') return [printableValue(response)];
  const lines = [];
  const walk = (object, depth = 0) => {
    for (const [key, value] of Object.entries(object)) {
      if (['version', 'startedAtMs', 'simulationVersion'].includes(key) || value === undefined) continue;
      if (key === 'simulation') {
        // Only actual candidate actions, never protocol/version metadata.
        if (Array.isArray(value?.actions)) {
          const actions = value.actions.filter(action => action &&
            ['rename', 'move', 'open_request'].includes(action.type));
          if (actions.length) {
            lines.push('Recorded task actions:');
            actions.forEach((action, index) => {
              const description = action.type === 'rename' ? `Renamed file to ${printableValue(action.filename)}`
                : action.type === 'move' ? `Moved file to ${printableValue(action.folder)}`
                : 'Opened customer request in the simulated inbox';
              lines.push(`  ${index + 1}. ${description}`);
            });
          }
        }
        continue;
      }
      if (value && typeof value === 'object' && !Array.isArray(value) && depth < 3) {
        lines.push(`${answerLabel(key)}:`);
        walk(value, depth + 1);
      } else if (Array.isArray(value)) {
        lines.push(`${answerLabel(key)}: ${value.length ? value.map(item =>
          typeof item === 'object' && item !== null
            ? Object.entries(item).map(([field, entry]) => `${answerLabel(field)} ${printableValue(entry)}`).join('; ')
            : printableValue(item)).join(', ') : 'None recorded'}`);
      } else {
        lines.push(`${depth ? '  ' : ''}${answerLabel(key)}: ${printableValue(value)}`);
      }
    }
  };
  walk(response);
  return lines.length ? lines : ['No saved details recorded'];
}

/**
 * Render the previously saved assessment to a PDF. Optional logoDataUrl allows
 * source-level tests without a browser, and avoids mutating existing call sites.
 */
export function buildCsrFitPdfDocument(data, JsPDF, { logoDataUrl = null, fontData = null } = {}) {
  if (!data?.available || !Array.isArray(data?.modules?.module1) || !data?.submittedAtMs) {
    throw new Error('Only submitted, authorized assessment results can be exported.');
  }

  const pdf = new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
  // Inject the already-fetched fonts into this document. Tests that call the
  // synchronous builder without fontData retain the built-in fallback.
  const hasBrandFonts = Boolean(fontData?.bodyRegular && fontData?.bodyBold && fontData?.headingBold);
  if (hasBrandFonts) {
    for (const asset of PDF_FONT_ASSETS) pdf.addFileToVFS(asset.name, fontData[asset.key]);
    pdf.addFont('PlusJakartaSans-Regular.ttf', PDF_FONT_FAMILIES.body, 'normal');
    pdf.addFont('PlusJakartaSans-Bold.ttf', PDF_FONT_FAMILIES.body, 'bold');
    pdf.addFont('RobotoCondensed-Bold.ttf', PDF_FONT_FAMILIES.heading, 'bold');
  }
  const setBodyFont = (bold = false) =>
    pdf.setFont(hasBrandFonts ? PDF_FONT_FAMILIES.body : 'helvetica', bold ? 'bold' : 'normal');
  const setHeadingFont = () =>
    pdf.setFont(hasBrandFonts ? PDF_FONT_FAMILIES.heading : 'helvetica', 'bold');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 42;
  const bodyWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 58;
  let y = 116;

  function header() {
    // Same navy SiBS logo and tagline used on the Employment Offer document page.
    if (logoDataUrl) {
      try {
        pdf.addImage(logoDataUrl, 'PNG', margin, 9, 157, 72);
      } catch (error) {
        // The report must still render if the logo is unavailable in a test environment.
        setHeadingFont(); pdf.setFontSize(19); pdf.setTextColor(...NAVY);
        pdf.text('SiBS', margin, 48);
      }
    } else {
      setHeadingFont(); pdf.setFontSize(19); pdf.setTextColor(...NAVY);
      pdf.text('SiBS', margin, 48);
    }
    setHeadingFont(); pdf.setFontSize(13); pdf.setTextColor(...NAVY);
    pdf.text('CSR-Fit Assessment Results', pageWidth - margin, 37, { align: 'right' });
    setBodyFont(); pdf.setFontSize(8.3); pdf.setTextColor(...GREY);
    pdf.text('CANDIDATE RESPONSES - CONFIDENTIAL / READ ONLY', pageWidth - margin, 56, { align: 'right' });
    pdf.setFillColor(...ORANGE); pdf.rect(0, 91, pageWidth, 3, 'F');
    pdf.setTextColor(...NAVY);
  }
  function newPage() { pdf.addPage(); header(); y = 116; }
  function ensure(height = 20) { if (y + height > bottomLimit) newPage(); }
  function rule() { ensure(12); pdf.setDrawColor(219, 227, 234); pdf.line(margin, y, pageWidth - margin, y); y += 13; }
  function heading(text, fontSize = 12) {
    setHeadingFont(); pdf.setFontSize(fontSize); pdf.setTextColor(...NAVY);
    const lines = pdf.splitTextToSize(printable(text), bodyWidth);
    const lineHeight = fontSize * 1.25;
    ensure(lines.length * lineHeight + 18);
    for (const line of lines) {
      pdf.text(line, margin, y);
      y += lineHeight;
    }
    y += 10;
  }
  function paragraph(text, { indent = 0, bold = false, color = GREY, fontSize = 9, after = 5 } = {}) {
    setBodyFont(bold); pdf.setFontSize(fontSize); pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(printable(text), bodyWidth - indent);
    const lineHeight = fontSize * 1.43;
    for (const line of lines) { ensure(lineHeight); pdf.text(line, margin + indent, y); y += lineHeight; }
    y += after;
  }
  function labelValue(label, value) {
    paragraph(`${label}: ${printable(value)}`, { fontSize: 9, after: 3 });
  }

  // Only the values in the Assessment Record are bold; their field labels
  // remain regular. Other result and response sections retain their fonts.
  function assessmentRecordValue(label, value) {
    const labelText = `${label}: `;
    const valueText = printable(value);
    const fontSize = 9;
    const lineHeight = fontSize * 1.43;
    setBodyFont(false);
    pdf.setFontSize(fontSize);
    const labelWidth = pdf.getTextWidth(labelText);
    setBodyFont(true);
    const lines = pdf.splitTextToSize(valueText, Math.max(80, bodyWidth - labelWidth));
    ensure(lines.length * lineHeight + 3);
    lines.forEach((line, index) => {
      pdf.setFontSize(fontSize);
      pdf.setTextColor(...GREY);
      if (index === 0) {
        setBodyFont(false);
        pdf.text(labelText, margin, y);
      }
      setBodyFont(true);
      pdf.text(line, margin + (index === 0 ? labelWidth : 0), y);
      y += lineHeight;
    });
    y += 3;
  }

  /** Draw a visually separated score card so each label clearly belongs to its own bar. */
  function scoreBar(label, value, { note = '', accent = NAVY } = {}) {
    setBodyFont(); pdf.setFontSize(9.1);
    const labelLines = pdf.splitTextToSize(printable(label), bodyWidth - 118);
    const labelHeight = Math.max(12, labelLines.length * 13.2);
    const noteHeight = note ? 17 : 0;
    const cardHeight = 22 + labelHeight + 13 + 11 + 15 + noteHeight;
    const cardGap = 15;
    ensure(cardHeight + cardGap);
    const cardY = y;
    pdf.setDrawColor(219, 227, 234);
    pdf.setFillColor(249, 251, 253);
    pdf.roundedRect(margin, cardY, bodyWidth, cardHeight, 7, 7, 'FD');
    const left = margin + 13;
    const right = pageWidth - margin - 13;
    const innerWidth = bodyWidth - 26;
    setBodyFont(); pdf.setFontSize(9.1); pdf.setTextColor(...NAVY);
    pdf.text(labelLines, left, cardY + 20);
    const isKnown = validPercent(value);
    setBodyFont(true); pdf.setFontSize(10.1);
    pdf.setTextColor(...(isKnown ? NAVY : GREY));
    pdf.text(isKnown ? formatPercent(value) : 'Pending', right, cardY + 20, { align: 'right' });
    const barY = cardY + 20 + labelHeight + 10;
    pdf.setFillColor(...PALE);
    pdf.roundedRect(left, barY, innerWidth, 11, 5, 5, 'F');
    if (isKnown && Number(value) > 0) {
      const fillWidth = innerWidth * Number(value) / 100;
      pdf.setFillColor(...accent);
      if (fillWidth >= 11) pdf.roundedRect(left, barY, fillWidth, 11, 5, 5, 'F');
      else pdf.rect(left, barY, fillWidth, 11, 'F');
    }
    if (note) {
      setBodyFont(); pdf.setFontSize(7.8); pdf.setTextColor(...GREY);
      pdf.text(pdf.splitTextToSize(printable(note), innerWidth), left, barY + 26);
    }
    y += cardHeight + cardGap;
  }

  // The typing metrics use their own units and benchmark marker, not percent
  // scores. The card layout deliberately mirrors the score charts above.
  function typingBar(label, value, { max, unit, target }) {
    const n = Number(value);
    const known = value !== null && value !== undefined && value !== '' && Number.isFinite(n) && n >= 0;
    const height = 91;
    const gap = 16;
    ensure(height + gap);
    const cardY = y;
    const left = margin + 13;
    const right = pageWidth - margin - 13;
    const innerWidth = bodyWidth - 26;
    pdf.setDrawColor(219, 227, 234);
    pdf.setFillColor(249, 251, 253);
    pdf.roundedRect(margin, cardY, bodyWidth, height, 7, 7, 'FD');
    setBodyFont(); pdf.setFontSize(9.2); pdf.setTextColor(...NAVY);
    pdf.text(label, left, cardY + 20);
    setBodyFont(true); pdf.setFontSize(10.2);
    pdf.text(known ? `${n.toFixed(1)} ${unit}` : 'Not recorded', right, cardY + 20, { align: 'right' });
    const barY = cardY + 39;
    pdf.setFillColor(...PALE); pdf.roundedRect(left, barY, innerWidth, 11, 5, 5, 'F');
    if (known && n > 0) {
      const width = Math.min(1, n / max) * innerWidth;
      pdf.setFillColor(...NAVY);
      if (width >= 11) pdf.roundedRect(left, barY, width, 11, 5, 5, 'F');
      else pdf.rect(left, barY, width, 11, 'F');
    }
    const markX = left + Math.min(1, target / max) * innerWidth;
    pdf.setDrawColor(...ORANGE); pdf.setLineWidth(1.4);
    pdf.line(markX, barY - 4, markX, barY + 15); pdf.setLineWidth(0.2);
    setBodyFont(); pdf.setFontSize(8); pdf.setTextColor(...GREY);
    pdf.text(`Benchmark: ${target} ${unit}  |  Orange line marks the target`, left, cardY + 74);
    y += height + gap;
  }

  // All seven module completion charts must fit on the SAME page as the
  // assessment-activity charts, even when module names wrap to two lines.
  // This section is given a dedicated page below; keep each row compact while
  // retaining distinct labels, counts and bars (these are not assessment scores).
  function moduleCompletionBar(moduleIndex, moduleTitle, done, total) {
    const known = Number.isFinite(done) && Number.isFinite(total) && total > 0;
    const ratio = known ? Math.max(0, Math.min(1, done / total)) : null;
    const cardHeight = 53;
    const gap = 5;
    ensure(cardHeight + gap);
    const left = margin + 11;
    const innerWidth = bodyWidth - 22;
    const top = y;
    pdf.setFillColor(249, 251, 253);
    pdf.setDrawColor(219, 227, 234);
    pdf.roundedRect(margin, top, bodyWidth, cardHeight, 6, 6, 'FD');
    setBodyFont(); pdf.setFontSize(8.5); pdf.setTextColor(...NAVY);
    const fullLabel = `Module ${moduleIndex} - ${moduleTitle}`;
    const label = pdf.splitTextToSize(fullLabel, innerWidth - 112);
    pdf.text(label, left, top + 16);
    setBodyFont(true); pdf.setFontSize(8.6);
    pdf.text(known ? `${done} / ${total} saved` : 'Not recorded', pageWidth - margin - 11, top + 16, {align:'right'});
    // Leave room for two-line module names without crowding the completion bar.
    const barY = top + 35;
    pdf.setFillColor(...PALE);
    pdf.roundedRect(left, barY, innerWidth, 8, 4, 4, 'F');
    if (ratio !== null && ratio > 0) {
      const fillWidth = innerWidth * ratio;
      pdf.setFillColor(...NAVY);
      if (fillWidth >= 8) pdf.roundedRect(left, barY, fillWidth, 8, 4, 4, 'F');
      else pdf.rect(left, barY, fillWidth, 8, 'F');
    }
    y += cardHeight + gap;
  }

  function assessmentActivityGraphs(events, timedOut) {
    const gap = 13;
    const width = (bodyWidth - gap) / 2;
    const height = 98;
    ensure(height + 22);
    const cards = [
      {label:'Recorded integrity events',count:events,max:Math.max(5,Math.ceil(events / 5) * 5),note:'Raw count, not a score'},
      {label:'Timed-out modules',count:timedOut,max:7,note:'Out of seven modules'},
    ];
    cards.forEach((card,index) => {
      const x = margin + index * (width + gap);
      const inset = 11;
      const w = width - inset * 2;
      pdf.setDrawColor(219, 227, 234);
      pdf.setFillColor(249, 251, 253);
      pdf.roundedRect(x, y, width, height, 6, 6, 'FD');
      setBodyFont();pdf.setFontSize(8.7);pdf.setTextColor(...NAVY);
      pdf.text(card.label, x + inset, y + 18);
      setBodyFont(true);pdf.setFontSize(10.2);
      pdf.text(String(card.count), x + width - inset, y + 18, {align:'right'});
      const barY = y + 37;
      pdf.setFillColor(...PALE);pdf.roundedRect(x+inset,barY,w,10,4,4,'F');
      if (card.count > 0) {
        const fillWidth = w * Math.min(1,card.count / card.max);
        pdf.setFillColor(...ORANGE);
        if (fillWidth >= 10) pdf.roundedRect(x+inset,barY,fillWidth,10,4,4,'F');
        else pdf.rect(x+inset,barY,fillWidth,10,'F');
      }
      setBodyFont();pdf.setFontSize(7.8);pdf.setTextColor(...GREY);
      pdf.text(`Scale: 0-${card.max}`,x+inset,y+65);
      pdf.text(card.note,x+inset,y+79);
    });
    y += height + 16;
  }

  pdf.setProperties({ title: 'SiBS CSR-Fit Candidate Assessment Responses',
    subject: 'Confidential read-only candidate assessment record', author: 'SiBS HRIS' });
  header();
  heading('Assessment record');
  assessmentRecordValue('Candidate', data.candidate?.name || 'Candidate');
  assessmentRecordValue('Candidate ID', data.candidate?.candidateId || 'Not available');
  assessmentRecordValue('Applied position', data.candidate?.role || 'Not available');
  assessmentRecordValue('Attempt ID', data.attemptId || 'Not available');
  assessmentRecordValue('Bank version', data.bankVersion || 'Not available');
  assessmentRecordValue('Started', formatDate(data.startedAtMs));
  assessmentRecordValue('Submitted', formatDate(data.submittedAtMs));
  rule();

  heading('Assessment score overview', 13);
  scoreBar(`${MODULES[1][1]} (provisional)`, data.score?.behavioralComposite);
  scoreBar(`${MODULES[6][1]} (provisional)`, data.sevenModule ? data.score?.module7Score : null,
    { accent: ORANGE });
  paragraph(`${MODULES[0][1]}: Pending approved answer key / HR review.`,
    { color: GREY, fontSize: 9, after: 9 });
  paragraph('Scores shown here are provisional, not a final hiring recommendation or pass/fail result. The report never discloses assessment answer keys.',
    { color: ORANGE, fontSize: 8.6, after: 10 });

  // This is completion, NEVER a skill grade; its count must match the screen.
  const completion = calculateCsrFitPdfCompletion(data);
  const completionKnown = completion.total > 0;
  const completionRatio = completionKnown ? Math.min(1, completion.completed / completion.total) : 0;
  ensure(94);
  const completedAtY = y;
  const completionInset = margin + 13;
  const completionWidth = bodyWidth - 26;
  pdf.setFillColor(249, 251, 253);
  pdf.setDrawColor(219, 227, 234);
  pdf.roundedRect(margin, completedAtY, bodyWidth, 80, 7, 7, 'FD');
  setBodyFont(true); pdf.setTextColor(...NAVY); pdf.setFontSize(9.7);
  pdf.text('Assessment completion', completionInset, completedAtY + 19);
  pdf.text(completionKnown ? `${completion.completed} / ${completion.total} items` : 'Not available',
    pageWidth - margin - 13, completedAtY + 19, { align: 'right' });
  pdf.setFillColor(...PALE);
  pdf.roundedRect(completionInset, completedAtY + 33, completionWidth, 10, 5, 5, 'F');
  if (completionKnown && completionRatio > 0) {
    pdf.setFillColor(...NAVY);
    const fill = completionWidth * completionRatio;
    if (fill >= 10) pdf.roundedRect(completionInset, completedAtY + 33, fill, 10, 5, 5, 'F');
    else pdf.rect(completionInset, completedAtY + 33, fill, 10, 'F');
  }
  setBodyFont(); pdf.setFontSize(8.1); pdf.setTextColor(...GREY);
  pdf.text('Saved assessment items - completion only, not a grade', completionInset, completedAtY + 60);
  y += 91;

  if (Array.isArray(data.score?.behavioralPillars) && data.score.behavioralPillars.length) {
    newPage();
    heading('Behavioral competency scores', 13);
    paragraph('Each score is paired with its own clearly separated graph.', { fontSize: 8.3, after: 13 });
    for (const pillar of data.score.behavioralPillars) {
      const itemCount = pillar.items == null ? '' : ` (${pillar.items} scored items)`;
      scoreBar(`${pillar.name}${itemCount}`, pillar.score);
    }
  }

  if (data.sevenModule) {
    newPage();
    heading('Typing & assessment metrics', 13);
    const typingMetrics = Array.isArray(data.objective?.module5) ? data.objective.module5 : [];
    if (typingMetrics.length) {
      const wpms = typingMetrics.map(entry => Number(entry?.wpm)).filter(n => Number.isFinite(n) && n >= 0);
      const wpmMax = Math.max(60, 10 * Math.ceil(Math.max(40, ...wpms) / 10));
      typingMetrics.forEach((entry, index) => {
        heading(`Typing passage ${index + 1}`, 11);
        typingBar('Typing speed', entry.wpm, { max: wpmMax, unit: 'WPM', target: 40 });
        typingBar('Typing accuracy', entry.accuracy, { max: 100, unit: '%', target: 90 });
      });
    } else {
      paragraph('No typing measurements were recorded.');
    }
    // Keep activity counts and the seven completion charts together on one
    // dedicated page, separate from the typing speed / accuracy charts.
    newPage();
    heading('Assessment activity', 13);
    const integrityEvents = Math.max(0, Number(data.integrityEvents) || 0);
    const timedOutModules = Array.isArray(data.timedOutModules) ? data.timedOutModules : [];
    assessmentActivityGraphs(integrityEvents, timedOutModules.length);
    paragraph(`Timed-out module IDs: ${timedOutModules.join(', ') || 'None'}. Integrity events are recorded activity, not an automatic hiring or pass/fail decision.`,
      { color: GREY, fontSize: 8.3, after: 12 });
    heading('Assessment module completion', 13);
    paragraph('The following bars indicate saved items, not skill scores or pass/fail results.',
      { color: GREY, fontSize: 8.3, after: 13 });
    completion.items.forEach(({ title, done, total }, index) => {
      moduleCompletionBar(index + 1, title, done, total);
    });
  }

  // Existing read-only answer pages are intentionally preserved.
  const availableModules = data.sevenModule ? MODULES : MODULES.slice(0, 2);
  for (const [key, label] of availableModules) {
    newPage();
    heading(`${key.replace('module', 'Module ')}  |  ${label}`, 13);
    const questions = Array.isArray(data.modules?.[key]) ? data.modules[key] : [];
    const itemCompletion = completion.items.find(item => item.key === key);
    const completed = itemCompletion ? `${itemCompletion.done}/${itemCompletion.total}` : `0/${questions.length}`;
    paragraph(`Completed: ${completed}  |  Displayed in the candidate's saved question order`,
      { fontSize: 9, after: 13 });
    for (const q of questions) {
      ensure(52);
      paragraph(`ITEM ${q.number}  |  ${q.category || 'Assessment question'}${q.bankQuestionId ? `  |  Bank ID ${q.bankQuestionId}` : ''}`,
        { fontSize: 8, bold: true, color: ORANGE, after: 4 });
      paragraph(q.stem || 'Assessment task', { fontSize: 10, bold: true, color: NAVY, after: 7 });
      if (Array.isArray(q.options) && q.options.length) {
        q.options.forEach(option => {
          const chosen = option.key === q.selectedKey ||
            (Array.isArray(q.recordedResponse) && q.recordedResponse.includes(option.key));
          paragraph(`${chosen ? '[SELECTED] ' : ''}${option.key}. ${option.text}`,
            { indent: 10, fontSize: 9, bold: Boolean(chosen), color: chosen ? NAVY : GREY, after: 2 });
        });
      }
      if (q.recordedResponse !== undefined && q.recordedResponse !== null) {
        paragraph('Saved candidate response:', { fontSize: 9, color: NAVY, bold: true, after: 3 });
        formatCsrFitPdfResponse(q.recordedResponse, { moduleKey: key, question: q })
          .forEach(line => paragraph(line, { indent: 10, fontSize: 9, after: 2 }));
      } else if (!q.selectedKey) {
        paragraph('No answer saved (unanswered or timed out)', { fontSize: 9, color: ORANGE, after: 3 });
      }
      y += 8; rule();
    }
    if (!questions.length) paragraph('No saved items are available for this module.');
  }

  const total = pdf.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    pdf.setPage(page); pdf.setDrawColor(219, 227, 234);
    pdf.line(margin, pageHeight - 41, pageWidth - margin, pageHeight - 41);
    setBodyFont(); pdf.setFontSize(8); pdf.setTextColor(...GREY);
    pdf.text('SiBS HRIS  |  Confidential candidate record  |  For authorized HR review only', margin, pageHeight - 28);
    pdf.text(`Page ${page} of ${total}`, pageWidth - margin, pageHeight - 28, { align: 'right' });
  }
  return pdf;
}

/** Turn the already-hosted Employment Offer logo asset into a jsPDF-compatible data URL. */
async function loadSiBSLogoDataUrl() {
  const response = await fetch(LOGO_URL);
  if (!response.ok) throw new Error('Could not load the SiBS logo for the PDF.');
  const imageBlob = await response.blob();
  if (!imageBlob.type.startsWith('image/')) throw new Error('The SiBS logo response is not an image.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read the SiBS logo.'));
    reader.readAsDataURL(imageBlob);
  });
}

export async function downloadCsrFitAssessmentPdf(data) {
  // Existing project dependency; load only when an authorized HR user exports.
  const [{ jsPDF }, logoDataUrl, fontData] = await Promise.all([
    import('jspdf'),
    loadSiBSLogoDataUrl(),
    loadSiBSPdfFonts(),
  ]);
  const doc = buildCsrFitPdfDocument(data, jsPDF, { logoDataUrl, fontData });
  const filename = `SiBS-CSR-Fit-${safeName(data.candidate?.name)}-${safeName(data.attemptId)}.pdf`;
  doc.save(filename);
  return filename;
}

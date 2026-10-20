/**
 * Pure, read-only CSV parser for the exact bytes returned by the authenticated
 * Chat attachment download endpoint. Do not allow HTML from CSV into the DOM.
 * Keep IDs, leading zeroes and invalid dates as their original strings.
 */
export const CHAT_CSV_MAX_ROWS = 200;
export const CHAT_CSV_MAX_COLUMNS = 25;
const CHAT_CSV_MAX_CHARACTERS = 1_000_000;

function inferCsvDelimiter(input) {
  const candidates = [",", ";", "\t", "|"];
  const counts = Object.fromEntries(candidates.map((c) => [c, 0]));
  let quoted = false;
  let started = false;
  for (let i = 0; i < Math.min(input.length, 32768); i += 1) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { i += 1; continue; }
      quoted = !quoted;
    } else if (!quoted && (char === '\r' || char === '\n')) {
      if (started) break;
      if (char === '\r' && input[i + 1] === '\n') i += 1;
    } else if (!quoted) {
      if (candidates.includes(char)) counts[char] += 1;
      if (char.trim()) started = true;
    }
  }
  const best = candidates.reduce((winner, value) => counts[value] > counts[winner] ? value : winner, ",");
  return counts[best] > 0 ? best : ",";
}

export function parseChatCsvText(source) {
  const raw = String(source ?? "").replace(/^\uFEFF/, "");
  const directive = /^sep=([,;\t|])(?:\r\n|\r|\n)/i.exec(raw);
  const input = directive ? raw.slice(directive[0].length) : raw;
  const delimiter = directive?.[1] || inferCsvDelimiter(input);
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  let started = false;
  let columnOverflow = false;
  const limit = Math.min(input.length, CHAT_CSV_MAX_CHARACTERS);

  const pushCell = () => {
    if (row.length < CHAT_CSV_MAX_COLUMNS) row.push(cell);
    else columnOverflow = true;
    cell = "";
  };
  const pushRow = () => {
    pushCell();
    if (started || row.some((value) => value.trim())) rows.push(row);
    row = [];
    started = false;
  };
  let index = 0;
  for (; index < limit && rows.length < CHAT_CSV_MAX_ROWS; index += 1) {
    const char = input[index];
    if (char === '"') {
      if (quoted && input[index + 1] === '"') {
        if (cell.length < 16000) cell += '"';
        index += 1;
      } else if (quoted || !cell.trim()) {
        quoted = !quoted;
      } else {
        if (cell.length < 16000) cell += char;
      }
      started = true;
    } else if (!quoted && char === delimiter) {
      pushCell();
      started = true;
    } else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && input[index + 1] === '\n') index += 1;
      pushRow();
    } else {
      if (cell.length < 16000) cell += char;
      if (char.trim()) started = true;
    }
  }
  if (rows.length < CHAT_CSV_MAX_ROWS && (started || row.length || cell)) pushRow();
  while (rows.length && rows[rows.length - 1].every((v) => !v.trim())) rows.pop();
  const hasValues = rows.some((r) => r.some((v) => v.trim()));
  const columnCount = Math.min(CHAT_CSV_MAX_COLUMNS, Math.max(0, ...rows.map((r) => r.length)));
  return {
    rows: hasValues ? rows : [], columnCount,
    truncated: index < input.length || columnOverflow,
    malformed: quoted,
    delimiter,
  };
}

/**
 * Decode original chat CSV bytes without changing them.
 * Excel's "Unicode Text"/CSV exports may use UTF-16LE (sometimes without a BOM),
 * and regional Excel installations may emit Windows-1252. A strict UTF-8-only
 * check would incorrectly treat the alternating NUL bytes of UTF-16 as binary.
 *
 * This is also used by upload validation, so reject controls, broken Unicode,
 * and non-CSV-shaped legacy-byte payloads rather than accepting arbitrary binary.
 */
export function decodeChatCsvBytes(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  if (!bytes.length) throw new Error("The CSV file is empty.");

  const startsWith = (...prefix) => prefix.every((byte, index) => bytes[index] === byte);
  const hasUtf8Bom = startsWith(0xef, 0xbb, 0xbf);
  const hasUtf16LeBom = startsWith(0xff, 0xfe);
  const hasUtf16BeBom = startsWith(0xfe, 0xff);

  // Detect BOM-less UTF-16 only if most ASCII-range code units have NUL high bytes.
  // A random binary file containing a few NULs must not pass this test.
  const sampleSize = Math.min(bytes.length, 8192) & ~1;
  let oddNuls = 0;
  let evenNuls = 0;
  for (let index = 0; index < sampleSize; index += 2) {
    if (bytes[index] === 0) evenNuls += 1;
    if (bytes[index + 1] === 0) oddNuls += 1;
  }
  const pairs = sampleSize / 2;
  const isLikelyUtf16Le = pairs >= 6 && oddNuls / pairs > 0.35 && evenNuls / pairs < 0.06;
  const isLikelyUtf16Be = pairs >= 6 && evenNuls / pairs > 0.35 && oddNuls / pairs < 0.06;

  let encoding = "utf-8";
  if (hasUtf16LeBom || (!hasUtf16BeBom && isLikelyUtf16Le)) encoding = "utf-16le";
  else if (hasUtf16BeBom || isLikelyUtf16Be) encoding = "utf-16be";

  let text;
  try {
    text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
  } catch (error) {
    if (encoding !== "utf-8" || hasUtf8Bom) {
      throw new Error("The CSV file has an invalid text encoding.");
    }
    // Legacy ANSI CSV exported by Excel in Windows locales.
    encoding = "windows-1252";
    try {
      text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
    } catch {
      throw new Error("The CSV file has an invalid text encoding.");
    }
  }

  text = text.replace(/^\uFEFF/, "");
  // A file server can return a buffer of zeroes with the correct byte length.
  // Report that as damaged storage, not an invalid CSV or an encoding problem.
  const zeroCount = bytes.reduce((count, byte) => count + (byte === 0 ? 1 : 0), 0);
  if (zeroCount > bytes.length * 0.3 && encoding !== "utf-16le" && encoding !== "utf-16be") {
    throw new Error("The stored CSV appears damaged on the file server. Re-upload the original CSV file.");
  }
  if (!text.trim()) throw new Error("The CSV file contains no readable text.");
  // Reject C0/C1 controls (except TAB/CR/LF), undecodable characters and
  // unpaired surrogates. Legitimate Unicode names and accented text are allowed.
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\ufffd]/u.test(text) ||
      /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/u.test(text)) {
    throw new Error("The CSV file contains unsupported binary or control characters.");
  }
  // Since Windows-1252 can decode most byte values, require at least basic CSV
  // structure in this fallback path instead of accepting arbitrary byte blobs.
  if (encoding === "windows-1252" && !/[\r\n]/.test(text)) {
    throw new Error("The CSV file is not recognizable as text rows.");
  }
  return text;
}

export function parseChatCsvBytes(bytes) {
  if (!(bytes instanceof ArrayBuffer) && !(bytes instanceof Uint8Array)) {
    throw new Error("The attachment did not return CSV file bytes.");
  }
  const payload = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (!payload.length) throw new Error("The stored CSV file is empty.");
  const text = decodeChatCsvBytes(payload);
  const result = parseChatCsvText(text);
  if (!result.rows.length) throw new Error("The stored CSV has no readable rows. Download it to verify the original data.");
  return result;
}

export function chatCsvColumnLabel(index) {
  let n = index + 1;
  let name = "";
  while (n) {
    n -= 1;
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26);
  }
  return name;
}

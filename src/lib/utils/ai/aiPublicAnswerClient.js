/** Display-only filter for Ask SiBS AI, including older chat messages. */
function isSourceLabel(text) {
  const normalized = String(text || "")
    .replace(/^\s*(?:>\s*|[-*•]\s*|\d+[.)]\s*)+/g, "")
    .replace(/\*\*|__/g, "")
    .replace(/^#+\s*/, "")
    .trim();
  return /^(?:sources?|data sources?|database sources?|database tables?|source tables?|source tools?|technical sources?|query sources?)\s*(?::|[—–-]|$)/i.test(normalized);
}

export function toPublicAiAnswerClient(value) {
  if (typeof value !== "string") return value;
  const output = [];
  let skippingSourceSection = false;
  for (const line of value.replace(/\r\n?/g, "\n").split("\n")) {
    if (isSourceLabel(line)) {
      skippingSourceSection = /^\s*(?:[#*\s]|[-•])*(?:sources?|data sources?|database sources?|database tables?|source tables?|source tools?|technical sources?|query sources?)\s*:?\s*\**\s*$/i.test(line);
      continue;
    }
    if (skippingSourceSection) {
      if (!line.trim()) { skippingSourceSection = false; output.push(""); continue; }
      if (/^\s*(?:[-*•]\s+|\d+[.)]\s+|`|https?:\/\/)/i.test(line)) continue;
      skippingSourceSection = false;
    }
    const withoutFooter = line.replace(/\s+\(?\s*(?:\*\*)?Sources?(?:\*\*)?\s*:\s*.*$/i, "").trimEnd();
    if (/\b(?:gy_[a-z0-9_]+|kronos_testdb|hris_db)\b/i.test(withoutFooter) &&
        /\b(?:source|database|table|column|query|fetched from|retrieved from|stored in)\b/i.test(withoutFooter)) continue;
    output.push(withoutFooter);
  }
  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim()
    .replace(/(?<![\d.])1(?:\.0+)?\s+days\b/gi, (match) => match.replace(/days$/i, "Day"));
}

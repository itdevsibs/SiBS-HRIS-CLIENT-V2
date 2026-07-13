export function normalizeAiList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|•|-/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function cleanAiJsonText(value) {
  let text = String(value || "").trim();

  text = text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  return text.trim();
}

export function isWeakAiText(value) {
  const text = String(value || "").trim().toLowerCase();

  const weakValues = [
    "",
    "{",
    "}",
    "{}",
    "[]",
    "here",
    "ok",
    "okay",
    "done",
    "sure",
    "ready",
    "ai insight generated successfully.",
  ];

  return weakValues.includes(text) || text.length < 20;
}

export function parseAiResponsePayload(payload) {
  const rawInsight =
    payload?.insight ||
    payload?.answer ||
    payload?.response ||
    payload?.data?.insight ||
    payload?.data?.answer ||
    payload?.data?.response ||
    payload?.raw?.insight ||
    payload?.raw?.answer ||
    payload?.raw?.response ||
    "";

  let parsed = null;

  if (typeof rawInsight === "string") {
    const cleaned = cleanAiJsonText(rawInsight);

    if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = null;
      }
    }
  } else if (rawInsight && typeof rawInsight === "object") {
    parsed = rawInsight;
  }

  const source = parsed || payload || {};

  const insight =
    source?.insight ||
    source?.summary ||
    source?.answer ||
    source?.response ||
    payload?.data?.insight ||
    payload?.data?.answer ||
    payload?.data?.response ||
    payload?.raw?.insight ||
    payload?.raw?.answer ||
    payload?.raw?.response ||
    "";

  return {
    insight: isWeakAiText(insight)
      ? "The AI returned an incomplete response. Please regenerate the insight."
      : insight,

    highlights: normalizeAiList(
      source?.highlights ||
        source?.keyHighlights ||
        payload?.highlights ||
        payload?.data?.highlights ||
        payload?.raw?.highlights ||
        [],
    ),

    recommendations: normalizeAiList(
      source?.recommendations ||
        source?.recommendedActions ||
        source?.actions ||
        payload?.recommendations ||
        payload?.data?.recommendations ||
        payload?.raw?.recommendations ||
        [],
    ),

    risks: normalizeAiList(
      source?.risks ||
        source?.keyRisks ||
        payload?.risks ||
        payload?.data?.risks ||
        payload?.raw?.risks ||
        [],
    ),
  };
}

export function parseAiDisplayBlocks(value) {
  const rawText = String(value || "").trim();

  if (!rawText) return [];

  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const sections = normalized
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);

  const blocks = [];

  sections.forEach((section) => {
    const lines = section
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    let paragraph = [];
    let expectedNumber = 1;

    function flushParagraph() {
      if (!paragraph.length) return;

      blocks.push({
        type: "paragraph",
        text: paragraph.join(" "),
      });

      paragraph = [];
    }

    lines.forEach((line) => {
      const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
      const bulletMatch = line.match(/^[-•]\s+(.+)$/);

      if (numberedMatch) {
        const itemNumber = Number(numberedMatch[1]);
        const itemText = numberedMatch[2];
        const isRealNumberedList =
          itemNumber === expectedNumber && itemNumber >= 1 && itemNumber <= 20;

        if (isRealNumberedList) {
          flushParagraph();

          blocks.push({
            type: "numbered",
            number: numberedMatch[1],
            text: itemText,
          });

          expectedNumber += 1;
          return;
        }

        paragraph.push(line);
        return;
      }

      if (bulletMatch) {
        const bulletText = bulletMatch[1];
        const startsWithNumericFragment = /^\d+([.,]|$)/.test(bulletText);

        if (startsWithNumericFragment) {
          paragraph.push(bulletText);
          return;
        }

        flushParagraph();

        blocks.push({
          type: "bullet",
          text: bulletText,
        });

        return;
      }

      paragraph.push(line);
    });

    flushParagraph();
  });

  return blocks.length
    ? blocks
    : [
        {
          type: "paragraph",
          text: normalized,
        },
      ];
}

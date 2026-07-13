import {
  getChildText,
  parseDetailContent,
} from "./documentText";

export function normalizeSelectedPhrase(value = "") {
  return String(value || "")
    .trim()
    .replace(/^\d+\.\d+(?:[.)])?\s*/, "")
    .replace(/^[-•*]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^[a-zA-Z][.)]\s*/, "")
    .replace(/\s+/g, " ");
}

export function buildNormalizedTextMap(value = "") {
  const original = String(value || "");
  let normalized = "";
  const map = [];
  let lastWasSpace = false;

  for (let index = 0; index < original.length; index += 1) {
    const char = original[index];

    if (/\s/.test(char)) {
      if (!lastWasSpace && normalized.length > 0) {
        normalized += " ";
        map.push(index);
        lastWasSpace = true;
      }

      continue;
    }

    normalized += char.toLowerCase();
    map.push(index);
    lastWasSpace = false;
  }

  return {
    normalized: normalized.trim(),
    map,
  };
}

export function findSelectedPhraseRange(text = "", selectedText = "") {
  const sourceText = String(text || "");
  const cleanSelectedText = normalizeSelectedPhrase(selectedText);

  if (!sourceText.trim() || !cleanSelectedText.trim()) return null;

  const directIndex = sourceText
    .toLowerCase()
    .indexOf(cleanSelectedText.toLowerCase());

  if (directIndex >= 0) {
    return {
      start: directIndex,
      end: directIndex + cleanSelectedText.length,
    };
  }

  const source = buildNormalizedTextMap(sourceText);
  const selected = buildNormalizedTextMap(cleanSelectedText);

  if (!source.normalized || !selected.normalized) return null;

  const normalizedIndex = source.normalized.indexOf(selected.normalized);

  if (normalizedIndex < 0) return null;

  const start = source.map[normalizedIndex];
  const endMapIndex = normalizedIndex + selected.normalized.length - 1;
  const end = Number(source.map[endMapIndex] ?? start) + 1;

  return {
    start,
    end,
  };
}

export function getSelectedTextCandidatePhrases(selectedText = "") {
  const rawSelectedText = String(selectedText || "").trim();

  if (!rawSelectedText) return [];

  const phrases = [];

  const pushPhrase = (value = "") => {
    const cleanValue = normalizeSelectedPhrase(value);

    if (!cleanValue) return;

    const alreadyExists = phrases.some(
      (phrase) =>
        phrase.toLowerCase().replace(/\s+/g, " ").trim() ===
        cleanValue.toLowerCase().replace(/\s+/g, " ").trim(),
    );

    if (!alreadyExists) {
      phrases.push(cleanValue);
    }
  };

  pushPhrase(rawSelectedText);

  const blocks = parseDetailContent(rawSelectedText);

  blocks.forEach((block) => {
    if (block.type === "paragraph") {
      pushPhrase(block.text);
      return;
    }

    if (block.type === "list") {
      block.items.forEach((item) => {
        pushPhrase(item.text);

        if (Array.isArray(item.children)) {
          item.children.forEach((child) => pushPhrase(getChildText(child)));
        }
      });
    }
  });

  return phrases.sort((a, b) => b.length - a.length);
}

export function getInlineCommentMatches(text = "", comments = []) {
  const matches = comments
    .flatMap((comment) => {
      const selectedText = comment.selectedText || comment.selected_text || "";
      const candidatePhrases = getSelectedTextCandidatePhrases(selectedText);

      return candidatePhrases
        .map((phrase) => {
          const range = findSelectedPhraseRange(text, phrase);

          if (!range) return null;

          return {
            comment,
            phrase,
            start: range.start,
            end: range.end,
          };
        })
        .filter(Boolean);
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const nonOverlappingMatches = [];
  let cursor = 0;

  matches.forEach((match) => {
    if (match.start < cursor) return;

    nonOverlappingMatches.push(match);
    cursor = match.end;
  });

  return nonOverlappingMatches;
}

export function getBlockTextUnits(block = {}) {
  if (block.type === "paragraph") {
    return [
      {
        key: "paragraph",
        text: block.text || "",
      },
    ];
  }

  if (block.type !== "list") return [];

  return block.items.flatMap((listItem, listIndex) => {
    const units = [
      {
        key: `item-${listIndex}`,
        text: listItem.text || "",
      },
    ];

    if (Array.isArray(listItem.children)) {
      listItem.children.forEach((child, childIndex) => {
        units.push({
          key: `child-${listIndex}-${childIndex}`,
          text: getChildText(child),
        });
      });
    }

    return units;
  });
}

export function getCommentStableKey(comment = {}) {
  return String(
    comment.id ||
      `${comment.sectionKey || ""}-${comment.selectedText || ""}-${
        comment.comment || ""
      }`,
  );
}

export function getFirstMatchedUnitKey(block = {}, comment = {}) {
  const units = getBlockTextUnits(block);

  for (const unit of units) {
    const hasMatch = getInlineCommentMatches(unit.text, [comment]).length > 0;

    if (hasMatch) {
      return unit.key;
    }
  }

  return "";
}

export function getLastMatchedUnitKey(block = {}, comment = {}) {
  const units = getBlockTextUnits(block);
  let lastKey = "";

  units.forEach((unit) => {
    const hasMatch = getInlineCommentMatches(unit.text, [comment]).length > 0;

    if (hasMatch) {
      lastKey = unit.key;
    }
  });

  return lastKey;
}

export function getCommentsForTextUnit(text = "", comments = []) {
  const matches = getInlineCommentMatches(text, comments);

  const uniqueComments = [];

  matches.forEach((match) => {
    const exists = uniqueComments.some(
      (comment) =>
        String(comment.id || "") === String(match.comment.id || "") &&
        String(comment.comment || "") === String(match.comment.comment || "") &&
        String(comment.selectedText || "") ===
          String(match.comment.selectedText || ""),
    );

    if (!exists) {
      uniqueComments.push(match.comment);
    }
  });

  return uniqueComments;
}

export function getCommentUniqueKey(comment = {}, fallback = "") {
  return String(
    comment.id ||
      `${comment.sectionKey || ""}-${comment.selectedText || ""}-${
        comment.comment || ""
      }-${fallback}`,
  );
}

export function doesCommentMatchText(text = "", comment = {}) {
  return getInlineCommentMatches(text, [comment]).length > 0;
}

export function doesCommentMatchAnyRenderedBlock(value = "", comment = {}) {
  const blocks = parseDetailContent(value);

  return blocks.some((block) => {
    if (block.type === "paragraph") {
      return doesCommentMatchText(block.text, comment);
    }

    if (block.type === "list") {
      return block.items.some((listItem) => {
        const parentMatches = doesCommentMatchText(listItem.text, comment);

        const childMatches = Array.isArray(listItem.children)
          ? listItem.children.some((child) =>
              doesCommentMatchText(getChildText(child), comment),
            )
          : false;

        return parentMatches || childMatches;
      });
    }

    return false;
  });
}

export function getUnmatchedRevisionComments(value = "", comments = []) {
  return comments.filter(
    (comment) => !doesCommentMatchAnyRenderedBlock(value, comment),
  );
}

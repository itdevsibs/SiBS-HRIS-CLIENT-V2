export function isHtmlContent(value = "") {
  return /<\/?[a-z][\s\S]*>/i.test(
    String(value || ""),
  );
}

export function richTextToPlainText(value = "") {
  const source = String(value || "").trim();

  if (!source) return "";

  if (!isHtmlContent(source)) {
    return source;
  }

  if (typeof DOMParser === "undefined") {
    return source
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const parsed = new DOMParser().parseFromString(
    source,
    "text/html",
  );

  const body = parsed.body;

  if (!body) return "";

  /*
   * Add line boundaries before reading textContent so comments, comparison,
   * and legacy revision-highlighting logic can still work with saved HTML.
   */
  body
    .querySelectorAll("br")
    .forEach((element) =>
      element.replaceWith(
        parsed.createTextNode("\n"),
      ),
    );

  body
    .querySelectorAll(
      "p, div, li, blockquote, h1, h2, h3, h4, h5, h6",
    )
    .forEach((element) => {
      element.appendChild(
        parsed.createTextNode("\n"),
      );
    });

  return String(body.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function hasVisibleRichText(value = "") {
  return richTextToPlainText(value).trim().length > 0;
}

export function cleanDocumentLine(value = "") {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\u200b/g, "")
    .replace(/[\t ]+/g, " ")
    .trim();
}

export function isDocumentListMarker(value = "") {
  const line = cleanDocumentLine(value);

  return (
    /^(\d+\.\d+)(?:[.)])?\s*(.*)$/.test(line) ||
    /^(\d+)[.)]\s*(.*)$/.test(line) ||
    /^([a-zA-Z])[.)]\s*(.*)$/.test(line) ||
    /^[•●▪◦*-]\s*(.*)$/.test(line)
  );
}

export function joinSoftWrappedText(previousValue = "", nextValue = "") {
  const previous = cleanDocumentLine(previousValue);
  const next = cleanDocumentLine(nextValue);

  if (!previous) return next;
  if (!next) return previous;

  /*
   * Reconnect words copied from a document like:
   *
   * time-
   * frames
   *
   * Result: timeframes
   */
  if (/[A-Za-z]-$/.test(previous) && !/\s-$/.test(previous)) {
    return `${previous.slice(0, -1)}${next}`
      .replace(/\s+([,.;:!?])/g, "$1")
      .trim();
  }

  /*
   * Handles broken text extraction such as:
   *
   * Th
   * e CDO
   *
   * Result: The CDO
   */
  if (/^[A-Za-z]{1,2}$/.test(previous) && /^[a-z]/.test(next)) {
    return `${previous}${next}`.trim();
  }

  return `${previous} ${next}`
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDocumentText(value = "") {
  const sourceLines = String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u2028|\u2029/g, "\n")
    .split("\n");

  const outputLines = [];

  let paragraph = "";
  let activeListLineIndex = -1;
  let pendingMarker = "";

  function pushBlankLine() {
    if (
      outputLines.length > 0 &&
      outputLines[outputLines.length - 1] !== ""
    ) {
      outputLines.push("");
    }
  }

  function flushParagraph() {
    if (!paragraph) return;

    outputLines.push(paragraph);
    paragraph = "";
  }

  function findNextNonEmptyLine(startIndex) {
    for (
      let index = startIndex + 1;
      index < sourceLines.length;
      index += 1
    ) {
      const nextLine = cleanDocumentLine(sourceLines[index]);

      if (nextLine) {
        return nextLine;
      }
    }

    return "";
  }

  function startListLine(marker, text = "") {
    flushParagraph();

    const cleanText = cleanDocumentLine(text);

    /*
     * The document may be copied like this:
     *
     * 1.
     * Handle outbound calls
     *
     * Store "1." temporarily until the next line is found.
     */
    if (!cleanText) {
      pendingMarker = marker;
      activeListLineIndex = -1;
      return;
    }

    outputLines.push(`${marker} ${cleanText}`.trim());

    activeListLineIndex = outputLines.length - 1;
    pendingMarker = "";
  }

  sourceLines.forEach((rawLine, sourceIndex) => {
    const line = cleanDocumentLine(rawLine);

    if (!line) {
      const nextLine = findNextNonEmptyLine(sourceIndex);

      /*
       * Do not separate a marker from its content.
       */
      if (pendingMarker) {
        return;
      }

      /*
       * Ignore blank lines inserted between copied list items.
       */
      if (
        activeListLineIndex >= 0 &&
        nextLine &&
        isDocumentListMarker(nextLine)
      ) {
        return;
      }

      /*
       * Treat blank lines inside an unfinished wrapped list sentence
       * as a soft line break.
       */
      if (activeListLineIndex >= 0 && nextLine) {
        const currentListLine =
          outputLines[activeListLineIndex] || "";

        if (!/[.!?;:]$/.test(currentListLine)) {
          return;
        }
      }

      /*
       * Treat blank lines inside an unfinished paragraph as soft wraps.
       */
      if (paragraph && nextLine) {
        if (isDocumentListMarker(nextLine)) {
          flushParagraph();
          activeListLineIndex = -1;
          pushBlankLine();
          return;
        }

        if (!/[.!?;:]$/.test(paragraph)) {
          return;
        }
      }

      flushParagraph();
      activeListLineIndex = -1;
      pushBlankLine();

      return;
    }

    /*
     * A standalone dash after paragraph text should remain part
     * of the paragraph instead of becoming a bullet.
     */
    if (/^[-–—]$/.test(line) && paragraph) {
      paragraph = joinSoftWrappedText(paragraph, line);
      return;
    }

    const decimalMatch = line.match(
      /^(\d+\.\d+)(?:[.)])?\s*(.*)$/,
    );

    const numberMatch = line.match(
      /^(\d+)[.)]\s*(.*)$/,
    );

    const letterMatch = line.match(
      /^([a-zA-Z])[.)]\s*(.*)$/,
    );

    const bulletMatch = line.match(
      /^[•●▪◦*-]\s*(.*)$/,
    );

    if (decimalMatch) {
      startListLine(
        `${decimalMatch[1]}.`,
        decimalMatch[2],
      );

      return;
    }

    if (numberMatch) {
      startListLine(
        `${numberMatch[1]}.`,
        numberMatch[2],
      );

      return;
    }

    if (letterMatch) {
      startListLine(
        `${letterMatch[1].toLowerCase()}.`,
        letterMatch[2],
      );

      return;
    }

    if (bulletMatch) {
      startListLine("-", bulletMatch[1]);
      return;
    }

    /*
     * Complete a marker that was copied on a separate line.
     */
    if (pendingMarker) {
      startListLine(pendingMarker, line);
      return;
    }

    /*
     * Unmarked lines immediately following a list item are treated
     * as wrapped continuation lines.
     */
    if (activeListLineIndex >= 0) {
      outputLines[activeListLineIndex] =
        joinSoftWrappedText(
          outputLines[activeListLineIndex],
          line,
        );

      return;
    }

    paragraph = joinSoftWrappedText(paragraph, line);
  });

  if (pendingMarker) {
    outputLines.push(pendingMarker);
  }

  flushParagraph();

  return outputLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseDetailContent(value) {
  const sourceValue = isHtmlContent(value)
    ? richTextToPlainText(value)
    : String(value || "");

  const lines = normalizeDocumentText(sourceValue).split("\n");

  const blocks = [];

  let currentList = null;
  let currentParent = null;

  function flushList() {
    if (currentList?.items?.length) {
      blocks.push(currentList);
    }

    currentList = null;
    currentParent = null;
  }

  function ensureList(ordered) {
    if (!currentList || currentList.ordered !== ordered) {
      flushList();

      currentList = {
        type: "list",
        ordered,
        items: [],
      };
    }
  }

  function addParentItem({
    text,
    number = null,
    ordered,
  }) {
    ensureList(ordered);

    const newItem = {
      text: cleanDocumentLine(text),
      children: [],
      number,
    };

    currentList.items.push(newItem);
    currentParent = newItem;
  }

  lines.forEach((rawLine) => {
    const line = cleanDocumentLine(rawLine);

    if (!line) {
      flushList();
      return;
    }

    const decimalMatch = line.match(
      /^(\d+)\.(\d+)(?:[.)])?\s+(.*)$/,
    );

    const numberMatch = line.match(
      /^(\d+)[.)]\s+(.*)$/,
    );

    const bulletMatch = line.match(
      /^[-•●▪◦*]\s+(.*)$/,
    );

    const letterMatch = line.match(
      /^([a-zA-Z])[.)]\s+(.*)$/,
    );

    if (decimalMatch) {
      ensureList(true);

      const parentNumber = Number(decimalMatch[1]);

      const child = {
        text: decimalMatch[3].trim(),
        prefix: `${decimalMatch[1]}.${decimalMatch[2]}.`,
      };

      const matchingParent =
        currentParent &&
        Number(currentParent.number) === parentNumber
          ? currentParent
          : [...currentList.items]
              .reverse()
              .find(
                (item) =>
                  Number(item.number) === parentNumber,
              );

      if (matchingParent) {
        matchingParent.children.push(child);
        currentParent = matchingParent;
      } else {
        addParentItem({
          text: `${child.prefix} ${child.text}`,
          number: parentNumber,
          ordered: true,
        });
      }

      return;
    }

    if (numberMatch) {
      addParentItem({
        text: numberMatch[2],
        number: Number(numberMatch[1]),
        ordered: true,
      });

      return;
    }

    if (bulletMatch) {
      addParentItem({
        text: bulletMatch[1],
        ordered: false,
      });

      return;
    }

    if (letterMatch) {
      const child = {
        text: letterMatch[2].trim(),
        prefix: `${letterMatch[1].toLowerCase()}.`,
      };

      if (currentList && currentParent) {
        currentParent.children.push(child);
      } else {
        flushList();

        blocks.push({
          type: "paragraph",
          text: `${child.prefix} ${child.text}`,
        });
      }

      return;
    }

    flushList();

    blocks.push({
      type: "paragraph",
      text: line,
    });
  });

  flushList();

  return blocks;
}

export function getChildText(child = "") {
  if (typeof child === "string") return child;
  return String(child?.text || "");
}

export function getChildPrefix(child = "") {
  if (typeof child === "string") return "";
  return String(child?.prefix || "");
}

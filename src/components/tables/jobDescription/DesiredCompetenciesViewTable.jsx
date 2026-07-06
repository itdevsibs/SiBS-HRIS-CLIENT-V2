import React from "react";
import { Check, PencilLine, SquarePen } from "lucide-react";

const proficiencyOptions = ["Average", "Proficient", "Excellent"];

function normalizeLevel(item = {}) {
  if (item.level) return String(item.level);

  if (Number(item.average) === 1) return "Average";
  if (Number(item.proficient) === 1) return "Proficient";
  if (Number(item.excellent) === 1) return "Excellent";

  return "";
}

function normalizeRevisionCompareText(value = "") {
  return String(value || "")
    .trim()
    .replace(/^[-•*]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^[a-zA-Z][.)]\s*/, "")
    .replace(/[.]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeSelectedPhrase(value = "") {
  return String(value || "")
    .trim()
    .replace(/^[-•*]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^[a-zA-Z][.)]\s*/, "")
    .replace(/\s+/g, " ");
}

function buildNormalizedTextMap(value = "") {
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

function findSelectedPhraseRange(text = "", selectedText = "") {
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

function parseCompetencyContent(value = "") {
  const lines = String(value || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  return lines.map((line, index) => ({
    key: `line-${index}`,
    text: line
      .replace(/^[-•*]\s*/, "")
      .replace(/^\d+[.)]\s*/, "")
      .replace(/^[a-zA-Z][.)]\s*/, "")
      .trim(),
  }));
}

function getSelectedTextCandidatePhrases(selectedText = "") {
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

  parseCompetencyContent(rawSelectedText).forEach((line) => {
    pushPhrase(line.text);
  });

  return phrases.sort((a, b) => b.length - a.length);
}

function getInlineCommentMatches(text = "", comments = []) {
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

function getCommentStableKey(comment = {}) {
  return String(
    comment.id ||
      `${comment.sectionKey || ""}-${comment.selectedText || ""}-${
        comment.comment || ""
      }`,
  );
}

function getFirstMatchedLineKey(lines = [], comment = {}) {
  for (const line of lines) {
    const hasMatch = getInlineCommentMatches(line.text, [comment]).length > 0;

    if (hasMatch) return line.key;
  }

  return "";
}

function getLastMatchedLineKey(lines = [], comment = {}) {
  let lastKey = "";

  lines.forEach((line) => {
    const hasMatch = getInlineCommentMatches(line.text, [comment]).length > 0;

    if (hasMatch) {
      lastKey = line.key;
    }
  });

  return lastKey;
}

function getCommentsForTextLine(text = "", comments = []) {
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

function InlineCommentedText({
  text = "",
  comments = [],
  className = "",
  boundaryMap = {},
}) {
  const matches = getInlineCommentMatches(text, comments);

  if (!matches.length) {
    return <span className={className}>{text}</span>;
  }

  const nodes = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      nodes.push(
        <span key={`text-before-${index}`}>
          {text.slice(cursor, match.start)}
        </span>,
      );
    }

    const commentKey = getCommentStableKey(match.comment);
    const boundary = boundaryMap[commentKey] || {};
    const isStart = Boolean(boundary.start);
    const isEnd = Boolean(boundary.end);

    nodes.push(
      <span
        key={`highlight-fragment-${commentKey}-${match.start}`}
        className="inline-flex items-center gap-1 align-middle"
      >
        {isStart && (
          <span className="inline-flex items-center self-center text-sm font-extrabold leading-none text-orange-600">
            &gt;&gt;&gt;
          </span>
        )}

        <span
          className="inline-flex items-center self-center rounded-md bg-[#FFF3B8] px-1.5 py-0.5 font-[inherit] leading-normal text-[#101828] ring-1 ring-amber-300"
          title={match.comment.comment || "Marked for revision"}
        >
          {text.slice(match.start, match.end)}
        </span>

        {isEnd && (
          <span className="inline-flex items-center self-center text-sm font-extrabold leading-none text-orange-600">
            &lt;&lt;&lt;
          </span>
        )}
      </span>,
    );

    cursor = match.end;
  });

  if (cursor < text.length) {
    nodes.push(<span key="text-after">{text.slice(cursor)}</span>);
  }

  return <span className={className}>{nodes}</span>;
}

function getCompetencyTitleAndDescription(item = {}) {
  const rawTitle = String(item.title || "").trim();
  const rawDescription = String(item.description || "").trim();

  if (rawTitle) {
    return {
      title: rawTitle,
      description: rawDescription,
    };
  }

  const lines = rawDescription
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return {
      title: "",
      description: rawDescription,
    };
  }

  return {
    title: lines[0],
    description: lines.slice(1).join("\n"),
  };
}

function isCompetencySection(sectionKey = "") {
  const key = String(sectionKey || "").toLowerCase();

  return key.includes("competenc") || key.includes("desired");
}

function getCompetencyComments(item = {}, comments = []) {
  const competencyId = Number(item.id || item.competencyId || 0);

  const { title, description } = getCompetencyTitleAndDescription(item);

  const competencyText = normalizeRevisionCompareText(
    `${title || ""} ${description || ""}`,
  );

  const descriptionText = normalizeRevisionCompareText(description || "");
  const titleText = normalizeRevisionCompareText(title || "");

  return comments.filter((comment) => {
    const commentSectionKey = String(comment.sectionKey || "").toLowerCase();

    if (!isCompetencySection(commentSectionKey)) return false;

    const commentCompetencyId = Number(
      comment.competencyId || comment.competency_id || 0,
    );

    if (competencyId && commentCompetencyId) {
      return competencyId === commentCompetencyId;
    }

    const selectedText = normalizeRevisionCompareText(
      comment.selectedText || comment.selected_text || "",
    );

    if (!selectedText) return false;

    if (!competencyText && !descriptionText && !titleText) return false;

    return (
      selectedText === competencyText ||
      selectedText === descriptionText ||
      selectedText === titleText ||
      competencyText.includes(selectedText) ||
      selectedText.includes(competencyText) ||
      descriptionText.includes(selectedText) ||
      selectedText.includes(descriptionText) ||
      titleText.includes(selectedText) ||
      selectedText.includes(titleText)
    );
  });
}

function CompetencyRevisionBlock({ comment }) {
  if (!comment) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-amber-300 bg-amber-50 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-amber-300 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-orange-700">
            Text Marked for Revision
          </p>

          <p className="mt-1 text-xs font-semibold text-orange-700/90">
            The highlighted phrase above needs to be reviewed and updated.
          </p>
        </div>

        <span className="w-fit rounded-full border border-amber-300 bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-orange-700">
          {comment.status || "Open"}
        </span>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="rounded-xl border border-orange-100 bg-white px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />

            <p className="text-[11px] font-extrabold uppercase tracking-wide text-orange-700">
              Reviewer Comment
            </p>
          </div>

          <div className="flex items-center">
            <p className="whitespace-pre-line text-sm font-semibold leading-6 text-orange-800">
              {comment.comment || "No revision comment provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LevelIndicator({ active = false }) {
  return (
    <div
      className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
        active
          ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
          : "border-[#D7DEE8] bg-white text-transparent"
      }`}
    >
      {active && <Check size={15} strokeWidth={3} />}
    </div>
  );
}

function CompetencyTextWithComments({
  title = "",
  description = "",
  comments = [],
  hasComments = false,
}) {
  const titleLines = title
    ? [
        {
          key: "title",
          text: title,
          type: "title",
        },
      ]
    : [];

  const descriptionLines = parseCompetencyContent(description).map((line) => ({
    ...line,
    type: "description",
  }));

  const allLines = [...titleLines, ...descriptionLines];

  if (!allLines.length) {
    return (
      <p
        className={`whitespace-pre-line text-[15px] font-medium leading-7 selection:bg-[#FFF3B8] selection:text-[#101828] text-[#344054]`}
      >
        —
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {allLines.map((line) => {
        const lineComments = getCommentsForTextLine(line.text, comments);

        const lineCommentsToDisplay = lineComments.filter(
          (comment) => getLastMatchedLineKey(allLines, comment) === line.key,
        );

        const boundaryMap = Object.fromEntries(
          lineComments.map((comment) => {
            const commentKey = getCommentStableKey(comment);

            return [
              commentKey,
              {
                start: getFirstMatchedLineKey(allLines, comment) === line.key,
                end: getLastMatchedLineKey(allLines, comment) === line.key,
              },
            ];
          }),
        );

        return (
          <div key={line.key}>
            {line.type === "title" ? (
              <p className="text-sm font-extrabold leading-6 text-[#101828] selection:bg-[#FFF3B8] selection:text-[#101828]">
                <InlineCommentedText
                  text={line.text}
                  comments={comments}
                  boundaryMap={boundaryMap}
                />
              </p>
            ) : (
              <p
                className={`whitespace-pre-line text-[15px] font-medium leading-7 selection:bg-[#FFF3B8] selection:text-[#101828] text-[#344054]`}
              >
                <InlineCommentedText
                  text={line.text}
                  comments={comments}
                  boundaryMap={boundaryMap}
                />
              </p>
            )}

            {lineCommentsToDisplay.length > 0 && (
              <div className="space-y-3">
                {lineCommentsToDisplay.map((comment, index) => (
                  <CompetencyRevisionBlock
                    key={
                      comment.id ||
                      `${line.key}-${comment.comment || ""}-${index}`
                    }
                    comment={comment}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const DesiredCompetenciesViewTable = ({
  competencies = [],
  comments = [],
  onAddComment,
  disableEdit = false,
  disableComment = false,
  canManageActions = false,
  onEditedChange,
}) => {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-extrabold text-[#101828]">
            Desired Competencies
          </h4>

          <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
            Expected competency level required for this position.
          </p>
        </div>

        {canManageActions && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              disabled={disableEdit}
              onClick={() => onEditedChange?.(true)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                disableEdit
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-[#D7DEE8] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
              }`}
            >
              <SquarePen size={14} />
              Edit
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                onAddComment?.("competencies", "Desired Competencies")
              }
              disabled={disableComment}
              className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                disableComment
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-blue-100 bg-blue-50 text-sibs-primary-1 hover:bg-blue-100"
              }`}
            >
              <PencilLine size={14} />
              Add Comment
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D7DEE8] bg-white selection:bg-[#FFF3B8] selection:text-[#101828]">
        <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_110px] border-b border-[#D7DEE8] bg-[#F8FAFC] sm:grid">
          <div className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            Competency for this Position
          </div>

          {proficiencyOptions.map((option) => (
            <div
              key={option}
              className="flex items-center justify-center border-l border-[#E6ECF2] px-3 py-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1"
            >
              {option}
            </div>
          ))}
        </div>

        {competencies.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm font-semibold text-sibs-tertiary-5">
            No competencies provided.
          </div>
        ) : (
          <div className="divide-y divide-[#E6ECF2]">
            {competencies.map((item, index) => {
              const level = normalizeLevel(item);
              const rowComments = getCompetencyComments(item, comments);
              const hasComments = rowComments.length > 0;
              const { title, description } =
                getCompetencyTitleAndDescription(item);

              return (
                <div
                  key={item.id || `${title}-${index}`}
                  className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_110px_110px_110px]"
                >
                  <div
                    className={`px-4 py-5 selection:bg-[#FFF3B8] selection:text-[#101828] sm:border-r sm:border-[#E6ECF2]
                       bg-inherit`}
                  >
                    <CompetencyTextWithComments
                      title={title}
                      description={
                        description || (!title ? item.description : "")
                      }
                      comments={rowComments}
                      hasComments={hasComments}
                    />
                  </div>

                  {proficiencyOptions.map((option) => (
                    <div
                      key={option}
                      className={`flex items-center justify-between gap-3 border-t border-[#E6ECF2] px-4 py-4 sm:justify-center sm:border-l sm:border-t-0 bg-inherit`}
                    >
                      <span className="text-sm font-bold text-sibs-primary-1 sm:hidden">
                        {option}
                      </span>

                      <LevelIndicator active={level === option} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default DesiredCompetenciesViewTable;

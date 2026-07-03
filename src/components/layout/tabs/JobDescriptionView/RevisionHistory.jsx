import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  Clock3,
  FileText,
  GitBranch,
  History,
  MessageSquareText,
  UserRound,
} from "lucide-react";

const HIDDEN_CHANGE_KEYS = new Set([
  "currentSnapshot",
  "departmentId",
  "department_id",
  "accountId",
  "account_id",
  "preparedForId",
  "prepared_for_id",
  "existingJdId",
  "existing_jd_id",
  "jdCode",
  "jd_code",
  "currentVersion",
  "current_version",
  "dateRequested",
  "date_requested",
  "createdBy",
  "created_by",
  "lastUpdated",
  "last_updated",
]);

const HIDDEN_CHANGE_TYPES = new Set([
  "revision_snapshot",
  "revision_submit",
  "current_snapshot",
]);

function safeParseJson(value, fallback = []) {
  if (Array.isArray(value)) return value;

  if (value && typeof value === "object") {
    if (Array.isArray(value.changes)) return value.changes;
    if (Array.isArray(value.changeDetails)) return value.changeDetails;
    return fallback;
  }

  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.changes)) return parsed.changes;
    if (Array.isArray(parsed?.changeDetails)) return parsed.changeDetails;

    return fallback;
  } catch {
    return fallback;
  }
}

function formatDateTime(value) {
  if (!value) return "—";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value) {
  if (!value) return "—";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    const text = String(value || "").trim();
    return text || "—";
  }

  return parsedDate.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getRevisionNo(revision = {}, index = 0) {
  return (
    revision.revisionNo ||
    revision.revision_no ||
    revision.versionNo ||
    revision.version_no ||
    revision.currentVersion ||
    revision.current_version ||
    index + 1
  );
}

function formatRevisionNo(value) {
  const text = String(value || "").trim();

  if (!text) return "REV-1";

  if (/^rev[-_ ]?/i.test(text)) {
    return text.replace(/^rev[-_ ]?/i, "REV-");
  }

  return `REV-${text}`;
}

function getRevisionDate(revision = {}) {
  return (
    revision.createdAt ||
    revision.created_at ||
    revision.reviewedAt ||
    revision.reviewed_at ||
    revision.approvedAt ||
    revision.approved_at ||
    revision.revisedAt ||
    revision.revised_at ||
    ""
  );
}

function getRevisionRawChanges(revision = {}) {
  const rawChanges =
    revision.changeDetails ||
    revision.change_details ||
    revision.changeDetailsJson ||
    revision.change_details_json ||
    [];

  return safeParseJson(rawChanges, []);
}

function getRevisionChanges(revision = {}) {
  return getRevisionRawChanges(revision).filter((change) => {
    if (!change) return false;

    const key = String(change.key || change.field || "").trim();
    const type = String(change.type || "").trim();

    if (HIDDEN_CHANGE_TYPES.has(type)) return false;
    if (key && HIDDEN_CHANGE_KEYS.has(key)) return false;

    return Boolean(key || change.label);
  });
}

function getSubmitEntry(changeDetails = []) {
  return changeDetails.find(
    (change) =>
      change?.type === "revision_submit" || change?.key === "revision",
  );
}

function getRevisionBy(revision = {}, rawChangeDetails = []) {
  const submitEntry = getSubmitEntry(rawChangeDetails);

  return (
    revision.revisedBy ||
    revision.revised_by ||
    revision.reviewedBy ||
    revision.reviewed_by ||
    revision.approvedBy ||
    revision.approved_by ||
    submitEntry?.submittedBy ||
    submitEntry?.submitted_by ||
    "—"
  );
}

function getRevisionRemarks(revision = {}, rawChangeDetails = []) {
  const submitEntry = getSubmitEntry(rawChangeDetails);

  return (
    revision.revisionRemarks ||
    revision.revision_remarks ||
    revision.approveRemarks ||
    revision.approve_remarks ||
    submitEntry?.remarks ||
    ""
  );
}

function getRevisionKey(revision = {}, item = {}, index = 0) {
  return String(
    revision.id ||
      revision.revisionId ||
      revision.revision_id ||
      `revision-history-${item.id || item.jdCode || item.jd_code || "jd"}-${index}`,
  );
}

function getRevisionSortNumber(revision = {}, index = 0) {
  const revisionNo = String(getRevisionNo(revision, index) || "");
  const numericValue = Number(revisionNo.replace(/[^\d]/g, ""));

  return Number.isFinite(numericValue) && numericValue > 0
    ? numericValue
    : index + 1;
}

function getRevisionSortDate(revision = {}) {
  const date = new Date(getRevisionDate(revision));
  const time = date.getTime();

  return Number.isNaN(time) ? 0 : time;
}

function getAvatarLabel(value = "") {
  const text = String(value || "").trim();

  if (!text || text === "—") return "—";

  const parts = text
    .replace(/[,]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}


function StatCard({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#D9E2EC] bg-white px-3 py-3 shadow-sm sm:rounded-2xl sm:px-4">
      <p className="break-words text-[9px] font-extrabold uppercase leading-4 tracking-wide text-sibs-tertiary-5 sm:text-[10px]">
        {label}
      </p>

      <p className="mt-1 break-words text-lg font-extrabold leading-tight text-sibs-primary-1 sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function getRevisionSnapshot(revision = {}) {
  const rawChangeDetails = getRevisionRawChanges(revision);

  const snapshotEntry = rawChangeDetails.find((change) => {
    const key = String(change?.key || "").trim();
    const type = String(change?.type || "").trim();

    return key === "currentSnapshot" || type === "revision_snapshot";
  });

  const snapshot =
    snapshotEntry?.snapshot ||
    snapshotEntry?.currentSnapshot ||
    snapshotEntry?.value ||
    snapshotEntry?.revisedValue ||
    snapshotEntry?.revised_value ||
    snapshotEntry?.newValue ||
    snapshotEntry?.new_value ||
    revision.snapshot ||
    revision.currentSnapshot ||
    revision.current_snapshot ||
    revision.documentSnapshot ||
    revision.document_snapshot ||
    null;

  return snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
    ? snapshot
    : null;
}

function getSnapshotValue(source = {}, ...keys) {
  for (const key of keys) {
    const value = source?.[key] ?? source?.raw?.[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
}

function normalizeSnapshotCompetencies(value = []) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    return safeParseJson(value, []);
  }

  return [];
}

function getChildText(child = "") {
  if (typeof child === "string") return child;
  return String(child?.text || "");
}

function parseDetailContent(value) {
  const lines = String(value || "")
    .replace(/\r/g, "")
    .split("\n");

  const blocks = [];
  let listItems = [];
  let currentParent = null;
  let currentChild = null;
  let currentListOrdered = false;

  const flushCurrentParent = () => {
    if (currentParent) {
      listItems.push(currentParent);
      currentParent = null;
      currentChild = null;
    }
  };

  const flushList = () => {
    flushCurrentParent();

    if (listItems.length > 0) {
      blocks.push({
        type: "list",
        ordered: currentListOrdered,
        items: [...listItems],
      });

      listItems = [];
      currentListOrdered = false;
      currentChild = null;
    }
  };

  lines.forEach((rawLine) => {
    const line = String(rawLine || "").replace(/\t/g, "    ");
    const trimmed = line.trim();

    if (!trimmed) {
      currentChild = null;
      return;
    }

    const numberMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    const bulletMatch = trimmed.match(/^[-•*]\s+(.*)$/);
    const letterMatch = trimmed.match(/^([a-zA-Z])[.)]\s+(.*)$/);

    if (numberMatch) {
      if (listItems.length > 0 && !currentListOrdered) flushList();
      flushCurrentParent();
      currentListOrdered = true;
      currentParent = {
        text: numberMatch[2].trim(),
        children: [],
      };
      currentChild = null;
      return;
    }

    if (bulletMatch) {
      if (listItems.length > 0 && currentListOrdered) flushList();
      flushCurrentParent();
      currentListOrdered = false;
      currentParent = {
        text: bulletMatch[1].trim(),
        children: [],
      };
      currentChild = null;
      return;
    }

    if (letterMatch) {
      const child = {
        text: letterMatch[2].trim(),
        prefix: `${letterMatch[1].toLowerCase()}.`,
      };

      if (currentParent) {
        currentParent.children.push(child);
        currentChild = child;
      } else if (listItems.length > 0) {
        listItems[listItems.length - 1].children.push(child);
        currentChild = child;
      } else {
        currentParent = {
          text: "",
          children: [child],
        };
        currentChild = child;
      }

      return;
    }

    if (currentChild) {
      currentChild.text = `${currentChild.text} ${trimmed}`
        .replace(/\s+/g, " ")
        .trim();
      return;
    }

    if (currentParent) {
      currentParent.text = `${currentParent.text} ${trimmed}`
        .replace(/\s+/g, " ")
        .trim();
      return;
    }

    flushList();

    blocks.push({
      type: "paragraph",
      text: trimmed,
    });
  });

  flushList();

  return blocks;
}

function SnapshotRichContent({ value = "" }) {
  const blocks = useMemo(() => parseDetailContent(value), [value]);

  if (!String(value || "").trim()) {
    return <p className="text-sm font-medium text-sibs-tertiary-5">—</p>;
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          const listClassName = block.ordered
            ? "list-decimal space-y-3 pl-5 text-sm font-medium leading-7 text-[#344054] sm:pl-6 sm:text-[15px]"
            : "list-disc space-y-3 pl-5 text-sm font-medium leading-7 text-[#344054] sm:pl-6 sm:text-[15px]";

          return (
            <ListTag key={`snapshot-list-${index}`} className={listClassName}>
              {block.items.map((listItem, listIndex) => (
                <li key={`snapshot-item-${listIndex}`}>
                  {listItem.text}

                  {listItem.children?.length > 0 && (
                    <ol className="mt-3 space-y-2 pl-6">
                      {listItem.children.map((child, childIndex) => (
                        <li
                          key={`snapshot-child-${listIndex}-${childIndex}`}
                          className="list-none"
                        >
                          <div className="flex gap-2">
                            {child.prefix && (
                              <span className="shrink-0 font-semibold text-[#344054]">
                                {child.prefix}
                              </span>
                            )}

                            <span>{getChildText(child)}</span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <p
            key={`snapshot-paragraph-${index}`}
            className="text-sm font-medium leading-7 text-[#344054] sm:text-[15px] sm:leading-8"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

function SnapshotCell({ label, value, className = "" }) {
  return (
    <div className={`min-h-[70px] border-[#D6E3F0] px-3 py-3 sm:min-h-[78px] sm:px-4 ${className}`}>
      <p className="break-words text-[9px] font-extrabold uppercase tracking-wide text-[#315F8C] sm:text-[10px]">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-line break-words text-sm font-extrabold leading-6 text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

function SnapshotContentSection({ number, title, value }) {
  if (!String(value || "").trim()) return null;

  return (
    <section className="border-t border-[#D9E2EC] pt-5">
      <h4 className="text-sm font-extrabold uppercase tracking-wide text-[#101828]">
        {number}. {title}
      </h4>

      <div className="mt-3">
        <SnapshotRichContent value={value} />
      </div>
    </section>
  );
}

function SnapshotCompetencies({ competencies = [] }) {
  const list = normalizeSnapshotCompetencies(competencies);

  if (!list.length) return null;

  return (
    <section className="border-t border-[#D9E2EC] pt-5">
      <h4 className="text-sm font-extrabold uppercase tracking-wide text-[#101828]">
        5. Desired Competencies
      </h4>

      <div className="mt-3 space-y-3">
        {list.map((competency, index) => {
          const title =
            competency?.title ||
            competency?.competency ||
            competency?.competencyName ||
            "";

          const description =
            competency?.description ||
            competency?.details ||
            competency?.competencyDescription ||
            "";

          const level =
            competency?.level ||
            (Number(competency?.average) === 1
              ? "Average"
              : Number(competency?.proficient) === 1
                ? "Proficient"
                : Number(competency?.excellent) === 1
                  ? "Excellent"
                  : "");

          return (
            <div
              key={`snapshot-competency-${index}`}
              className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] px-4 py-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  {title && (
                    <p className="text-sm font-extrabold text-[#101828]">
                      {title}
                    </p>
                  )}

                  <p className="mt-1 whitespace-pre-line text-sm font-medium leading-6 text-[#344054]">
                    {description || "—"}
                  </p>
                </div>

                {level && (
                  <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                    {level}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RevisionDocumentSnapshot({ revision = {}, item = {}, revisionLabel = "" }) {
  const snapshot = getRevisionSnapshot(revision);

  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-4">
        <p className="text-sm font-extrabold text-[#101828]">
          No document snapshot saved for this revision.
        </p>

        <p className="mt-1 text-sm font-medium leading-6 text-sibs-tertiary-5">
          This revision was saved before the document snapshot viewer was added,
          or the backend did not include the revision snapshot.
        </p>
      </div>
    );
  }

  const documentTitle = getSnapshotValue(
    snapshot,
    "documentTitle",
    "document_title",
    "roleTitle",
    "role_title",
  );

  const roleTitle = getSnapshotValue(
    snapshot,
    "roleTitle",
    "role_title",
    "documentTitle",
    "document_title",
  );

  const jdCode =
    getSnapshotValue(snapshot, "jdCode", "jd_code") ||
    item?.jdCode ||
    item?.jd_code ||
    "—";

  const revisionNo =
    getSnapshotValue(snapshot, "revisionNo", "revision_no", "currentVersion") ||
    String(revisionLabel || "").replace(/^REV-/i, "") ||
    "—";

  const department = getSnapshotValue(
    snapshot,
    "department",
    "departmentName",
    "department_name",
  );

  const preparedFor = getSnapshotValue(
    snapshot,
    "preparedFor",
    "prepared_for",
    "account",
    "accountName",
    "account_name",
  );

  const linkedHiringRequirement = getSnapshotValue(
    snapshot,
    "linkedHiringRequirement",
    "linked_hiring_requirement",
    "existingJdId",
    "existing_jd_id",
  );

  const createdBy = getSnapshotValue(
    snapshot,
    "createdBy",
    "created_by",
    "requestedBy",
    "requested_by",
    "requestedBySibsId",
    "requested_by_sibs_id",
  );

  const competencies =
    snapshot.competencies ||
    snapshot.desiredCompetencies ||
    snapshot.desired_competencies ||
    [];

  return (
    <div className="w-full max-w-full overflow-hidden rounded-[16px] border border-[#D9E2EC] bg-white p-3 shadow-sm sm:rounded-[18px] sm:p-4">
      <div className="mb-4 flex min-w-0 flex-col gap-1">
        <p className="break-words text-[10px] font-extrabold uppercase tracking-[0.14em] text-sibs-primary-1/70 sm:text-[11px] sm:tracking-[0.16em]">
          Document Snapshot
        </p>

        <h4 className="break-words text-base font-extrabold text-[#101828]">
          {revisionLabel} Job Description Version
        </h4>

        <p className="break-words text-sm font-medium text-sibs-tertiary-5">
          This is the full JD content saved under this revision.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D6E3F0] bg-white">
        <div className="border-b border-[#D6E3F0] px-3 py-4 sm:px-5 sm:py-5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#315F8C]">
            Document Title
          </p>

          <div className="relative mt-4 pl-4">
            <span className="absolute bottom-1 left-0 top-1 w-[3px] rounded-full bg-[#0D4676]" />

            <p className="break-words text-base font-extrabold leading-7 text-[#101828] sm:text-lg">
              {documentTitle || "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 border-b border-[#D6E3F0] md:grid-cols-2">
          <SnapshotCell
            label="Position"
            value={roleTitle}
            className="border-b md:border-b-0 md:border-r"
          />

          <SnapshotCell label="Department" value={department} />
        </div>

        <div className="grid grid-cols-1 border-b border-[#D6E3F0] sm:grid-cols-2 lg:grid-cols-4">
          <SnapshotCell
            label="Document Code"
            value={jdCode}
            className="border-b sm:border-r lg:border-b-0"
          />

          <SnapshotCell
            label="Revision No."
            value={revisionNo}
            className="border-b lg:border-b-0 lg:border-r"
          />

          <SnapshotCell
            label="Effective Date"
            value={formatDateOnly(
              getSnapshotValue(snapshot, "effectiveDate", "effective_date"),
            )}
            className="border-b sm:border-b-0 sm:border-r"
          />

          <SnapshotCell
            label="Last Reviewed"
            value={formatDateOnly(
              getSnapshotValue(
                snapshot,
                "lastUpdated",
                "last_updated",
                "updatedAt",
                "updated_at",
              ),
            )}
          />
        </div>

        <div className="grid grid-cols-1 border-b border-[#D6E3F0] sm:grid-cols-2 lg:grid-cols-4">
          <SnapshotCell
            label="Date Requested"
            value={formatDateOnly(
              getSnapshotValue(snapshot, "dateRequested", "date_requested"),
            )}
            className="border-b sm:border-r lg:border-b-0"
          />

          <SnapshotCell
            label="Linked Hiring Requirement"
            value={linkedHiringRequirement || "—"}
            className="border-b lg:border-b-0 lg:border-r"
          />

          <SnapshotCell
            label="Prepared For"
            value={preparedFor}
            className="border-b sm:border-b-0 sm:border-r"
          />

          <SnapshotCell label="Created By" value={createdBy} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <SnapshotCell
            label="Reports To"
            value={getSnapshotValue(snapshot, "reportsTo", "reports_to")}
            className="border-b md:border-b-0 md:border-r"
          />

          <SnapshotCell
            label="Supervisory"
            value={getSnapshotValue(snapshot, "supervisory") || "No"}
          />
        </div>
      </div>

      <div className="mt-5 space-y-5 sm:mt-6 sm:space-y-6">
        <SnapshotContentSection
          number="1"
          title="Position Overview"
          value={getSnapshotValue(snapshot, "description")}
        />

        <SnapshotContentSection
          number="2"
          title="Duties & Responsibilities"
          value={getSnapshotValue(snapshot, "responsibilities")}
        />

        <SnapshotContentSection
          number="3"
          title="Qualifications & Characteristics"
          value={getSnapshotValue(snapshot, "qualifications")}
        />

        <SnapshotContentSection
          number="4"
          title="Preferred Personality Type"
          value={getSnapshotValue(
            snapshot,
            "personalityType",
            "personality_type",
          )}
        />

        <SnapshotCompetencies competencies={competencies} />
      </div>
    </div>
  );
}

const RevisionHistory = ({
  revisionHistory = [],
  item = {},
  onDocumentOpenChange,
}) => {
  const [openRevisionId, setOpenRevisionId] = useState(null);

  const revisions = useMemo(() => {
    return Array.isArray(revisionHistory)
      ? revisionHistory
          .map((revision, index) => ({
            revision,
            originalIndex: index,
            sortNo: getRevisionSortNumber(revision, index),
            sortDate: getRevisionSortDate(revision),
          }))
          .sort((a, b) => b.sortNo - a.sortNo || b.sortDate - a.sortDate)
      : [];
  }, [revisionHistory]);

  const totalChanges = useMemo(() => {
    return revisions.reduce(
      (total, revisionItem) =>
        total + getRevisionChanges(revisionItem.revision).length,
      0,
    );
  }, [revisions]);

  const latestRevisionNo =
    revisions.length > 0
      ? formatRevisionNo(
          getRevisionNo(revisions[0].revision, revisions[0].originalIndex),
        )
      : "—";

  useEffect(() => {
    onDocumentOpenChange?.(Boolean(openRevisionId));

    return () => {
      onDocumentOpenChange?.(false);
    };
  }, [openRevisionId, onDocumentOpenChange]);

  function handleToggleRevision(revisionKey) {
    setOpenRevisionId((current) =>
      current === revisionKey ? null : revisionKey,
    );
  }

  return (
    <section className="w-full max-w-full overflow-hidden rounded-[18px] border border-[#D9E2EC] bg-white p-3 shadow-[0_18px_55px_rgba(15,23,42,0.10)] sm:rounded-[24px] sm:p-6">
      <div className="rounded-[16px] border border-[#E6ECF2] bg-[#F8FAFC] p-3 sm:rounded-[20px] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sibs-primary-1 text-white shadow-sm sm:h-12 sm:w-12 sm:rounded-2xl">
              <History size={18} className="sm:h-5 sm:w-5" />
            </div>

            <div className="min-w-0">
              <p className="break-words text-[10px] font-extrabold uppercase tracking-[0.14em] text-sibs-primary-1/65 sm:text-[11px] sm:tracking-[0.18em]">
                Version Tracking
              </p>

              <h3 className="mt-1 break-words text-lg font-extrabold leading-tight text-[#101828] sm:text-2xl">
                Revision History
              </h3>

              <p className="mt-2 max-w-xl break-words text-sm font-medium leading-6 text-sibs-tertiary-5 sm:leading-7">
                Review saved JD versions, remarks, and document snapshots.
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-3 sm:gap-3 xl:w-[420px]">
            <StatCard label="Total Revisions" value={revisions.length} />
            <StatCard label="Latest" value={latestRevisionNo} />
            <StatCard label="Recorded Changes" value={totalChanges} />
          </div>
        </div>
      </div>

      {revisions.length > 0 ? (
        <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
          {revisions.map(({ revision, originalIndex }, displayIndex) => {
            const rawChangeDetails = getRevisionRawChanges(revision);
            const changeDetails = getRevisionChanges(revision);
            const revisionNo = getRevisionNo(revision, originalIndex);
            const revisionLabel = formatRevisionNo(revisionNo);
            const revisionKey = getRevisionKey(revision, item, originalIndex);
            const remarks = getRevisionRemarks(revision, rawChangeDetails);
            const revisedBy = getRevisionBy(revision, rawChangeDetails);
            const revisionDate = formatDateTime(getRevisionDate(revision));
            const isLatest = displayIndex === 0;
            const isOpen = openRevisionId === revisionKey;

            const cleanRevisionNumber = String(revisionNo || "")
              .replace(/^REV[-_ ]?/i, "")
              .trim();

            return (
              <article
                key={revisionKey}
                className={`relative overflow-hidden rounded-[16px] border bg-white p-3 shadow-sm transition-all duration-200 ease-out sm:rounded-[20px] sm:p-5 ${
                  isOpen
                    ? "border-[#BFD6F6] ring-4 ring-[#EAF2FB]"
                    : "border-[#E6ECF2] hover:border-[#C9D8EA]"
                }`}
              >
                <span
                  className={`absolute bottom-4 left-0 top-4 w-1 rounded-r-full ${
                    isLatest ? "bg-sibs-primary-2" : "bg-sibs-primary-1"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => handleToggleRevision(revisionKey)}
                  className="w-full text-left"
                >
                  <div className="flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 pl-2">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#BFD6F6] bg-[#EAF2FB] text-sm font-extrabold text-sibs-primary-1 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-base">
                          {cleanRevisionNumber || "—"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h4 className="break-words text-base font-extrabold leading-tight text-sibs-primary-1 sm:text-xl">
                              {revisionLabel}
                            </h4>

                            {isLatest && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[10px] font-extrabold text-sibs-primary-2 sm:px-2.5 sm:py-1 sm:text-[11px]">
                                <BadgeCheck size={12} />
                                Latest Version
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1 rounded-full border border-[#CFE0F3] bg-[#EDF4FB] px-2 py-0.5 text-[10px] font-extrabold text-sibs-primary-1 sm:px-2.5 sm:py-1 sm:text-[11px]">
                              <GitBranch size={12} />
                              {changeDetails.length}{" "}
                              {pluralize(changeDetails.length, "change")}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-col gap-1 text-xs font-semibold text-[#344054] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:text-sm">
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound
                                size={14}
                                className="text-sibs-tertiary-5"
                              />
                              Revised by:
                              <span className="font-extrabold text-[#101828]">
                                {revisedBy}
                              </span>
                            </span>

                            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#315F8C]">
                              <Clock3 size={14} />
                              {revisionDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      {remarks && (
                        <div className="mt-3 rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] px-3 py-3 sm:mt-4 sm:rounded-2xl sm:px-4">
                          <div className="mb-2 flex items-center gap-2">
                            <MessageSquareText
                              size={15}
                              className="text-sibs-primary-1"
                            />

                            <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1 sm:text-[11px]">
                              Revision Remarks
                            </p>
                          </div>

                          <p className="whitespace-pre-line break-words text-sm font-semibold leading-6 text-[#344054]">
                            {remarks}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end xl:justify-start">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9E2EC] bg-white text-sibs-primary-1 transition-all duration-200 ease-out sm:h-11 sm:w-11 sm:rounded-2xl ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      >
                        <ChevronDown size={18} />
                      </span>
                    </div>
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-200 ease-out ${
                    isOpen
                      ? "mt-4 grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <RevisionDocumentSnapshot
                      revision={revision}
                      item={item}
                      revisionLabel={revisionLabel}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-[18px] border border-dashed border-[#BFD6F6] bg-[#F8FAFC] p-6 text-center sm:mt-6 sm:rounded-[20px] sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF2FB] text-sibs-primary-1">
            <History size={24} />
          </div>

          <h4 className="mt-4 text-lg font-extrabold text-[#101828]">
            No revision history yet
          </h4>

          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-sibs-tertiary-5">
            Saved JD revisions will appear here once a new version is created.
          </p>
        </div>
      )}
    </section>
  );
};

export default RevisionHistory;

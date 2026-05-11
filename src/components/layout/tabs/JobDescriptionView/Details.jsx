import React, { useEffect, useMemo } from "react";
import { PencilLine } from "lucide-react";
import { normalizeJdStatus } from "../../../../lib/utils/NormalizeJDStatus";
import { formatDate } from "../../FormatDateTime";
import DesiredCompetenciesViewTable from "../../../tables/jobDescription/DesiredCompetenciesViewTable";

const Details = ({ item, onOpenRevision }) => {
  useEffect(() => {
    console.log("Details item:", item);
  }, [item]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white shadow-2xs">
        <div className="border-b border-[#E6ECF2] px-5 py-4">
          <h3 className="text-base font-extrabold text-[#101828]">
            Record Information
          </h3>

          <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
            Key document details and tracking information.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="border-b border-[#E6ECF2] p-5 lg:border-b-0 lg:border-r">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1/80">
              Document Title
            </p>

            <h3 className="mt-2 text-xl font-extrabold leading-7 text-[#101828]">
              {item.roleTitle || "—"}
            </h3>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DocumentInfoInput label="Position" value={item.roleTitle} />
              <DocumentInfoInput label="Department" value={item.department} />
              <DocumentInfoInput
                label="Prepared For"
                value={item.preparedFor}
              />
              <DocumentInfoInput label="Created By" value={item.requestedBy} />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1">
            <CompactSummaryRow
              label="Document Code"
              value={item.jdCode}
              className="border-b border-r border-[#E6ECF2] lg:border-r-0"
            />

            <CompactSummaryRow
              label="Revision No."
              value={item.currentVersion || "2.0"}
              className="border-b border-[#E6ECF2]"
            />

            <CompactSummaryRow
              label="Effective Date"
              value={formatDate(item.effectiveDate)}
              className="border-r border-[#E6ECF2] lg:border-r-0 lg:border-b"
            />

            <CompactSummaryRow
              label="Last Reviewed"
              value={formatDate(item.lastUpdated)}
            />
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] bg-[#F8FAFC] p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CompactSummaryRow
              label="Date Requested"
              value={formatDate(item.dateRequested)}
            />

            <CompactSummaryRow
              label="Linked Hiring Requirement"
              value={item.linkedHiringRequirement}
            />
          </div>
        </div>
      </section>

      <section className="space-y-7">
        <DetailArticleSection
          title="Job Summary"
          value={item.description}
          emptyText="No job summary provided."
        />

        <DetailArticleSection
          title="Key Responsibilities"
          value={item.responsibilities}
          emptyText="No responsibilities provided."
        />

        <DetailArticleSection
          title="Qualifications"
          value={item.qualifications}
          emptyText="No qualifications provided."
        />

        {String(item.remarks || "").trim() && (
          <DetailArticleSection
            title="Remarks"
            value={item.remarks}
            emptyText="No remarks provided."
          />
        )}

        <DesiredCompetenciesViewTable competencies={item.competencies || []} />
      </section>

      <section className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 shadow-2xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-sibs-primary-1">
              Connection Rule
            </h3>

            <p className="mt-1 text-sm font-medium leading-6 text-sibs-primary-1/80">
              When JD Status is Existing, the role can proceed to sourcing and
              weekly hiring plan execution.
            </p>
          </div>
        </div>
      </section>

      {normalizeJdStatus(item.jdStatus) === "For Revision" && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-amber-700">
                Revision Required
              </h3>

              <p className="mt-2 text-sm font-medium leading-6 text-amber-700/90">
                This job description needs revision before it can be treated as
                sourcing-ready.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenRevision?.(item)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
            >
              <PencilLine size={16} />
              Update Revision and Tag as Existing
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

function DocumentInfoInput({ label, value }) {
  const displayValue = value || "—";

  return (
    <div className="min-w-0 rounded-lg bg-[#F8FAFC] px-4 py-3">
      <p className="truncate text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
        {label}
      </p>

      <p
        title={displayValue}
        className="mt-1 truncate rounded-lg text-sm font-bold 
            leading-5 text-[#344054] hover:cursor-pointer"
      >
        {displayValue}
      </p>
    </div>
  );
}

function CompactSummaryRow({ label, value, className = "" }) {
  return (
    <div
      className={`bg-white px-4 py-3 ${className} ${label == "Date Requested" || label == "Linked Hiring Requirement" ? "rounded-lg" : ""}`}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold leading-5 text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

function parseDetailContent(value) {
  const lines = String(value || "")
    .replace(/\r/g, "")
    .split("\n");

  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({
        type: "list",
        items: [...listItems],
      });

      listItems = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    const isBullet = /^[-•*]\s+/.test(trimmed);
    const isNumbered = /^\d+[.)]\s+/.test(trimmed);

    if (isBullet || isNumbered) {
      listItems.push(
        trimmed.replace(/^[-•*]\s+/, "").replace(/^\d+[.)]\s+/, ""),
      );
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

function DetailArticleSection({ title, value, emptyText }) {
  return (
    <section>
      <h4 className="mb-2 text-base font-extrabold text-[#101828]">{title}</h4>

      <DetailRichContent value={value} emptyText={emptyText} />
    </section>
  );
}

function DetailRichContent({ value, emptyText = "No information provided." }) {
  const blocks = useMemo(() => parseDetailContent(value), [value]);

  if (!String(value || "").trim()) {
    return <p className="text-sm text-sibs-tertiary-5">{emptyText}</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4">
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul
              key={`list-${index}`}
              className="list-disc space-y-2 pl-6 text-[15px] font-medium leading-7 text-[#344054]"
            >
              {block.items.map((listItem, listIndex) => (
                <li key={`item-${listIndex}`}>{listItem}</li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={`paragraph-${index}`}
            className="text-[15px] font-medium leading-8 text-[#344054]"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

function DetailSummaryRow({ label, value }) {
  return (
    <div className="rounded-lg border border-[#E6ECF2] bg-white px-4 py-3">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold leading-5 text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

export default Details;

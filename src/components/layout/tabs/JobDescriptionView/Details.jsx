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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_1px_340px]">
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

      <div className="hidden bg-[#E6ECF2] lg:block" />

      <aside className="space-y-5">
        <section className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-extrabold text-[#101828]">
            Record Information
          </h3>

          <div className="space-y-3">
            <DetailSummaryRow label="Owner" value={item.owner} />

            <DetailSummaryRow label="Requested By" value={item.requestedBy} />

            <DetailSummaryRow
              label="Date Requested"
              value={formatDate(item.dateRequested)}
            />

            <DetailSummaryRow
              label="Last Updated"
              value={formatDate(item.lastUpdated)}
            />

            <DetailSummaryRow
              label="Linked Hiring Requirement"
              value={item.linkedHiringRequirement}
            />
          </div>
        </section>

        <section className="rounded-xl border border-blue-100 bg-blue-50 p-4 w-full">
          <h3 className="text-sm font-extrabold text-sibs-primary-1">
            Connection Rule
          </h3>

          <p className="mt-2 text-sm font-medium leading-6 text-sibs-primary-1/80">
            When JD Status is Existing, the role can proceed to sourcing and
            weekly hiring plan execution.
          </p>
        </section>

        {normalizeJdStatus(item.jdStatus) === "For Revision" && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-amber-700">
              Revision Required
            </h3>

            <p className="mt-2 text-sm font-medium leading-6 text-amber-700/90">
              This job description needs revision before it can be treated as
              sourcing-ready.
            </p>

            <button
              type="button"
              onClick={() => onOpenRevision?.(item)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
            >
              <PencilLine size={16} />
              Update Revision and Tag as Existing
            </button>
          </section>
        )}
      </aside>
    </div>
  );
};

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
            - {block.text}
          </p>
        );
      })}
    </div>
  );
}

function DetailSummaryRow({ label, value }) {
  return (
    <div className="rounded-lg border border-[#E6ECF2] bg-white px-4 py-3">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1/80">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold leading-6 text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

export default Details;

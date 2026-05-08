import React from "react";
import { normalizeJdStatus } from "../../../../lib/utils/NormalizeJDStatus";
import { formatDate } from "../../FormatDateTime";

const Details = ({ item }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-5">
          <div>
            <div className="space-y-5 mt-4">
              <DetailContentBlock
                title="Job Summary"
                value={item.description || "No job summary provided."}
              />

              <DetailContentBlock
                title="Key Responsibilities"
                value={item.responsibilities || "No responsibilities provided."}
              />

              <DetailContentBlock
                title="Qualifications / Requirements"
                value={item.qualifications || "No qualifications provided."}
              />

              <DetailContentBlock
                title="Remarks"
                value={item.remarks || "No remarks provided."}
              />
            </div>
          </div>
        </section>

        <aside className="space-y-5 border-t border-gray-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <section>
            <h3 className="mb-4 text-sm font-extrabold text-[#101828]">
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

          {normalizeJdStatus(item.jdStatus) === "For Revision" && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-extrabold text-amber-700">
                Revision Required
              </h3>

              <p className="mt-2 text-sm font-medium leading-6 text-amber-700/90">
                This job description needs revision before it can be treated as
                sourcing-ready.
              </p>

              <button
                type="button"
                // onClick={() => onOpenRevision(item)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
              >
                <PencilLine size={16} />
                Update Revision and Tag as Existing
              </button>
            </section>
          )}
        </aside>
      </div>

      <section className="w-full rounded-xl border border-blue-100 bg-blue-50 p-4">
        <h3 className="text-sm font-extrabold text-sibs-primary-1">
          Connection Rule
        </h3>

        <p className="mt-2 text-sm font-medium leading-6 text-sibs-primary-1/80">
          When JD Status is Existing, the role can proceed to sourcing and
          weekly hiring plan execution.
        </p>
      </section>
    </div>
  );
};

function DetailContentBlock({ title, value }) {
  return (
    <section>
      <h4 className="mb-2 text-sm font-extrabold text-[#101828]">{title}</h4>

      <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
        <p className="whitespace-pre-line text-sm font-medium leading-7 text-[#344054]">
          {value || "—"}
        </p>
      </div>
    </section>
  );
}

function DetailSummaryRow({ label, value }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1/80">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

export default Details;

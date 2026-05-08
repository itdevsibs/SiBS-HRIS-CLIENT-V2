import React, { useState } from "react";
import { Check, Circle, Clock3 } from "lucide-react";

const approvalSteps = [
  {
    title: "Draft by HR",
    date: "April 18, 2025 09:30 AM",
    owner: "HR - Jessa Marie",
    status: "done",
  },
  {
    title: "Submitted for BOD Approval",
    date: "April 20, 2025 10:15 AM",
    owner: "HR - Jessa Marie",
    status: "done",
  },
  {
    title: "For BOD Approval",
    date: "April 20, 2025 10:15 AM",
    owner: "Pending",
    status: "active",
  },
  {
    title: "Final Approval",
    date: "",
    owner: "Pending",
    status: "pending",
  },
];

const approvers = [
  {
    role: "BOD Member",
    name: "Mrs. Amiee Nadela",
    status: "Pending",
  },
  {
    role: "BOD Member",
    name: "Atty. Raul Nadela Jr.",
    status: "Pending",
  },
];

const Approvals = () => {
  const [revisionReason, setRevisionReason] = useState("");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <section>
        <h3 className="mb-5 text-sm font-extrabold text-[#101828]">
          Approval Flow
        </h3>

        <div className="relative pl-10">
          <div className="absolute left-[14px] top-[14px] bottom-[30px] w-px bg-[#DDE7F3]" />

          <div className="space-y-10">
            {approvalSteps.map((step) => {
              const isDone = step.status === "done";
              const isActive = step.status === "active";

              return (
                <div key={step.title} className="relative">
                  <div
                    className={`absolute -left-10 top-0 z-10 flex h-7 w-7 items-center justify-center rounded-full ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {isDone ? (
                      <Check size={15} strokeWidth={3} />
                    ) : isActive ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-white" />
                    ) : (
                      <Circle size={11} fill="currentColor" />
                    )}
                  </div>

                  <div>
                    <p
                      className={`text-sm font-extrabold leading-5 ${
                        isActive ? "text-blue-600" : "text-[#101828]"
                      }`}
                    >
                      {step.title}
                    </p>

                    {step.date && (
                      <p className="mt-1 text-xs font-semibold text-[#1E5A92]">
                        {step.date}
                      </p>
                    )}

                    <p className="mt-1 text-xs font-bold text-[#344054]">
                      {step.owner}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-[#E6ECF2] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
          <h3 className="mb-5 text-sm font-extrabold text-[#101828]">
            Approver
          </h3>

          <div className="space-y-4">
            {approvers.map((approver, index) => (
              <div
                key={`${approver.name}-${index}`}
                className="grid grid-cols-1 items-center gap-3 md:grid-cols-[120px_1fr_90px]"
              >
                <p className="text-sm font-bold text-[#344054]">
                  {approver.role}
                </p>

                <select
                  defaultValue={approver.name}
                  className="h-10 rounded-md border border-[#DDE7F3] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option>{approver.name}</option>
                </select>

                <p className="inline-flex items-center gap-1 text-sm font-semibold text-sibs-tertiary-5">
                  <Clock3 size={14} />
                  {approver.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-[#101828]">
            Revision Request
          </h3>

          <p className="mt-2 text-xs font-semibold text-[#344054]">
            If revision is needed, please specify the reason.
          </p>

          <textarea
            value={revisionReason}
            onChange={(e) => setRevisionReason(e.target.value)}
            rows={4}
            placeholder="Enter reason..."
            className="mt-3 w-full resize-none rounded-md border border-[#DDE7F3] bg-white px-3 py-2 text-sm text-[#344054] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-100"
            >
              Request Revision
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Approvals;

import { X, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  inputClass,
  textareaClass,
  toDisplayPersonName,
} from "../../../lib/utils/talentPool/talentPoolHelpers";
import {
  AVAILABLE_POSITIONS_STORAGE_KEY,
  PIPELINE_CANDIDATES_STORAGE_KEY,
} from "../../../lib/utils/talentPool/talentPoolConstants";
import { FieldLabel } from "../../recruitment/talentPool/TalentPoolShared";

function safeJsonParse(value, fallback = []) {
  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? parsedValue : fallback;
  } catch {
    return fallback;
  }
}

function normalizeAccountName(value) {
  const text = String(value || "").trim();

  if (
    !text ||
    text === "—" ||
    text === "--" ||
    text.toLowerCase() === "not assigned yet" ||
    text.toLowerCase() === "n/a" ||
    text.toLowerCase() === "na"
  ) {
    return "";
  }

  return text;
}

function getUniqueAccountOptions(items = []) {
  const accountSet = new Set();

  items.forEach((item) => {
    [
      item.account,
      item.accountName,
      item.accountFit,
      item.appliedAccount,
      item.currentAppliedAccount,
      item.finalAccount,
      item.leadAccount,
      item.clientAccount,
      item.department,
    ].forEach((value) => {
      const normalizedValue = normalizeAccountName(value);

      if (normalizedValue) {
        accountSet.add(normalizedValue);
      }
    });
  });

  return Array.from(accountSet).sort((a, b) => a.localeCompare(b));
}

export default function MoveToPipeLineModal() {
  const {
    pipelineTarget,
    moveToPipelineForm,
    setMoveToPipelineForm,
    currentTaOwner,
    closeMoveToPipeline,
    submitMoveToPipeline,
  } = useTalentPool();

  const accountOptions = useMemo(() => {
    const availablePositions = safeJsonParse(
      localStorage.getItem(AVAILABLE_POSITIONS_STORAGE_KEY),
      [],
    );

    const pipelineCandidates = safeJsonParse(
      localStorage.getItem(PIPELINE_CANDIDATES_STORAGE_KEY),
      [],
    );

    return getUniqueAccountOptions([
      ...availablePositions,
      ...pipelineCandidates,
    ]);
  }, [pipelineTarget]);

  if (!pipelineTarget) return null;

  const ownerName = toDisplayPersonName(
    moveToPipelineForm.taOwner || currentTaOwner,
    "Current User",
  );

  const selectedLeadAccount =
    moveToPipelineForm.leadAccount ||
    pipelineTarget.leadAccount ||
    pipelineTarget.accountFit ||
    pipelineTarget.appliedAccount ||
    pipelineTarget.currentAppliedAccount ||
    "";

  return (
    <div
      className="fixed inset-0 z-[10002] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={closeMoveToPipeline}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1">
              Move to Candidate Pipeline
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {pipelineTarget.name}
            </p>
          </div>

          <button
            type="button"
            onClick={closeMoveToPipeline}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submitMoveToPipeline} className="space-y-4 p-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
            This will create a pipeline application directly under Initial
            Screening. The lead account will be captured for tracking, while
            final role and final account will still be assigned later during the
            Offered stage.
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>TA Owner</FieldLabel>
              <input
                value={ownerName}
                readOnly
                className={inputClass("bg-[#F8FAFC]")}
              />
              <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                Automatically captured from the logged-in user.
              </p>
            </div>

            <div>
              <FieldLabel>Initial Stage</FieldLabel>
              <input
                value="Initial Screening"
                readOnly
                className={inputClass("bg-[#F8FAFC]")}
              />
              <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                Match tagging starts in Candidate Pipeline.
              </p>
            </div>
          </div>

          <div>
            <FieldLabel>Lead Account</FieldLabel>
            <select
              value={selectedLeadAccount}
              onChange={(event) =>
                setMoveToPipelineForm({
                  ...moveToPipelineForm,
                  leadAccount: event.target.value,
                })
              }
              className={inputClass()}
            >
              <option value="">Select lead account</option>

              {accountOptions.map((account) => (
                <option key={account} value={account}>
                  {account}
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
              This is the lead/prospect account for tracking. Final account can
              still be changed during the Offered stage.
            </p>
          </div>

          <div>
            <FieldLabel>Remarks</FieldLabel>
            <textarea
              rows={4}
              value={moveToPipelineForm.remarks}
              onChange={(event) =>
                setMoveToPipelineForm({
                  ...moveToPipelineForm,
                  remarks: event.target.value,
                })
              }
              className={textareaClass()}
              placeholder="Optional notes before moving this candidate to Initial Screening."
            />
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeMoveToPipeline}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={submitMoveToPipeline}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95"
            >
              <ArrowRight size={16} />
              Move Candidate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

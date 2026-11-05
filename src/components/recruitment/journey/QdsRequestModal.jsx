import { Send, ShieldCheck } from "lucide-react";
import { ModalShell, SelectDropdown } from "@/components/ui";
export default function QdsRequestModal({ trainees = [], formId = "qds-request-form", error, showQdsModal, setShowQdsModal, qdsTargetEmp, setQdsTargetEmp, qdsType, setQdsType, qdsNotes, setQdsNotes, qdsDue, setQdsDue, handleCreateQdsRequest }) {
return (      <ModalShell
        open={showQdsModal}
        onClose={() => setShowQdsModal(false)}
        variant="navy"
        maxWidth="max-w-lg"
        icon={ShieldCheck}
        title="Request QDS Review / Follow-Up"
        subtitle="Escalate to Quality Lead for independent audit or calibration"
        bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-5 font-jakarta space-y-4"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowQdsModal(false)}
              className="sibs-modal-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={formId}
              className="sibs-modal-btn-primary"
            >
              <Send size={13} />
              <span>Submit QDS Request</span>
            </button>
          </div>
        }
      >
        <form id={formId} onSubmit={handleCreateQdsRequest} className="space-y-4 text-xs font-jakarta">
          {error && <p role="alert" className="sibs-badge-danger">{error}</p>}
          <SelectDropdown
            label="Target Trainee"
            value={qdsTargetEmp}
            onChange={setQdsTargetEmp}
            searchable
            options={trainees.map((t) => ({
              value: t.sibsEmployeeId || t.id,
              label: `${t.fullName} (${t.sibsEmployeeId || t.id}) • ${t.account} (Trainer: ${t.trainerName || "Unassigned"})`,
            }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectDropdown
              label="Request Type"
              value={qdsType}
              onChange={setQdsType}
              options={[
                { value: "Trainer coaching review", label: "Trainer coaching review" },
                { value: "Independent QA recheck", label: "Independent QA recheck" },
                { value: "Targeted trainee support", label: "Targeted trainee support" },
              ]}
            />

            <div>
              <label className="sibs-modal-field-label">Target Due Date</label>
              <input
                type="date"
                value={qdsDue}
                onChange={(e) => setQdsDue(e.target.value)}
                className="sibs-modal-input"
              />
            </div>
          </div>

          <div>
            <label className="sibs-modal-field-label">Observation & Instructions</label>
            <textarea
              rows={3}
              required
              placeholder="Detail the specific call/case reference or rationale for this QDS review..."
              value={qdsNotes}
              onChange={(e) => setQdsNotes(e.target.value)}
              className="sibs-modal-textarea"
            />
          </div>

          <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border text-xs space-y-1">
            <span className="sibs-text-micro font-extrabold text-sibs-navy uppercase tracking-wider block">
              Routing Note:
            </span>
            <p className="sibs-text-micro text-sibs-muted">
              This request will be routed directly to the Quality Development Specialist (QDS) queue with high-priority tracking.
            </p>
          </div>
        </form>
      </ModalShell>);
}

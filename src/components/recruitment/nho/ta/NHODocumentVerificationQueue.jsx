import { useState, useMemo } from "react";
import { useNHO } from "../NHOContext";
import NHODocumentVerificationModal from "./NHODocumentVerificationModal";
import SearchInput from "@/components/ui/SearchInput";
import {
  FileCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Eye,
  Clock,
} from "lucide-react";

function NHODocumentVerificationQueue() {
  const { applicants, verifyDocument, returnDocumentForCorrection, showToast } = useNHO();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("For Verification");
  const [selectedApplicantFilter, setSelectedApplicantFilter] = useState("all");
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [inlineReturnItem, setInlineReturnItem] = useState(null);
  const [inlineRemarks, setInlineRemarks] = useState("");

  const allItems = useMemo(() => {
    const list = [];
    applicants.forEach((app) => {
      app.documents.forEach((doc) => {
        if (doc.status !== "Not Submitted" || doc.fileName || doc.submittedDate) {
          list.push({ applicant: app, document: doc });
        }
      });
    });
    return list;
  }, [applicants]);

  const metrics = useMemo(() => {
    const pendingVerification = allItems.filter((i) => i.document.status === "For Verification").length;
    const verified = allItems.filter((i) => i.document.status === "Verified").length;
    const needsCorrection = allItems.filter((i) => i.document.status === "Needs Correction").length;
    const majorsCount = allItems.filter((i) => i.document.isMajor && i.document.status === "For Verification").length;
    return {
      pendingVerification,
      verified,
      needsCorrection,
      majorsCount,
    };
  }, [allItems]);

  const filteredItems = useMemo(() => {
    return allItems.filter(({ applicant, document }) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        applicant.fullName.toLowerCase().includes(q) ||
        applicant.applicantNumber.toLowerCase().includes(q) ||
        document.name.toLowerCase().includes(q) ||
        (document.fileName || "").toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (categoryFilter === "major" && !document.isMajor) return false;
      if (categoryFilter === "agreement" && !document.isEssentialAgreement) return false;
      if (categoryFilter === "other" && (document.isMajor || document.isEssentialAgreement)) return false;
      if (statusFilter !== "all" && document.status !== statusFilter) return false;
      if (selectedApplicantFilter !== "all" && applicant.id !== selectedApplicantFilter) return false;
      return true;
    });
  }, [allItems, searchQuery, categoryFilter, statusFilter, selectedApplicantFilter]);

  const handleQuickVerify = (appId, docId) => {
    verifyDocument(appId, docId);
  };

  const handleConfirmInlineReturn = () => {
    if (!inlineReturnItem) return;
    if (!inlineRemarks.trim()) {
      showToast("Please enter mandatory correction remarks.", "error");
      return;
    }
    returnDocumentForCorrection(inlineReturnItem.applicant.id, inlineReturnItem.document.id, inlineRemarks);
    setInlineReturnItem(null);
    setInlineRemarks("");
  };

  return (
    <div className="min-w-0 space-y-5 font-jakarta">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          { label: "For Verification", value: metrics.pendingVerification, note: "Requires TA review", icon: Clock, tone: "text-amber-600", background: "bg-amber-50 border-amber-100" },
          { label: "Pending Majors", value: metrics.majorsCount, note: "Major requirements in queue", icon: FileText, tone: "text-sibs-orange", background: "bg-orange-50 border-orange-100" },
          { label: "Verified Records", value: metrics.verified, note: "Approved by TA / HR", icon: CheckCircle, tone: "text-emerald-600", background: "bg-emerald-50 border-emerald-100" },
          { label: "Needs Correction", value: metrics.needsCorrection, note: "Returned to applicant", icon: AlertTriangle, tone: "text-red-600", background: "bg-red-50 border-red-100" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="flex min-h-[86px] sm:min-h-[92px] flex-col justify-between rounded-xl border border-sibs-border bg-white p-3 shadow-xs transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className={`sibs-text-micro font-extrabold uppercase tracking-wider ${card.tone} truncate`}>
                  {card.label}
                </span>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${card.background} ${card.tone}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-1">
                <div className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-sibs-navy font-heading">
                  {card.value}
                </div>
                <div className="mt-0.5 sibs-text-micro font-medium text-sibs-muted truncate" title={card.note}>
                  {card.note}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and records */}
      <section
        className="sibs-page-card-in min-w-0 rounded-2xl border border-sibs-border bg-white p-4 shadow-xs sm:p-5"
        style={{ animationDelay: "220ms", animationFillMode: "both" }}
      >
        <div className="mb-4">
          <h2 className="text-base font-extrabold tracking-tight text-sibs-navy">Document Verification Records</h2>
          <p className="mt-0.5 sibs-text-micro font-medium text-sibs-muted">
            Review submitted requirements, verify eligible documents, or request corrections.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-12">
          <div className="sm:col-span-2 xl:col-span-5">
            <SearchInput
              label="Search"
              labelClassName="block sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-navy mb-1"
              placeholder="Search applicant, requirement, or file name..."
              value={searchQuery}
              onChange={(val) => setSearchQuery(typeof val === "string" ? val : val?.target?.value || "")}
              inputClassName="!h-8.5 text-xs"
            />
          </div>

          <label className="space-y-1 xl:col-span-2">
            <span className="block sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-navy">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full !h-8.5 rounded-xl border border-sibs-border bg-white px-3 text-xs font-semibold text-sibs-navy focus:border-sibs-orange focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="major">Major Requirements (4)</option>
              <option value="agreement">Essential Agreements (3)</option>
              <option value="other">Other Non-Majors</option>
            </select>
          </label>

          <label className="space-y-1 xl:col-span-2">
            <span className="block sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-navy">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full !h-8.5 rounded-xl border border-sibs-border bg-white px-3 text-xs font-semibold text-sibs-navy focus:border-sibs-orange focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="For Verification">For Verification Only</option>
              <option value="Verified">Verified</option>
              <option value="Needs Correction">Needs Correction</option>
            </select>
          </label>

          <label className="space-y-1 xl:col-span-3">
            <span className="block sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-navy">Applicant</span>
            <select
              value={selectedApplicantFilter}
              onChange={(e) => setSelectedApplicantFilter(e.target.value)}
              className="w-full !h-8.5 rounded-xl border border-sibs-border bg-white px-3 text-xs font-semibold text-sibs-navy focus:border-sibs-orange focus:outline-none"
            >
              <option value="all">All Applicants</option>
              {applicants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-sibs-border px-4 pt-2 bg-sibs-surface/50">
            <div className="flex items-center gap-2 border-b-2 border-sibs-orange px-1 pb-3 pt-1 text-xs font-extrabold text-sibs-orange">
              <FileCheck className="h-3.5 w-3.5" /> REQUIREMENTS
              <span className="rounded-full bg-sibs-navy px-2 py-0.5 sibs-text-micro font-extrabold text-white">
                {filteredItems.length}
              </span>
            </div>
            <span className="pb-2 sibs-text-micro font-medium text-sibs-muted">
              {filteredItems.length} of {allItems.length} records
            </span>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-sibs-border bg-sibs-surface text-[10px] font-extrabold uppercase tracking-wider text-sibs-muted">
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-3 py-3">Requirement Name</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Submission Details</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sibs-border">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sibs-muted italic">
                      No documents found matching the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(({ applicant, document }) => {
                    const isVer = document.status === "Verified";
                    const isPending = document.status === "For Verification";
                    const isNeedsCorr = document.status === "Needs Correction";
                    return (
                      <tr
                        key={`${applicant.id}-${document.id}`}
                        className="hover:bg-sibs-surface/80 transition-colors"
                      >
                        {/* Applicant */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-sibs-navy">{applicant.fullName}</div>
                          <div className="sibs-text-micro text-sibs-muted font-mono">
                            {applicant.applicantNumber} • {applicant.position}
                          </div>
                        </td>

                        {/* Requirement Name */}
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-sibs-navy">{document.name}</div>
                          <div className="sibs-text-micro text-sibs-muted">
                            {document.templateCode || "Standard Requirement"}
                          </div>
                          {isNeedsCorr && document.correctionRemarks && (
                            <div className="mt-1 sibs-text-micro text-red-700 bg-red-50 p-1.5 rounded border border-red-200">
                              <strong>Correction:</strong> {document.correctionRemarks}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-3">
                          <span
                            className={
                              document.isMajor
                                ? "sibs-badge-amber"
                                : document.isEssentialAgreement
                                ? "sibs-badge-purple"
                                : "sibs-badge-secondary"
                            }
                          >
                            {document.isMajor
                              ? "Major (Mandatory)"
                              : document.isEssentialAgreement
                              ? "Agreement"
                              : "Non-Major"}
                          </span>
                        </td>

                        {/* Submission Details */}
                        <td className="py-3.5 px-3">
                          <div className="text-sibs-navy font-mono text-[11px]">
                            {document.fileName ||
                              (document.signatureDataUrl
                                ? "Electronic Signature Captured"
                                : "Physical Copy / Upload")}
                          </div>
                          <div className="sibs-text-micro text-sibs-muted">
                            {document.submittedDate ? `Submitted: ${document.submittedDate}` : "Session Recorded"}
                            {document.fileSize ? ` (${document.fileSize})` : ""}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3">
                          <span
                            className={
                              isVer
                                ? "sibs-badge-success inline-flex items-center gap-1"
                                : isPending
                                ? "sibs-badge-info inline-flex items-center gap-1"
                                : isNeedsCorr
                                ? "sibs-badge-danger inline-flex items-center gap-1"
                                : "sibs-badge-secondary"
                            }
                          >
                            {isVer && <CheckCircle className="w-3 h-3 text-green-600" />}
                            {isPending && <Clock className="w-3 h-3 text-blue-600" />}
                            {isNeedsCorr && <AlertTriangle className="w-3 h-3 text-red-600" />}
                            <span>{document.status}</span>
                          </span>
                          {isVer && document.verifiedBy && (
                            <span className="text-[9.5px] text-sibs-muted block mt-0.5">
                              by {document.verifiedBy.split(" ")[0]}
                            </span>
                          )}
                        </td>

                        {/* Verification Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveModalItem({ applicant, document })}
                              aria-label={`Preview ${document.name} for ${applicant.fullName}`}
                              className="p-1.5 rounded-lg bg-sibs-surface hover:bg-slate-200 text-sibs-muted hover:text-sibs-navy transition-colors cursor-pointer"
                              title="Inspect File Preview & Audit"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {!isVer && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setInlineReturnItem({ applicant, document })}
                                  className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] border border-red-200 transition-colors cursor-pointer"
                                >
                                  Needs Correction
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickVerify(applicant.id, document.id)}
                                  className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Verify</span>
                                </button>
                              </>
                            )}

                            {isVer && (
                              <button
                                type="button"
                                onClick={() => setInlineReturnItem({ applicant, document })}
                                className="px-2 py-1 rounded-lg bg-sibs-surface hover:bg-slate-100 text-sibs-muted font-semibold text-[10px] border border-sibs-border transition-colors cursor-pointer"
                                title="Authorized TA Correction: Return previously verified item"
                              >
                                Correction
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal Audit Inspection */}
      {activeModalItem && (
        <NHODocumentVerificationModal
          isOpen={!!activeModalItem}
          onClose={() => setActiveModalItem(null)}
          document={activeModalItem.document}
          applicantId={activeModalItem.applicant.id}
          applicantName={activeModalItem.applicant.fullName}
        />
      )}

      {/* Inline Needs Correction Dialog */}
      {inlineReturnItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-sibs-border text-xs space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-sibs-navy">Return Document for Correction</h3>
              <p className="sibs-text-micro text-sibs-muted mt-0.5">
                Candidate: <strong className="text-sibs-navy">{inlineReturnItem.applicant.fullName}</strong> • Requirement: <strong className="text-sibs-navy">{inlineReturnItem.document.name}</strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-sibs-navy block sibs-text-xs">
                Mandatory Correction Remarks:
              </label>
              <textarea
                rows={3}
                value={inlineRemarks}
                onChange={(e) => setInlineRemarks(e.target.value)}
                placeholder="Detail specifically what must be corrected (e.g. Blurry scan, illegible dry seal, expired certificate, missing page 2)..."
                className="w-full p-2.5 border border-sibs-border rounded-xl text-xs focus:outline-none focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setInlineReturnItem(null);
                  setInlineRemarks("");
                }}
                className="sibs-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmInlineReturn}
                className="sibs-btn-danger"
              >
                Confirm Return for Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NHODocumentVerificationQueue;

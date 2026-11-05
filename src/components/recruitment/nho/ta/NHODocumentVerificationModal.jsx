import { useState } from "react";
import { useNHO } from "../NHOContext";
import {
  X,
  CheckCircle,
  FileText,
} from "lucide-react";

function NHODocumentVerificationModal({
  isOpen,
  onClose,
  document,
  applicantId,
  applicantName,
}) {
  const { verifyDocument, returnDocumentForCorrection, showToast } = useNHO();
  const [remarks, setRemarks] = useState("");
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);

  if (!isOpen || !document) return null;

  const handleVerify = () => {
    verifyDocument(applicantId, document.id);
    onClose();
  };

  const handleReturn = () => {
    if (!remarks.trim()) {
      showToast("Please provide mandatory correction remarks explaining why this document is returned.", "error");
      return;
    }
    returnDocumentForCorrection(applicantId, document.id, remarks);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-jakarta">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-sibs-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-sibs-navy text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold tracking-tight">
              Document Verification &amp; Audit
            </h2>
            <p className="sibs-text-micro text-slate-300">
              Candidate: <strong className="text-white">{applicantName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Content & Details */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sibs-scrollbar">
          <div className="bg-sibs-surface border border-sibs-border p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sibs-navy text-sm">{document.name}</span>
              <span
                className={
                  document.status === "Verified"
                    ? "sibs-badge-success"
                    : document.status === "For Verification"
                    ? "sibs-badge-info"
                    : document.status === "Needs Correction"
                    ? "sibs-badge-danger"
                    : "sibs-badge-secondary"
                }
              >
                {document.status}
              </span>
            </div>
            <p className="sibs-text-micro text-sibs-muted">
              {document.description || "SiBS Official Orientation & Pre-Employment Documentation"}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sibs-border sibs-text-micro text-sibs-muted">
              <div><strong className="text-sibs-navy">Category:</strong> {document.category}</div>
              <div><strong className="text-sibs-navy">Template Code:</strong> {document.templateCode || "—"}</div>
              <div><strong className="text-sibs-navy">Submitted Method:</strong> {document.submissionMethod || "Direct Upload"}</div>
              <div><strong className="text-sibs-navy">Submitted Date:</strong> {document.submittedDate || "Not Submitted"}</div>
            </div>
          </div>

          {/* Visual Preview Area */}
          <div className="border border-sibs-border rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-sibs-navy">
              <span>Submitted Artifact Preview:</span>
              <span className="sibs-text-micro text-sibs-muted font-mono">
                {document.fileName || "Simulated_Document.pdf"}
              </span>
            </div>

            {/* Signature Preview if e-signed */}
            {document.signatureDataUrl ? (
              <div className="p-3 bg-sibs-surface border border-sibs-border rounded-lg text-center space-y-1">
                <span className="sibs-text-micro text-sibs-muted uppercase font-semibold">
                  Captured Electronic Drawn Signature:
                </span>
                <img
                  src={document.signatureDataUrl}
                  alt="Applicant Drawn Signature"
                  className="max-h-24 mx-auto border border-dashed border-sibs-border rounded p-1 bg-white"
                />
                <span className="sibs-text-micro text-sibs-muted block">
                  Signer: {applicantName} • Date: {document.submittedDate}
                </span>
              </div>
            ) : (
              <div className="p-6 bg-sibs-surface border border-sibs-border rounded-lg text-center space-y-2">
                <FileText className="w-10 h-10 text-sibs-muted mx-auto" />
                <span className="text-xs font-bold text-sibs-navy block">
                  {document.fileName || "Verified Document Content"}
                </span>
                <span className="sibs-text-micro text-sibs-muted block">
                  Simulated verified attachment conforming to SiBS document standards.
                </span>
              </div>
            )}
          </div>

          {/* Correction Form if requested */}
          {showCorrectionForm && (
            <div className="p-4 bg-red-50/80 border border-red-200 rounded-xl space-y-2">
              <span className="font-bold text-red-900 block text-xs">
                Enter Mandatory Correction Remarks for Candidate:
              </span>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Scanned document is blurry, page 2 is missing, or signature does not match ID..."
                className="w-full p-2.5 bg-white border border-red-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCorrectionForm(false)}
                  className="sibs-btn-secondary !py-1 !px-3"
                >
                  Cancel Return
                </button>
                <button
                  type="button"
                  onClick={handleReturn}
                  className="sibs-btn-danger !py-1 !px-4"
                >
                  Confirm Return for Correction
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!showCorrectionForm && (
          <div className="px-6 py-4 bg-sibs-surface border-t border-sibs-border flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowCorrectionForm(true)}
              className="sibs-btn-danger"
            >
              Needs Correction (Return)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="sibs-btn-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleVerify}
                className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Verify Document</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NHODocumentVerificationModal;

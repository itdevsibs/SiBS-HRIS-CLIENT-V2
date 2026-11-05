import { useState } from "react";
import { useNHO } from "../NHOContext";
import {
  X,
  Mail,
  Send,
  Copy,
  Check,
  Key,
  Clock,
  RotateCcw,
  Smartphone,
  Sparkles
} from "lucide-react";
function NHOSendCredentialsModal({
  applicant,
  isOpen,
  onClose
}) {
  const { sendTempAccessCredentialsLink, recoverRetrievalLink, showToast } = useNHO();
  const [channel, setChannel] = useState("Both");
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  if (!isOpen || !applicant) return null;
  const portalUrl = `https://sibs.hris.internal/nho-portal?token=${applicant.passwordRetrievalToken || "TOKEN-NHO"}`;
  const token = applicant.passwordRetrievalToken || "TOKEN-INITIAL-2026";
  const expiresAt = applicant.retrievalLinkExpiresAt || "24 Hours from Dispatch";
  const handleCopyLinkAndCredentials = () => {
    const textToCopy = `SiBS Employee Portal Temporary Access Link & Credentials:
Candidate: ${applicant.fullName} (${applicant.applicantNumber})
Portal Link: ${portalUrl}
Access Token: ${token}
Expires: ${expiresAt}
Note: Please use this link to retrieve your temporary password and complete initial password setup.`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      showToast("Portal link and temporary access credentials copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2e3);
    });
  };
  const handleSendDispatch = () => {
    setIsSending(true);
    setTimeout(() => {
      const res = sendTempAccessCredentialsLink(applicant.id, channel);
      setIsSending(false);
      if (res.success) {
        onClose();
      }
    }, 400);
  };
  const handleReissueToken = () => {
    recoverRetrievalLink(applicant.id);
  };
  return <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 font-jakarta">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-sibs-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {
    /* Header */
  }
        <div className="px-6 py-4 border-b border-sibs-border bg-sibs-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sibs-navy text-white flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5 text-sibs-orange" />
            </div>
            <div>
              <h2 className="text-base font-bold text-sibs-navy tracking-tight">
                Send Temporary Access Link & Portal Credentials
              </h2>
              <p className="text-xs text-slate-500">
                TA Dispatch • Employee Portal Invitation & Temporary Password Link
              </p>
            </div>
          </div>
          <button
    onClick={onClose}
    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
  >
            <X className="w-5 h-5" />
          </button>
        </div>

        {
    /* Content Body */
  }
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {
    /* Candidate Profile Box */
  }
          <div className="bg-sibs-surface border border-sibs-border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sibs-navy text-sm">{applicant.fullName}</span>
                <span className="text-[10px] font-mono text-slate-500 bg-white border border-sibs-border px-2 py-0.5 rounded">
                  {applicant.applicantNumber}
                </span>
              </div>
              <p className="text-slate-600 mt-0.5">
                {applicant.position} • {applicant.account}
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Email: <strong className="text-slate-700">{applicant.email}</strong> • Mobile: <strong className="text-slate-700">{applicant.phone}</strong>
              </p>
            </div>

            <div className="shrink-0 text-right">
              <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] ${applicant.tempAccessStatus === "Active" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                Access Status: {applicant.tempAccessStatus}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">
                NHO Session: {applicant.scheduledNhoDate}
              </p>
            </div>
          </div>

          {
    /* Temporary Credentials & Access Details Card */
  }
          <div className="border border-sibs-border rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sibs-navy font-bold">
                <Key className="w-4 h-4 text-sibs-orange" />
                <span className="uppercase text-[11px] tracking-wider">Access Token & Credentials Summary</span>
              </div>
              <button
    type="button"
    onClick={handleReissueToken}
    className="text-[11px] text-sibs-navy hover:text-sibs-orange font-bold flex items-center gap-1 cursor-pointer transition-colors"
    title="Invalidates old token and issues a fresh 24-hr token"
  >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-issue / Refresh Token</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white border border-sibs-border p-2.5 rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">One-Time Token</span>
                <div className="font-mono font-bold text-sibs-navy text-sm break-all">{token}</div>
              </div>

              <div className="bg-white border border-sibs-border p-2.5 rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">24-Hr Expiration</span>
                <div className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{expiresAt}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-sibs-border p-2.5 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Direct Employee Portal Link</span>
              <div className="font-mono text-slate-600 text-[11px] truncate">{portalUrl}</div>
            </div>
          </div>

          {
    /* Dispatch Method Channel */
  }
          <div className="space-y-2">
            <label className="font-bold text-sibs-navy text-[11px] uppercase tracking-wider block">
              Dispatch Delivery Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
    { id: "Email", label: "Email Only", icon: Mail },
    { id: "SMS", label: "SMS Alert", icon: Smartphone },
    { id: "Both", label: "Email & SMS (Rec.)", icon: Sparkles }
  ].map((item) => {
    const Icon = item.icon;
    const isSelected = channel === item.id;
    return <button
      key={item.id}
      type="button"
      onClick={() => setChannel(item.id)}
      className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isSelected ? "bg-sibs-navy text-white border-sibs-navy shadow-xs" : "bg-white text-slate-700 border-sibs-border hover:bg-slate-50"}`}
    >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-sibs-orange" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </button>;
  })}
            </div>
          </div>

          {
    /* Email / SMS Notification Preview */
  }
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-sibs-navy text-[11px] uppercase tracking-wider">
                Notification Message Preview
              </label>
              <button
    type="button"
    onClick={handleCopyLinkAndCredentials}
    className="text-[11px] text-sibs-navy hover:text-sibs-orange font-bold flex items-center gap-1 cursor-pointer"
  >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Link & Credentials"}</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] space-y-2 border border-slate-800 shadow-inner">
              <div className="text-slate-400 border-b border-slate-800 pb-1.5 flex justify-between">
                <span><strong>To:</strong> {applicant.email} ({applicant.phone})</span>
                <span className="text-emerald-400 font-bold">SMTP Relay Active</span>
              </div>
              <div className="text-amber-300 font-bold">
                Subject: SiBS Employee Portal — Your NHO Temporary Access Credentials
              </div>
              <p className="text-slate-300 leading-relaxed">
                Dear {applicant.fullName},<br /><br />
                Welcome to SiBS! You have been granted temporary access to the Employee NHO Portal. Please use the direct link below to retrieve your initial temporary password and complete your mandatory first-login setup:
              </p>
              <div className="bg-slate-800 p-2.5 rounded text-slate-100 border border-slate-700 my-2 space-y-1">
                <div>🔑 <strong>Portal URL:</strong> {portalUrl}</div>
                <div>🛡️ <strong>Access Token:</strong> {token}</div>
                <div>⏳ <strong>Expiration:</strong> {expiresAt} (24-Hour Limit)</div>
              </div>
              <p className="text-slate-400 text-[10px]">
                Note: Upon first login, you will be prompted to set a personal password before uploading major requirements and essential agreements.
              </p>
            </div>
          </div>
        </div>

        {
    /* Footer Actions */
  }
        <div className="px-6 py-4 border-t border-sibs-border bg-sibs-surface flex items-center justify-between gap-3 shrink-0">
          <button
    type="button"
    onClick={handleCopyLinkAndCredentials}
    className="px-4 py-2 rounded-xl bg-white border border-sibs-border text-sibs-navy hover:bg-slate-100 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
  >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? "Copied" : "Copy to Clipboard"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
    type="button"
    onClick={onClose}
    className="px-4 py-2 rounded-xl bg-white border border-sibs-border text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer transition-colors"
  >
              Cancel
            </button>

            <button
    type="button"
    onClick={handleSendDispatch}
    disabled={isSending}
    className="px-5 py-2 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2 transition-colors disabled:opacity-50"
  >
              {isSending ? <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending Notification...</span>
                </> : <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Link & Credentials ({channel})</span>
                </>}
            </button>
          </div>
        </div>
      </div>
    </div>;
}
export {
  NHOSendCredentialsModal as default
};

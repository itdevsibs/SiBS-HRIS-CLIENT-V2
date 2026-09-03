import { Check, Copy } from "lucide-react";

export default function ProfileCopyButton({ value, copyKey, copiedKey, onCopy }) {
  if (!value) return null;

  return (
    <button
      type="button"
      onClick={() => onCopy(value, copyKey)}
      className="rounded-lg p-1.5 text-sibs-muted hover:bg-white hover:text-sibs-navy transition-colors"
      title="Copy value"
    >
      {copiedKey === copyKey ? (
        <Check size={15} className="text-emerald-600" />
      ) : (
        <Copy size={15} />
      )}
    </button>
  );
}

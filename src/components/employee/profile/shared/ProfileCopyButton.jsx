import { Check, Copy } from "lucide-react";

export default function ProfileCopyButton({ value, copyKey, copiedKey, onCopy }) {
  if (!value) return null;

  return (
    <button
      type="button"
      onClick={() => onCopy(value, copyKey)}
      className="rounded-lg p-1.5 text-[#667085] hover:bg-white hover:text-[#042C51]"
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

export default function ProfileEmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="sibs-empty-panel rounded-xl border-2 border-dashed border-slate-200 bg-[#F8FAFC] px-5 py-10 text-center">
      <p className="text-xs font-semibold text-slate-400">{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 text-xs font-black text-[#042C51] hover:text-[#FF5C28]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

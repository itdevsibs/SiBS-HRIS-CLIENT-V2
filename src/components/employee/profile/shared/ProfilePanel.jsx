export default function ProfilePanel({
  title,
  accent = "orange",
  children,
  className = "",
}) {
  const dotClass = accent === "navy" ? "bg-[#042C51]" : "bg-[#FF5C28]";

  return (
    <section
      className={`rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 transition hover:border-slate-300 ${className}`}
    >
      {title ? (
        <h3 className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2.5 text-[11px] font-black uppercase tracking-wider text-[#042C51]">
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  );
}

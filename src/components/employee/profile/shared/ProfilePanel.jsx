export default function ProfilePanel({
  title,
  accent = "orange",
  children,
  className = "",
}) {
  const dotClass = accent === "navy" ? "bg-sibs-navy" : "bg-sibs-orange";

  return (
    <section
      className={`rounded-xl border border-sibs-border bg-sibs-surface p-4 transition hover:border-sibs-border-subtle font-jakarta ${className}`}
    >
      {title ? (
        <h3 className="mb-4 flex items-center gap-2 border-b border-sibs-border pb-2.5 font-heading text-xs 2xl:text-sm font-bold text-sibs-navy tracking-tight">
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  );
}

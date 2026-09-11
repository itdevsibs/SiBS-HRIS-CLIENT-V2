import React from "react";

export default function PageHeaderHero({
  kicker = "Recruitment View",
  title,
  description,
  actions = null,
  className = "",
  pulse = true,
}) {
  return (
    <section
      className={`sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-sibs-border bg-white p-3.5 sm:p-4 2xl:p-6 font-jakarta shadow-sm ${className}`.trim()}
      style={{ animationDelay: "0ms", animationFillMode: "both" }}
    >
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-0.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1">
          {kicker ? (
            <div className="flex flex-wrap items-center gap-2">
              {React.isValidElement(kicker) ? (
                kicker
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-sibs-navy">
                  {pulse ? (
                    <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
                  ) : null}
                  {kicker}
                </span>
              )}
            </div>
          ) : null}

          {title ? (
            <h1 className="font-heading break-words text-lg sm:text-xl 2xl:text-3xl font-bold tracking-tight text-sibs-navy">
              {title}
            </h1>
          ) : null}

          {description ? (
            <p className="max-w-4xl sibs-text-xs sm:sibs-text-sm font-semibold leading-relaxed text-sibs-muted">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 2xl:gap-2.5 self-stretch sm:self-start md:self-auto max-sm:w-full">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}

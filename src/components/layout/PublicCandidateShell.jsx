import React from "react";

export function SiBSBrandLogo({
  className = "h-6 sm:h-7 w-auto text-sibs-navy",
}) {
  return (
    <svg
      viewBox="0 0 408 135"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="SiBS"
    >
      {/* S */}
      <path
        d="M58.9314 133.756C19.108 133.756 0.17858 115.363 0 91.6115H12.5006C13.9292 113.934 31.6086 123.934 59.2885 123.934C89.2899 123.934 103.933 114.291 103.933 96.4331C103.933 74.4678 86.0755 72.3248 58.217 69.6461C21.4296 65.896 4.82166 58.0385 4.82166 35.8946C4.82166 12.322 27.3227 0 58.3956 0C92.3258 0 112.684 15.1793 113.934 37.6804H101.076C100.183 20.3581 82.6825 9.8219 58.7528 9.8219C31.2515 9.8219 18.0366 19.108 18.0366 35.0017C18.0366 51.7882 32.323 55.3598 62.5029 58.7528C88.397 61.4315 117.327 63.2173 117.327 95.7188C117.327 119.291 96.9689 133.756 58.9314 133.756Z"
        fill="currentColor"
      />
      {/* i dot & stem */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M130.912 1.78577V22.1439H142.519V1.78577H130.912Z"
        fill="currentColor"
      />
      <path
        d="M130.912 131.97V39.2875H142.519V131.97H130.912Z"
        fill="currentColor"
      />
      {/* B */}
      <path
        d="M165.943 131.97V1.78577H238.267C263.804 1.78577 278.984 11.7862 278.984 34.1087C278.984 49.1094 270.412 61.0743 253.982 64.4673V65.5388C272.019 67.8603 282.912 79.468 282.912 96.7903C282.912 119.113 267.376 131.97 237.732 131.97H165.943ZM238.625 11.4291H177.907V60.8957H238.089C257.554 60.8957 265.769 51.7881 265.769 39.2875V32.3229C265.769 18.0365 255.59 11.4291 238.625 11.4291ZM238.625 70.1819H177.907V122.327H237.732C258.983 122.327 269.34 113.398 269.34 98.576V92.3258C269.34 78.2179 257.911 70.1819 238.625 70.1819Z"
        fill="currentColor"
      />
      {/* S */}
      <path
        d="M349.242 133.756C309.419 133.756 290.489 115.363 290.311 91.6115H302.811C304.24 113.934 321.92 123.934 349.599 123.934C379.601 123.934 394.244 114.291 394.244 96.4331C394.244 74.4678 376.386 72.3248 348.528 69.6461C311.74 65.896 295.133 58.0385 295.133 35.8946C295.133 12.322 317.634 0 348.706 0C382.637 0 402.995 15.1793 404.245 37.6804H391.387C390.494 20.3581 372.993 9.8219 349.064 9.8219C321.562 9.8219 308.347 19.108 308.347 35.0017C308.347 51.7882 322.634 55.3598 352.814 58.7528C378.708 61.4315 407.638 63.2173 407.638 95.7188C407.638 119.291 387.28 133.756 349.242 133.756Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PublicWebsiteNavbar({
  subtitle = "Candidate application",
  statusLabel = "Application in progress",
  mobileStatusLabel = "In progress",
  completionPercentage = null,
}) {
  const hasProgressBar =
    typeof completionPercentage === "number" &&
    Number.isFinite(completionPercentage);

  return (
    <header className="sticky top-0 z-[500] border-b border-sibs-border bg-white text-sibs-navy">
      <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <a
            href="https://sibscontactcenter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-sibs-navy focus-visible:ring-offset-2"
            title="SiBS Contact Center"
          >
            <SiBSBrandLogo className="h-6 w-auto sm:h-7 text-sibs-navy" />
          </a>

          <div className="min-w-0 border-l border-slate-200 pl-3">
            <p className="font-heading text-sm font-bold leading-none text-sibs-navy sm:text-base">
              Careers
            </p>
            <p className="mt-1 hidden truncate text-xs font-semibold text-sibs-muted sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href="https://sibscontactcenter.com/#faq"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center rounded-md px-2 text-xs font-bold text-sibs-navy transition-colors hover:text-sibs-orange focus-visible:ring-2 focus-visible:ring-sibs-navy focus-visible:ring-offset-2 sm:inline-flex"
          >
            Help &amp; FAQ
          </a>
          <span className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border border-sibs-orange/30 bg-sibs-cream-light px-2.5 text-[10px] font-extrabold text-sibs-navy sm:px-3 sm:text-xs">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full bg-sibs-orange"
            />
            <span className="sm:hidden">{mobileStatusLabel || statusLabel}</span>
            <span className="hidden sm:inline">{statusLabel}</span>
          </span>
        </div>
      </div>

      {hasProgressBar ? (
        <div
          className="h-0.5 bg-sibs-surface"
          role="progressbar"
          aria-label="Form completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionPercentage}
        >
          <div
            className="h-full w-full origin-left bg-sibs-orange transition-transform duration-500 ease-out"
            style={{ transform: `scaleX(${completionPercentage / 100})` }}
          />
        </div>
      ) : null}
    </header>
  );
}

export function PublicCandidateHero({
  leadHighlight,
  titleRest,
  description,
  badges = [],
  testId = "public-candidate-hero",
}) {
  return (
    <section
      data-testid={testId}
      className="relative border-b border-sibs-border bg-white px-4 sm:px-6"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[980px] items-center py-4 sm:py-5 lg:py-6 2xl:min-h-[220px] 2xl:py-10">
        <div className="max-w-[820px]">
          <h1 className="font-heading text-2xl font-black leading-tight tracking-tight text-sibs-navy sm:text-3xl lg:text-4xl 2xl:text-[3.25rem] 2xl:leading-[1.02]">
            {leadHighlight ? (
              <>
                <span className="relative inline-block">
                  <span
                    aria-hidden="true"
                    className="absolute bottom-[0.14em] -left-1 -right-1 h-[0.35em] bg-sibs-secondary-gold"
                  />
                  <span className="relative">{leadHighlight}</span>
                </span>{" "}
              </>
            ) : null}
            {titleRest}
          </h1>

          {description ? (
            <p className="mt-2 max-w-[760px] text-xs font-medium leading-5 text-sibs-navy sm:mt-2.5 sm:text-sm sm:leading-6 2xl:mt-4 2xl:text-base 2xl:leading-7">
              {description}
            </p>
          ) : null}

          {badges.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-2 2xl:mt-4 2xl:gap-2.5">
              {badges.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex min-h-7 items-center gap-1.5 rounded-[10px] border border-sibs-border bg-sibs-surface px-2.5 text-[10px] font-bold text-sibs-navy 2xl:min-h-8 2xl:gap-2 2xl:px-3 2xl:text-[11px]"
                >
                  {Icon ? (
                    <Icon
                      size={13}
                      className="2xl:h-3.5 2xl:w-3.5"
                      aria-hidden="true"
                    />
                  ) : null}
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function PublicSectionCard({
  icon: Icon,
  title,
  description,
  step,
  totalSteps = 9,
  badgeText = "",
  testId = "public-section-card",
  className = "",
  children,
}) {
  return (
    <section
      data-testid={testId}
      className={`sibs-page-card-in relative min-w-0 overflow-visible rounded-2xl border border-sibs-border bg-white shadow-[0_8px_24px_rgba(4,44,81,0.05)] ${className}`}
    >
      {(title || description || Icon || step || badgeText) && (
        <div className="flex flex-col gap-2.5 border-b border-sibs-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5 sm:py-3.5 2xl:gap-3 2xl:px-6 2xl:py-4">
          <div className="flex min-w-0 items-start gap-2.5 2xl:gap-3">
            {Icon && (
              <div className="flex h-8 w-8 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center rounded-[10px] bg-sibs-cream-light text-sibs-orange">
                <Icon
                  size={16}
                  className="2xl:h-[18px] 2xl:w-[18px]"
                  aria-hidden="true"
                />
              </div>
            )}

            <div className="min-w-0">
              {title ? (
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-sibs-navy 2xl:text-sm">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-0.5 text-[11px] font-semibold leading-4 text-sibs-muted sm:text-xs 2xl:mt-1 2xl:leading-5">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {step ? (
            <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-sibs-border bg-sibs-surface px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted 2xl:px-3 2xl:py-1 2xl:text-[10px]">
              Step {step} of {totalSteps}
            </span>
          ) : badgeText ? (
            <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-sibs-border bg-sibs-surface px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted 2xl:px-3 2xl:py-1 2xl:text-[10px]">
              {badgeText}
            </span>
          ) : null}
        </div>
      )}

      <div className="p-4 sm:p-5 2xl:p-6">{children}</div>
    </section>
  );
}

export function PublicWebsiteFooter() {
  return (
    <footer className="mt-10 border-t border-sibs-border bg-white py-6 text-sibs-navy font-jakarta sm:py-7">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <div className="flex items-center gap-2.5">
            <SiBSBrandLogo className="h-5.5 w-auto" />
            <span className="text-xs text-slate-400" aria-hidden="true">
              •
            </span>
            <span className="text-xs font-semibold text-sibs-muted">
              Practice. Purpose. Philosophy.
            </span>
          </div>
          <p className="text-xs text-sibs-muted">
            © {new Date().getFullYear()} SiBS Outsourcing Solutions. All rights
            reserved.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-bold text-sibs-navy">
          <a
            href="https://sibscontactcenter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center transition hover:text-sibs-orange"
          >
            About Us
          </a>
          <a
            href="https://sibscontactcenter.com/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center transition hover:text-sibs-orange"
          >
            Applicant Privacy
          </a>
          <a
            href="https://sibscontactcenter.com/#faq"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center transition hover:text-sibs-orange"
          >
            FAQ &amp; Support
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function PublicCandidateShell({
  skipLabel = "Skip to main content",
  subtitle,
  statusLabel,
  mobileStatusLabel,
  completionPercentage = null,
  hero = null,
  children,
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sibs-primary-3 font-jakarta text-sibs-navy">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[1000] -translate-y-20 rounded-[10px] bg-sibs-navy px-4 py-2 text-sm font-bold text-white transition-transform focus:translate-y-0 focus-visible:ring-2 focus-visible:ring-sibs-orange focus-visible:ring-offset-2"
      >
        {skipLabel}
      </a>

      <PublicWebsiteNavbar
        subtitle={subtitle}
        statusLabel={statusLabel}
        mobileStatusLabel={mobileStatusLabel}
        completionPercentage={completionPercentage}
      />

      <main id="main-content" tabIndex={-1} className="flex-1">
        {hero ? <PublicCandidateHero {...hero} /> : null}
        {children}
      </main>

      <PublicWebsiteFooter />
    </div>
  );
}

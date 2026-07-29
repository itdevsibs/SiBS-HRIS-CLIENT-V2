import { safePercentage } from "../../../../lib/utils/OMDashboard/omDashboardHelpers.js";

export default function OMRequirementProgress({ roles = [], delay = 0 }) {
  return (
    <section
      className="sibs-page-card-in sibs-card p-5 sm:p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="sibs-section-title">
        Approved Requirement vs Filled Progress
      </h2>
      <p className="sibs-section-subtitle">
        Current hiring progress for manager-accessible roles
      </p>

      <div className="mt-5 max-h-[390px] space-y-4 overflow-y-auto pr-1">
        {roles.length === 0 ? (
          <div className="sibs-empty-panel">
            No accessible hiring roles were found.
          </div>
        ) : (
          roles.slice(0, 6).map((role) => {
            const percentage = safePercentage(role.filled, role.req);
            const progressClass =
              role.status === "Delayed"
                ? "bg-rose-500"
                : role.status === "At Risk"
                  ? "bg-amber-400"
                  : "bg-[#FF5C28]";

            return (
              <div key={role.id || role.roleAccount}>
                <div className="flex flex-col justify-between gap-1 text-xs sm:flex-row sm:items-center sm:gap-3">
                  <span className="min-w-0 break-words font-extrabold text-[#042C51]">
                    {role.roleTitle}{" "}
                    <span className="font-medium text-[#98A2B3]">
                      ({role.account})
                    </span>
                  </span>

                  <span className="shrink-0 font-extrabold text-[#FF5C28]">
                    {role.filled} / {role.req}{" "}
                    <span className="text-[#98A2B3]">({percentage}%)</span>
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEF2F6]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressClass}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

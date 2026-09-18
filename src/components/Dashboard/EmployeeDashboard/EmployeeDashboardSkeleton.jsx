import React from "react";
import Header from "../../layout/Header";
import { Skeleton } from "../../ui/skeleton";

export default function EmployeeDashboardSkeleton() {
  return (
    <div
      className="sibs-dashboard-shell font-jakarta"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading employee dashboard"
    >
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-4 pb-8 sm:space-y-5">
          {/* Welcome Hero Banner */}
          <section
            data-testid="employee-skeleton-welcome"
            className="relative min-h-[150px] overflow-hidden rounded-2xl border border-[#084075] bg-[#042C51] p-4 text-white sm:p-5 2xl:p-6"
          >
            <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="m-0 text-xs font-extrabold uppercase tracking-wider text-[#FF5C28]">
                    SIBS Employee Portal
                  </p>
                </div>
                <h1 className="mt-1 text-xl sm:text-2xl 2xl:text-3xl font-extrabold text-white tracking-tight">
                  Welcome Back, <Skeleton className="inline-block h-6 w-32 align-middle bg-white/20" />
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-300">
                  Your employee self-service records, timecard, and HRIS shortcuts are available below.
                </p>
              </div>
              <div className="w-full shrink-0 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-center backdrop-blur-sm sm:w-[200px] 2xl:w-[220px] md:text-right">
                <p className="m-0 text-xs font-medium text-slate-300">Current Time (PHT)</p>
                <Skeleton className="mx-auto mt-1 h-6 w-24 bg-white/20 md:ml-auto md:mr-0" />
                <Skeleton className="mx-auto mt-1 h-3 w-32 bg-white/20 md:ml-auto md:mr-0" />
              </div>
            </div>
          </section>

          {/* Main Layout: 2 Cols Left + 1 Col Right */}
          <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3">
            <div className="space-y-4 sm:space-y-5 lg:col-span-2">
              {/* Attendance & Live Timecard */}
              <section
                data-testid="employee-skeleton-attendance"
                className="sibs-card space-y-4 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="m-0 text-base font-extrabold text-sibs-navy">
                      Attendance & Live Timecard
                    </h2>
                    <p className="m-0 sibs-text-micro font-semibold text-[#667085]">
                      Today’s attendance status, punch information, and recorded activity.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-black text-slate-500">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 sm:p-3.5 2xl:p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <div className="rounded-lg border border-[#E6ECF2] bg-white p-2.5 text-center">
                      <p className="m-0 text-[11px] font-bold text-slate-500">Clock In</p>
                      <Skeleton className="mx-auto mt-1.5 h-5 w-16" />
                    </div>
                    <div className="rounded-lg border border-[#E6ECF2] bg-white p-2.5 text-center">
                      <p className="m-0 text-[11px] font-bold text-slate-500">Clock Out</p>
                      <Skeleton className="mx-auto mt-1.5 h-5 w-16" />
                    </div>
                    <div className="rounded-lg border border-[#E6ECF2] bg-white p-2.5 text-center">
                      <p className="m-0 text-[11px] font-bold text-slate-500">Rendered Hours</p>
                      <Skeleton className="mx-auto mt-1.5 h-5 w-14" />
                    </div>
                  </div>
                  <div className="flex justify-center gap-2 pt-2 md:pt-0">
                    <Skeleton className="h-9 w-28 rounded-xl" />
                    <Skeleton className="h-9 w-28 rounded-xl" />
                  </div>
                </div>
              </section>

              {/* Work Schedule & Weekly Timeline */}
              <section
                data-testid="employee-skeleton-schedule"
                className="sibs-card space-y-4 p-4 sm:p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="m-0 text-base font-extrabold text-sibs-navy">
                      Work Schedule & Weekly Timeline
                    </h2>
                    <p className="m-0 sibs-text-micro font-semibold text-[#667085]">
                      Weekly shift pattern and current roster.
                    </p>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 pt-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                    <div
                      key={day}
                      className={`rounded-xl border p-2.5 text-center space-y-1 ${
                        index < 5
                          ? "border-slate-200 bg-slate-50/80"
                          : "border-slate-100 bg-slate-50/40"
                      }`}
                    >
                      <p className="m-0 text-[11px] font-extrabold text-slate-600">{day}</p>
                      <Skeleton className="mx-auto h-3 w-8" />
                      <Skeleton className="mx-auto h-2.5 w-12" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Performance & Appraisal Center */}
              <section
                data-testid="employee-skeleton-performance"
                className="sibs-card space-y-4 p-4 sm:p-5"
              >
                <div>
                  <h2 className="m-0 text-base font-extrabold text-sibs-navy">
                    Performance & Appraisal Center
                  </h2>
                  <p className="m-0 sibs-text-micro font-semibold text-[#667085]">
                    Appraisal records, metrics, and developmental feedback.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2"
                    >
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-2.5 w-32" />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Aside Column */}
            <aside className="space-y-4 sm:space-y-5">
              {/* My Profile & Summary */}
              <section
                data-testid="employee-skeleton-shortcuts"
                className="sibs-card space-y-4 p-4 sm:p-5"
              >
                <div>
                  <h2 className="m-0 text-base font-extrabold text-sibs-navy">
                    My Profile & Summary
                  </h2>
                  <p className="m-0 sibs-text-micro font-semibold text-[#667085]">
                    Employee details and direct service links.
                  </p>
                </div>
                <div className="space-y-2.5 pt-1">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3"
                    >
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-2.5 w-24" />
                      </div>
                      <Skeleton className="h-7 w-7 rounded-lg" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Leaves & Time Off */}
              <section
                data-testid="employee-skeleton-leaves"
                className="sibs-card space-y-4 p-4 sm:p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="m-0 text-base font-extrabold text-sibs-navy">
                      Leaves & Time Off
                    </h2>
                    <p className="m-0 sibs-text-micro font-semibold text-[#667085]">
                      Credits balance and active filings.
                    </p>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center space-y-1.5">
                    <p className="m-0 text-xs font-bold text-emerald-800">Vacation Leave</p>
                    <Skeleton className="mx-auto h-6 w-12" />
                    <Skeleton className="mx-auto h-2.5 w-16" />
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-center space-y-1.5">
                    <p className="m-0 text-xs font-bold text-blue-800">Sick Leave</p>
                    <Skeleton className="mx-auto h-6 w-12" />
                    <Skeleton className="mx-auto h-2.5 w-16" />
                  </div>
                </div>
              </section>

              {/* Announcements & Holidays */}
              <section
                data-testid="employee-skeleton-announcements"
                className="sibs-card space-y-4 p-4 sm:p-5"
              >
                <div>
                  <h2 className="m-0 text-base font-extrabold text-sibs-navy">
                    Announcements & Holidays
                  </h2>
                  <p className="m-0 sibs-text-micro font-semibold text-[#667085]">
                    Upcoming company events and holidays.
                  </p>
                </div>
                <div className="space-y-2.5 pt-1">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-1.5"
                    >
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-14" />
                      </div>
                      <Skeleton className="h-2.5 w-full" />
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

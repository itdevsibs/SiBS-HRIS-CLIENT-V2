import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  MapPin,
  CalendarDays,
  ChevronLeft,
  MoreHorizontal,
} from "lucide-react";

import Header from "../../components/layout/Header";
import { getEmployeeById } from "../../lib/axios/getEmployee";
import { formatDate } from "../../components/layout/FormatDateTime";

const tabs = [
  "Personal",
  "Job",
  "Time Off",
  "Documents",
  "Benefits",
  "Performance",
  "Training",
  "Assets",
  "Notes",
  "Emergency",
];

export default function EmployeeDataPage() {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("Personal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const sibsId = sessionStorage.getItem("selectedEmployeeId");

        if (!sibsId) {
          navigate("/employee", { replace: true });
          return;
        }

        const result = await getEmployeeById(sibsId);

        if (!result?.success || !result?.data) {
          navigate("/employee", { replace: true });
          return;
        }

        setEmployee(result.data);
      } catch (error) {
        console.error("Failed to fetch employee:", error);
        navigate("/employee", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [navigate]);

  const fullName = employee
    ? [employee.firstName, employee.middleName, employee.lastName]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <button
          type="button"
          onClick={() => navigate("/employee")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-sibs-primary-1 transition hover:underline"
        >
          <ChevronLeft size={16} />
          Back to Employees
        </button>

        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-sm font-medium text-sibs-tertiary-5 shadow-sm">
            Loading...
          </div>
        ) : !employee ? (
          <div className="rounded-2xl bg-white p-6 text-sm font-medium text-sibs-tertiary-5 shadow-sm">
            Employee not found
          </div>
        ) : (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl bg-white">
              <div className="bg-sibs-primary-1 px-4 pb-0 pt-5 text-white sm:px-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                      <div className="flex h-[96px] w-[96px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/15 sm:h-[110px] sm:w-[110px]">
                        <User size={36} className="text-white" />
                      </div>

                      <div className="min-w-0 pt-1">
                        <h1 className="break-words text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                          {fullName || "Employee Name"}
                        </h1>

                        <p className="mt-1 text-sm font-medium text-white/80">
                          {employee.account || "Employee"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-sibs-primary-1 transition hover:opacity-90"
                      >
                        Request a Change
                      </button>

                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sibs-primary-1 transition hover:opacity-90"
                        aria-label="More actions"
                      >
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto pt-1 no-scrollbar">
                    <div className="flex min-w-max">
                      {tabs.map((tab) => {
                        const isActive = activeTab === tab;

                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                              isActive
                                ? "bg-sibs-tertiary-10 text-sibs-primary-1"
                                : "text-white/90 hover:bg-white/10"
                            }`}
                          >
                            {tab}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid min-h-0 grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="min-w-0 space-y-4">
                <SideCard title="Vitals">
                  <div className="space-y-3 text-sm text-sibs-tertiary-5">
                    <InfoRow icon={Phone} value={employee.contact || "N/A"} />

                    <InfoRow
                      icon={Mail}
                      value={employee.email || "N/A"}
                      breakText
                    />

                    <InfoRow
                      icon={Building2}
                      value={employee.department || "N/A"}
                    />

                    <InfoRow
                      icon={Briefcase}
                      value={employee.account || "N/A"}
                    />

                    <InfoRow
                      icon={MapPin}
                      value={employee.location || "N/A"}
                    />
                  </div>
                </SideCard>

                <SideCard title="Hire Date">
                  <InfoRow
                    icon={CalendarDays}
                    value={formatDate(employee.hireDate)}
                  />
                </SideCard>

                <SideCard title="Benefits">
                  <div className="space-y-4 text-sm text-sibs-tertiary-5">
                    <SidebarField label="SSS" value={employee.sss || "N/A"} />
                    <SidebarField label="PHIC" value={employee.phic || "N/A"} />
                    <SidebarField label="HDMF" value={employee.hdmf || "N/A"} />
                    <SidebarField label="TIN" value={employee.tin || "N/A"} />
                  </div>
                </SideCard>
              </aside>

              <section className="min-w-0 space-y-6">
                {activeTab === "Personal" && (
                  <div className="rounded-[22px] border border-[#D9E2EC] bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sibs-tertiary-9">
                        <span className="text-[11px] font-bold text-sibs-primary-1">
                          ▣
                        </span>
                      </div>

                      <h3 className="text-[28px] font-bold leading-none text-sibs-primary-1">
                        Basic Information
                      </h3>
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <InfoField label="SiBS ID" value={employee.sibsId} />

                        <InfoField
                          label="Status"
                          value={employee.status || "Active"}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <InfoField
                          label="First Name"
                          value={employee.firstName}
                        />

                        <InfoField
                          label="Middle Name"
                          value={employee.middleName}
                        />

                        <InfoField
                          label="Last Name"
                          value={employee.lastName}
                        />

                        <InfoField
                          label="Preferred Name"
                          value={employee.preferredName || ""}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <InfoField
                          label="Birth Date"
                          value={formatDate(employee.birthdate)}
                        />

                        <InfoField
                          label="Gender"
                          value={employee.gender || ""}
                        />

                        <InfoField
                          label="Marital Status"
                          value={employee.civilStatus || ""}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab !== "Personal" && (
                  <div className="rounded-2xl border border-[#D9E2EC] bg-white p-6 text-sm font-medium text-sibs-tertiary-5 shadow-sm">
                    {activeTab} content can be added here.
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SideCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-sibs-primary-1">
        {title}
      </h2>

      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, value, breakText = false }) {
  return (
    <div className="flex min-w-0 items-start gap-3 text-sm text-sibs-tertiary-5">
      <Icon size={16} className="mt-0.5 shrink-0" />

      <span className={breakText ? "min-w-0 break-all" : "min-w-0 break-words"}>
        {value || "N/A"}
      </span>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="w-full min-w-0">
      <label className="mb-2 block text-[14px] font-medium text-sibs-primary-1">
        {label}
      </label>

      <div className="flex min-h-[52px] items-center rounded-[10px] border border-[#8FA9C8] bg-white px-4 py-3 text-[15px] text-[#2F5E93]">
        <span className="break-words">{value || "N/A"}</span>
      </div>
    </div>
  );
}

function SidebarField({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 font-medium text-sibs-primary-1">{label}</p>
      <p className="break-all leading-5">{value || "N/A"}</p>
    </div>
  );
}
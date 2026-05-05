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
} from "lucide-react";
import Header from "../../components/layout/Header";
import { getEmployeeById } from "../../lib/axios/getEmployee";
import { formatDate } from "@/components/layout/FormatDateTime";

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
          navigate("/employee");
          return;
        }

        const result = await getEmployeeById(sibsId);

        if (!result?.success || !result?.data) {
          navigate("/employee");
          return;
        }

        setEmployee(result.data);
      } catch (error) {
        console.error("Failed to fetch employee:", error);
        navigate("/employee");
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
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--sibs-tertiary-10)]">
      <Header />

      <main className="flex-1 overflow-y-auto p-6">
        <button
          onClick={() => navigate("/employee")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-sibs-primary-1 hover:underline"
        >
          <ChevronLeft size={16} />
          Back to Employees
        </button>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-6">Loading...</div>
        ) : !employee ? (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            Employee not found
          </div>
        ) : (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl bg-white">
              <div className="bg-[var(--sibs-primary-1)] px-6 pt-5 pb-0 text-white">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex items-start gap-5">
                      <div
                        className="h-[110px] w-[110px] rounded-2xl bg-white/15 border border-white/20 
                          flex items-center justify-center overflow-hidden shrink-0"
                      >
                        <User size={36} className="text-white" />
                      </div>

                      <div className="pt-1">
                        <h1 className="text-4xl font-bold leading-tight">
                          {fullName || "Employee Name"}
                        </h1>

                        <p className="mt-1 text-sm text-white/80">
                          {employee.account || "Employee"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="rounded-full bg-white text-[var(--sibs-primary-1)] px-4 py-2 text-sm font-medium hover:opacity-90 transition">
                        Request a Change
                      </button>

                      <button className="h-10 w-10 rounded-full bg-white text-[var(--sibs-primary-1)] flex items-center justify-center hover:opacity-90 transition">
                        •••
                      </button>
                    </div>
                  </div>

                  <div className="flex overflow-x-auto no-scrollbar pt-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                          activeTab === tab
                            ? "bg-sibs-tertiary-10 text-[var(--sibs-primary-1)]"
                            : "text-white/90 hover:bg-white/10"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-[23%_1fr] gap-6 min-h-0">
              <aside className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <h2 className="text-sm font-semibold text-sibs-primary-1 mb-4">
                    Vitals
                  </h2>

                  <div className="space-y-3 text-sm text-sibs-tertiary-5">
                    <div className="flex items-start gap-3">
                      <Phone size={16} className="mt-0.5 shrink-0" />
                      <span>{employee.contact || "N/A"}</span>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail size={16} className="mt-0.5 shrink-0" />
                      <span className="break-all">
                        {employee.email || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <Building2 size={16} className="mt-0.5 shrink-0" />
                      <span>{employee.department || "N/A"}</span>
                    </div>

                    <div className="flex items-start gap-3">
                      <Briefcase size={16} className="mt-0.5 shrink-0" />
                      <span>{employee.account || "N/A"}</span>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="mt-0.5 shrink-0" />
                      <span>{employee.location || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <h2 className="text-sm font-semibold text-sibs-primary-1 mb-4">
                    Hire Date
                  </h2>

                  <div className="flex items-start gap-3 text-sm text-sibs-tertiary-5">
                    <CalendarDays size={16} className="mt-0.5 shrink-0" />
                    <span>{formatDate(employee.hireDate)}</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <h2 className="text-sm font-semibold text-sibs-primary-1 mb-4">
                    Benefits
                  </h2>

                  <div className="space-y-4 text-sm text-sibs-tertiary-5">
                    <SidebarField label="SSS" value={employee.sss || "N/A"} />
                    <SidebarField label="PHIC" value={employee.phic || "N/A"} />
                    <SidebarField label="HDMF" value={employee.hdmf || "N/A"} />
                    <SidebarField label="TIN" value={employee.tin || "N/A"} />
                  </div>
                </div>
              </aside>

              <section className="space-y-6">
                {activeTab === "Personal" && (
                  <div className="bg-white rounded-[22px] shadow-sm border border-[#D9E2EC] p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-5 h-5 rounded-md bg-[var(--sibs-tertiary-9)] flex items-center justify-center shrink-0">
                        <span className="text-sibs-primary-1 text-[11px] font-bold">
                          ▣
                        </span>
                      </div>

                      <h3 className="text-[28px] font-bold text-sibs-primary-1 leading-none">
                        Basic Information
                      </h3>
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoField label="SiBS ID" value={employee.sibsId} />
                        <InfoField
                          label="Status"
                          value={employee.status || "Active"}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="bg-white rounded-2xl shadow-sm border p-6 text-sibs-tertiary-5">
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

function InfoField({ label, value }) {
  return (
    <div className="w-full min-w-0">
      <label className="block text-[14px] font-medium text-sibs-primary-1 mb-2">
        {label}
      </label>

      <div className="min-h-[52px] rounded-[10px] border border-[#8FA9C8] bg-white px-4 py-3 text-[15px] text-[#2F5E93] flex items-center">
        <span className="break-words">{value || "N/A"}</span>
      </div>
    </div>
  );
}

function SidebarField({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="font-medium text-sibs-primary-1 mb-1">{label}</p>
      <p className="break-all leading-5">{value || "N/A"}</p>
    </div>
  );
}

import ChwcpTable from "../../../components/tables/employees/ChwcpTable";
import EmployeeTable from "../../../components/tables/employees/EmployeeTable";
import EmployeeDirectoryTabs from "./EmployeeDirectoryTabs.jsx";

export default function EmployeeDirectoryContent({
  tabs,
  activeTab,
  onTabChange,
}) {
  if (activeTab === "Employees") {
    return (
      <EmployeeTable
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    );
  }

  if (activeTab === "CHWCP") {
    const currentTab = (tabs || []).find((t) => t.label === "CHWCP");
    return (
      <div className="flex h-full min-h-[520px] min-w-0 flex-col bg-white font-jakarta">
        <div className="border-b border-[#E6ECF2] p-4 sm:p-5 2xl:p-6 font-jakarta">
          <h3 className="font-heading text-sm sm:text-base 2xl:text-lg font-bold text-sibs-navy tracking-tight">
            CHWCP Records
          </h3>
          <p className="mt-1 sibs-text-xs 2xl:text-sm font-semibold text-[#667085]">
            {currentTab?.description || "Health and compliance records"}
          </p>
        </div>
        <div className="p-4 sm:p-5 2xl:p-6">
          <EmployeeDirectoryTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
          <ChwcpTable />
        </div>
      </div>
    );
  }

  return null;
}

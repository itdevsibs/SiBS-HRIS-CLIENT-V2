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
    return (
      <div className="flex h-full min-h-[520px] min-w-0 flex-col bg-white font-jakarta">
        <div className="p-4 sm:p-5">
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

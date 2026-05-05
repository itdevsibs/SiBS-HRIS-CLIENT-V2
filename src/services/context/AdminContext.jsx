import { createContext, useContext } from "react";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const getAccessLabel = (adminAccess) => {
    const accessNum = Number(adminAccess);

    if (accessNum === 1) return "Talent Acquisition";
    if (accessNum === 2) return "Human Resources";
    if (accessNum === 3) return "HR Admin";
    if (accessNum === 4) return "Finance";
    if (accessNum === 5) return "Manager";
    if (accessNum === 6) return "Executive";
    if (accessNum === 7) return "Super Admin";

    return null;
  };

  const ADMIN_ROLES = [
    "ta",
    "hr",
    "hr_admin",
    "finance",
    "manager",
    "executive",
    "super_admin",
  ];

  return (
    <AdminContext.Provider value={{ getAccessLabel, ADMIN_ROLES }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);

  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }

  return context;
}

import { useContext } from "react";

import DepartmentsContext from "@/services/context/DepartmentsContext";

export default function useDepartments() {
  const context = useContext(DepartmentsContext);

  if (!context) {
    throw new Error("useDepartments must be used within DepartmentsProvider");
  }

  return context;
}

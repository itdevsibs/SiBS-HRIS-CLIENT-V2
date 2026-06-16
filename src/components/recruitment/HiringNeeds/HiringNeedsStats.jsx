import React from "react";
import { useHiringNeeds } from "../../../services/context/HiringNeedsContext";
import PRSummaryTable from "./PRSummaryTable";
import ReasonForHiringTable from "../../tables/HiringNeeds/ReasonForHiringTable";
import RequisitionByDepartmentTable from "../../tables/HiringNeeds/RequisitionByDepartmentTable";

export default function HiringNeedsStats() {
   const { stats, requisitionByReason, requisitionByDepartment } = useHiringNeeds();        

   return (
     <div className="flex flex-col gap-5">
       <PRSummaryTable stats={stats} />

       {/* Changed: Use xl:grid-cols-2 to give charts more room before splitting */}        
       <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
         <ReasonForHiringTable
           data={requisitionByReason}
           delay={60}
         />
         <RequisitionByDepartmentTable
           data={requisitionByDepartment}
           delay={60}
         />
       </div>
     </div>
   );
}
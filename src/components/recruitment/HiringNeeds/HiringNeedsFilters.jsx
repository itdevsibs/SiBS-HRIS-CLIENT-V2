import React from "react";
import { Search, X, Filter } from "lucide-react";
import { usePagination } from "../../../services/context/PaginationContext";
import { useHiringNeeds } from "../../../services/context/HiringNeedsContext";

function SearchFilterSelect({ label, entityKey, filterKey, options, allLabel }) {
   const { filterValues, setFilter } = usePagination(entityKey);
   const currentValue = filterValues?.[filterKey] || "All";

   return (
     <div className="w-full">
       <label className="mb-1.5 block text-sm font-bold text-[#101828]">{label}</label>
       <select
         value={currentValue}
         onChange={(e) => setFilter(filterKey, e.target.value)}
         className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
       >
         <option value="All">{allLabel}</option>
         {options.map((opt) => (
           <option key={opt} value={opt}>{opt}</option>
         ))}
       </select>
     </div>
   );
}

export default function HiringNeedsFilters() {
   const { searchInput, setSearchInput, commitSearch, resetFilters, filterValues } = usePagination("hiring-needs");
   const { clearFilters } = useHiringNeeds();
   const hasActiveFilters = 
     searchInput || 
     (filterValues?.status && filterValues.status !== "All") ||
     (filterValues?.site && filterValues.site !== "All") ||
     (filterValues?.reason && filterValues.reason !== "All");

     const handleClearAll = () => {
       setSearchInput("");
       resetFilters();
       setFilter("status", "All");
       setFilter("site", "All");
       setFilter("reason", "All");
     };

   return (
     <div className="border-b border-[#E6ECF2] bg-white px-4 py-5 sm:px-5 lg:px-6">
       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_240px_240px_220px_110px] xl:items-end">
         <div>
           <label className="mb-1.5 block text-sm font-bold text-[#101828]">Search</label>
           <div className="relative">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5" />
             <input
               value={searchInput}
               onChange={(e) => setSearchInput(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && commitSearch()}
               placeholder="Search then press Enter..."
               className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none focus:border-sibs-primary-1"
             />
           </div>
         </div>

         <SearchFilterSelect label="Approval Status" entityKey="hiring-needs" filterKey="status" allLabel="All Statuses" options={["For Approval", "Approved", "Not Approved"]} />
         <SearchFilterSelect label="Location / Site" entityKey="hiring-needs" filterKey="site" allLabel="All Sites" options={["Davao Site", "Tagum Site", "Mabini Site"]} />
         <SearchFilterSelect label="Reason" entityKey="hiring-needs" filterKey="reason" allLabel="All Reasons" options={["New Position", "Ramp-up", "Forecasted Growth"]} />

         <button
           onClick={clearFilters}
           disabled={!hasActiveFilters}
           className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:opacity-50"
         >
           <Filter size={17} /> Clear
         </button>
       </div>
     </div>
   );
}
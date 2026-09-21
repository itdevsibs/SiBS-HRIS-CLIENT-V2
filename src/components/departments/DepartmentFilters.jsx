import { Filter, Search } from "lucide-react";

export default function DepartmentFilters({ search, status, onSearch, onStatus, onClear, canClear }) {
  return (
    <div className="grid gap-3 border-b border-sibs-border px-4 py-4 md:grid-cols-[minmax(280px,1fr)_220px_auto] sm:px-5">
      <label className="block">
        <span className="sibs-field-label">Search</span>
        <span className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-faint" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            className="sibs-dashboard-input pl-9 pr-3"
            placeholder="Search department or account..."
          />
        </span>
      </label>
      <label className="block">
        <span className="sibs-field-label">Department Status</span>
        <select value={status} onChange={(event) => onStatus(event.target.value)} className="sibs-dashboard-input px-3">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      <button type="button" className="sibs-btn-secondary self-end" onClick={onClear} disabled={!canClear}>
        <Filter className="h-4 w-4" /> Clear
      </button>
    </div>
  );
}

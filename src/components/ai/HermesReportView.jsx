import React, { useState } from "react";
import {
  Calendar,
  ChevronRight,
  Database,
  ExternalLink,
  Layers,
  Maximize2,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import HermesExpandedViewer from "./HermesExpandedViewer";

/**
 * AIReportHeader
 *
 * Professional SiBS enterprise report header with verified status badge,
 * data scope pill, and an optional button to expand into a full-width modal.
 */
export function AIReportHeader({
  title,
  source = {},
  onExpand,
}) {
  const { system = "HRIS", verified = true, scope, period, asOf } = source;

  return (
    <div className="flex items-start justify-between gap-3 border-b border-sibs-border pb-3">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-heading text-sm font-bold text-sibs-navy truncate">
            {title}
          </h4>
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              <ShieldCheck size={11} className="text-emerald-600" />
              Verified {system}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
              <ShieldAlert size={11} className="text-amber-600" />
              Unverified Source
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-sibs-muted flex-wrap">
          {scope ? (
            <span className="font-semibold text-sibs-secondary">Scope: {scope}</span>
          ) : null}
          {period ? (
            <span className="inline-flex items-center gap-1 font-mono text-[10px]">
              <Calendar size={10} className="text-sibs-orange" />
              {period.dateFrom} → {period.dateTo}
            </span>
          ) : asOf ? (
            <span className="text-[10px]">As of: {asOf}</span>
          ) : null}
        </div>
      </div>

      {onExpand ? (
        <button
          type="button"
          onClick={onExpand}
          title="Expand Report"
          className="inline-flex items-center gap-1 rounded-lg border border-sibs-border-subtle bg-sibs-surface px-2 py-1 text-[11px] font-bold text-sibs-secondary hover:bg-sibs-cream-light hover:text-sibs-orange transition shrink-0"
        >
          <Maximize2 size={12} />
          <span className="hidden sm:inline">Expand</span>
        </button>
      ) : null}
    </div>
  );
}

/**
 * AIMetricCard
 *
 * Visual metric card emphasizing numerical hierarchy, units, and status badges.
 */
export function AIMetricCard({
  label,
  value,
  unit,
  status = "normal",
  subtext,
}) {
  const statusStyles = {
    normal: "border-sibs-border-subtle bg-sibs-surface/80 text-sibs-navy",
    warning: "border-amber-200 bg-amber-50/60 text-amber-900",
    alert: "border-rose-200 bg-rose-50/60 text-rose-900",
    neutral: "border-sibs-border-subtle bg-white text-sibs-navy",
  };

  const badgeStyles = {
    normal: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    alert: "bg-rose-100 text-rose-800",
    neutral: "bg-sibs-surface text-sibs-muted",
  };

  return (
    <div
      className={`flex flex-col justify-between rounded-xl border p-2.5 transition shadow-xs ${
        statusStyles[status] || statusStyles.normal
      }`}
    >
      <span className="text-[11px] font-semibold text-sibs-muted truncate mb-1">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-base font-extrabold tracking-tight tabular-nums text-sibs-navy">
          {value != null ? value : "--"}
        </span>
        {unit ? (
          <span className="text-[10px] font-medium text-sibs-faint uppercase tracking-wider">
            {unit}
          </span>
        ) : null}
      </div>
      {subtext ? (
        <p className="mt-1 text-[10px] font-medium text-sibs-muted line-clamp-2">
          {subtext}
        </p>
      ) : null}
    </div>
  );
}

/**
 * AIReportTable
 *
 * Tabular component with horizontally scrollable container and right-aligned numbers.
 */
export function AIReportTable({
  columns = [],
  rows = [],
  compact = false,
}) {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-sibs-border p-4 text-center text-xs font-medium text-sibs-muted">
        No records found for this period.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-sibs-border bg-white shadow-xs">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="border-b border-sibs-border bg-sibs-surface/80">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-sibs-muted ${
                  col.align === "right" || col.isNumeric ? "text-right" : "text-left"
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sibs-border-subtle">
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-sibs-cream-light/40 transition-colors"
            >
              {columns.map((col) => {
                const cellValue = row[col.key];
                const isNumeric = col.align === "right" || col.isNumeric;
                return (
                  <td
                    key={col.key}
                    className={`px-3 py-2 text-xs text-sibs-navy ${
                      isNumeric ? "text-right font-mono tabular-nums font-semibold" : "font-medium"
                    }`}
                  >
                    {cellValue != null ? String(cellValue) : "--"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * AIReportSection
 *
 * Layout section wrapper with header and content.
 */
export function AIReportSection({ title, children }) {
  return (
    <section className="space-y-2">
      {title ? (
        <h5 className="font-heading text-xs font-bold text-sibs-navy">
          {title}
        </h5>
      ) : null}
      {children}
    </section>
  );
}

/**
 * AISourceReference
 *
 * Footer card identifying the official system of record and verified timestamp.
 */
export function AISourceReference({ source = {} }) {
  const { system = "HRIS", service, verified = true, scope, asOf } = source;

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-sibs-border-subtle bg-sibs-surface/50 px-3 py-2 text-[10px] text-sibs-muted">
      <div className="flex items-center gap-1.5 truncate">
        <Database size={12} className="text-sibs-orange shrink-0" />
        <span className="truncate">
          Source: <strong className="font-semibold text-sibs-navy">{system} Official Records</strong>
          {service ? ` · ${service}` : ""}
        </span>
      </div>
      {asOf ? (
        <span className="shrink-0 font-mono text-[10px] text-sibs-faint">
          Verified: {asOf}
        </span>
      ) : null}
    </div>
  );
}

/**
 * HermesReportView
 *
 * Complete business report view combining Header, Metric Cards, Tables, and Source Reference.
 */
export default function HermesReportView({ report }) {
  const [expanded, setExpanded] = useState(false);

  if (!report || report.version !== "1.0") {
    return null;
  }

  const { title, source, metrics = [], sections = [] } = report;

  const renderReportBody = (isModal = false) => (
    <div className="space-y-3.5">
      {/* Metric Cards Grid */}
      {metrics.length > 0 ? (
        <div
          className={`grid gap-2 ${
            metrics.length === 1
              ? "grid-cols-1"
              : metrics.length === 2
              ? "grid-cols-2"
              : isModal
              ? "grid-cols-2 sm:grid-cols-4"
              : "grid-cols-2"
          }`}
        >
          {metrics.map((m) => (
            <AIMetricCard
              key={m.id}
              label={m.label}
              value={m.value}
              unit={m.unit}
              status={m.status}
              subtext={m.subtext}
            />
          ))}
        </div>
      ) : null}

      {/* Sections & Tables */}
      {sections.map((section) => (
        <AIReportSection key={section.id} title={section.title}>
          {section.type === "table" && section.table ? (
            <AIReportTable
              columns={section.table.columns}
              rows={section.table.rows}
              compact={!isModal}
            />
          ) : null}
        </AIReportSection>
      ))}

      {/* Source Reference */}
      <AISourceReference source={source} />
    </div>
  );

  return (
    <div className="my-2 rounded-2xl border border-sibs-border bg-white p-3.5 shadow-xs space-y-3">
      <AIReportHeader
        title={title}
        source={source}
        onExpand={() => setExpanded(true)}
      />

      {renderReportBody(false)}

      {/* Expanded Modal Viewer */}
      <HermesExpandedViewer
        open={expanded}
        title={title}
        subtitle={source?.period ? `Period: ${source.period.dateFrom} to ${source.period.dateTo}` : undefined}
        verified={source?.verified}
        system={source?.system}
        scope={source?.scope}
        onClose={() => setExpanded(false)}
      >
        {renderReportBody(true)}
      </HermesExpandedViewer>
    </div>
  );
}

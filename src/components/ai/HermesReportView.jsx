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
import StatusBadge from "../ui/StatusBadge.jsx";
import { formatAiDisplayDates } from "../../lib/utils/ai/aiDateDisplayClient.js";

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
  const { system = "HRIS", verified = false, scope, period, asOf } = source;

  return (
    <div className="flex items-start justify-between gap-3 border-b border-sibs-border pb-3">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-heading text-lg font-bold text-sibs-navy break-words">
            {formatAiDisplayDates(title)}
          </h4>
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              <ShieldCheck size={11} className="text-emerald-600" />
              Verified {formatAiDisplayDates(system)}
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
            <span className="font-semibold text-sibs-secondary">Scope: {formatAiDisplayDates(scope)}</span>
          ) : null}
          {period?.dateFrom && period?.dateTo ? (
            <span className="inline-flex min-w-0 flex-wrap items-center gap-1 text-[10px] [overflow-wrap:anywhere]">
              <Calendar size={10} className="text-sibs-orange" />
              {formatAiDisplayDates(period.dateFrom)} → {formatAiDisplayDates(period.dateTo)}
            </span>
          ) : asOf ? (
            <span className="text-[10px]">As of: {formatAiDisplayDates(asOf)}</span>
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

  return (
    <div
      className={`flex flex-col min-w-0 rounded-xl border p-3 transition shadow-xs ${
        statusStyles[status] || statusStyles.normal
      }`}
    >
      <span className="text-xs font-semibold text-sibs-muted break-words mb-2">
        {formatAiDisplayDates(label)}
      </span>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight tabular-nums text-sibs-navy">
          {value != null ? formatAiDisplayDates(value, label) : "--"}
        </span>
        {unit ? (
          <span className="text-[10px] font-medium text-sibs-faint uppercase tracking-wider">
            {formatAiDisplayDates(unit)}
          </span>
        ) : null}
      </div>
      {subtext ? (
        <p className="mt-1 text-xs font-medium text-sibs-muted">
          {formatAiDisplayDates(subtext)}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Each record is displayed in a labelled, wrapping card instead of a wide
 * table. The grid adapts to the actual available container width (not the
 * viewport), including the original 430px assistant drawer.
 * Labels and values can be React nodes so Markdown formatting is preserved.
 */
// Use the same badge styling as HRIS attendance. Only explicit status
// values are styled; missing values or richer Markdown nodes stay intact.
function renderRecordValue(label, value) {
  const labelText = typeof label === "string" ? label : Array.isArray(label) && label.every((part) => typeof part === "string") ? label.join("") : "";
  const valueText = typeof value === "string" ? value : Array.isArray(value) && value.every((part) => typeof part === "string") ? value.join("") : "";
  if (!/\b(?:status|punctuality)\b/i.test(labelText) || !valueText.trim() || ["--", "—", "-"].includes(valueText.trim())) {
    return value ?? "--";
  }
  const normalized = valueText.trim().toLowerCase().replace(/_/g, " ");
  const badgeStatus = /^(?:on[- ]time)$/.test(normalized) ? "on-time" : normalized === "late" ? "late" : normalized === "early-out" ? "early-out" : valueText.trim();
  return <StatusBadge status={badgeStatus} className="max-w-full whitespace-normal [overflow-wrap:anywhere]" />;
}

export function AIRecordList({ columns = [], rows = [] }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-sibs-border p-4 text-center text-xs font-medium text-sibs-muted">
        No records found for this period.
      </div>
    );
  }

  const renderField = (row, index) => {
    const label = columns[index];
    const labelText = typeof label === "string" ? label : Array.isArray(label) && label.every((part) => typeof part === "string") ? label.join("") : "";
    const emphasizeValue = /^(?:(?:scheduled|actual)\s+login|sibs\s+id|account|department)$/i.test(labelText.trim());
    return (
      <div key={index} className="min-w-0">
        <dt className="text-[11px] font-semibold leading-4 text-sibs-muted [overflow-wrap:anywhere]">
          {columns[index] ?? `Column ${index + 1}`}
        </dt>
        <dd className={`mt-0.5 min-w-0 text-sm ${emphasizeValue ? "font-bold" : "font-medium"} leading-5 text-sibs-navy [overflow-wrap:anywhere]`}>
          {renderRecordValue(columns[index], row[index])}
        </dd>
      </div>
    );
  };

  return (
    <div role="list" className="min-w-0 w-full space-y-2">
      {rows.map((row, rowIndex) => (
        <div role="listitem" key={rowIndex} className="min-w-0 rounded-xl border border-sibs-border bg-white shadow-xs">
          <dl className="min-w-0">
            <div className="rounded-t-xl border-b border-sibs-border-subtle bg-sibs-surface/80 px-3 py-2 [&_dd]:font-bold">
              {renderField(row, 0)}
            </div>
            {Math.max(columns.length, row.length) > 1 ? (
              <div
                className="grid min-w-0 gap-x-3 gap-y-2.5 px-3 py-2.5"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 110px), 1fr))" }}
              >
                {Array.from({ length: Math.max(columns.length, row.length) - 1 }, (_, index) => renderField(row, index + 1))}
              </div>
            ) : null}
          </dl>
        </div>
      ))}
    </div>
  );
}

/** Structured report tables use the same readable records as Markdown. */
export function AIReportTable({ columns = [], rows = [] }) {
  return (
    <AIRecordList
      columns={columns.map((col) => formatAiDisplayDates(col.label))}
      rows={(rows || []).map((row) => columns.map((col) =>
        row[col.key] != null ? formatAiDisplayDates(String(row[col.key]), col.label) : "--"
      ))}
    />
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
        <h5 className="font-heading text-base font-bold text-sibs-navy">
          {formatAiDisplayDates(title)}
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
  const { system = "HRIS", service, verified = false, scope, asOf } = source;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sibs-border-subtle bg-sibs-surface/50 px-3 py-2 text-[10px] text-sibs-muted">
      <div className="flex min-w-0 items-center gap-1.5">
        <Database size={12} className="text-sibs-orange shrink-0" />
        <span className="break-words">
          Source: <strong className="font-semibold text-sibs-navy">{formatAiDisplayDates(system)}{verified ? " Official Records" : " (unverified)"}</strong>
          {service ? ` · ${formatAiDisplayDates(service)}` : ""}
        </span>
      </div>
      {asOf ? (
        <span className="shrink-0 font-mono text-[10px] text-sibs-faint">
          As of: {formatAiDisplayDates(asOf)}
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
    <div className="min-w-0 space-y-3.5">
      {/* Metric Cards Grid */}
      {metrics.length > 0 ? (
        <div
          className={`grid gap-2 ${
            metrics.length === 1
              ? "grid-cols-1"
              : metrics.length === 2
              ? "grid-cols-1 min-[380px]:grid-cols-2"
              : isModal
              ? "grid-cols-2 sm:grid-cols-4"
              : "grid-cols-1 min-[380px]:grid-cols-2"
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
          {section.type === "details" && Array.isArray(section.items) ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {section.items.map((item) => (
                <div key={item.label} className="min-w-0 rounded-xl border border-sibs-border-subtle bg-white p-3">
                  <dt className="text-xs font-semibold text-sibs-muted">{formatAiDisplayDates(item.label)}</dt>
                  <dd className="mt-1 break-words text-sm font-bold text-sibs-navy">{formatAiDisplayDates(item.value, item.label)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {section.type === "table" && section.table ? (
            <AIReportTable
              columns={section.table.columns}
              rows={section.table.rows}
            />
          ) : null}
        </AIReportSection>
      ))}

      {/* Source Reference */}
      <AISourceReference source={source} />
    </div>
  );

  return (
    <div className="my-2 min-w-0 rounded-2xl border border-sibs-border bg-sibs-surface/40 p-2.5 space-y-4">
      <AIReportHeader
        title={formatAiDisplayDates(title)}
        source={source}
        onExpand={() => setExpanded(true)}
      />

      {renderReportBody(false)}

      {/* Expanded Modal Viewer */}
      <HermesExpandedViewer
        open={expanded}
        title={formatAiDisplayDates(title)}
        subtitle={source?.period?.dateFrom && source?.period?.dateTo ? formatAiDisplayDates(`Period: ${source.period.dateFrom} to ${source.period.dateTo}`) : undefined}
        verified={source?.verified}
        system={formatAiDisplayDates(source?.system)}
        scope={formatAiDisplayDates(source?.scope)}
        onClose={() => setExpanded(false)}
      >
        {renderReportBody(true)}
      </HermesExpandedViewer>
    </div>
  );
}

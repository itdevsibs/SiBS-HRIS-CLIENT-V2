import React from "react";
import {
  Activity,
  AlertTriangle,
  FileText,
  Layers,
  ShieldCheck,
} from "lucide-react";
import StatusFilterTabs from "@/components/recruitment/StatusFilterTabs";

const TABS = [
  { id: "overview", label: "Overview & Telemetry", icon: Activity },
  { id: "exceptions", label: "Risk & Exceptions Desk", icon: AlertTriangle },
  { id: "access_roles", label: "Access & Roles Governance", icon: ShieldCheck },
  { id: "snapshot", label: "Cross-Module Snapshot", icon: Layers },
  { id: "activity", label: "System & Module Activity", icon: FileText },
];

export default function SuperAdminTabs({ activeTab, onChange, counts }) {
  return (
    <StatusFilterTabs
      tabs={TABS}
      activeValue={activeTab}
      onChange={onChange}
      counts={counts}
      layoutId="superAdminTabIndicator"
    />
  );
}


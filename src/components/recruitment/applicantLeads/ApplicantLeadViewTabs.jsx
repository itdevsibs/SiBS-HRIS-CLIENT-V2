import React from "react";
import {
  BarChart3,
  CirclePause,
  MailCheck,
  PhoneCall,
  UserCheck,
  UserPlus,
  UserX,
  UsersRound,
} from "lucide-react";
import StatusFilterTabs from "../StatusFilterTabs";
import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";

export default function ApplicantLeadViewTabs() {
  const { leadView, setLeadView, activeLeads, statusOptions } =
    useApplicantLeadsPage();

  const statusIcon = {
    "New Lead": UserPlus,
    Contacted: PhoneCall,
    "Application Link Sent": MailCheck,
    "Converted to Applicant": UserCheck,
    "Not Interested": UserX,
    "On Hold": CirclePause,
  };
  const statusLabel = {
    "New Lead": "New Leads",
  };
  const configuredStatuses = statusOptions
    .map((option) => String(option?.label || option?.name || option?.value || option).trim())
    .filter((status) => status && status !== "Moved to Talent Pool Archive");
  const leadStatuses = activeLeads
    .map((lead) => String(lead.status || "").trim())
    .filter(Boolean);
  const statuses = Array.from(new Set([...configuredStatuses, ...leadStatuses]));

  const tabs = [
    {
      id: "all",
      label: "All Leads",
      count: activeLeads.length,
      icon: UsersRound,
    },
    ...statuses.map((status) => ({
      id: `status:${status}`,
      label: statusLabel[status] || status,
      count: activeLeads.filter((lead) => lead.status === status).length,
      icon: statusIcon[status] || UserCheck,
    })),
    {
      id: "channels",
      label: "Channel Sources",
      count: null,
      icon: BarChart3,
    },
  ];

  return (
    <StatusFilterTabs
      tabs={tabs}
      activeValue={leadView}
      onChange={setLeadView}
      layoutId="applicantLeadTabIndicator"
    />
  );
}

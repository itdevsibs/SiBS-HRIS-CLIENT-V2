import React from "react";

import { PageHeaderHero } from "@/components/ui";

export default function RecruitmentSettingsHero() {
  return (
    <PageHeaderHero
      kicker={<span className="sibs-kicker">Settings / Recruitment</span>}
      title="Recruitment Settings"
      description="Manage workforce planning, recruitment forms, workflow rules, candidate communications, holidays, and approvals from one place."
    />
  );
}

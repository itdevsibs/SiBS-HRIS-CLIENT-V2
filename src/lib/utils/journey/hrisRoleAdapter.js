import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/services/context/UserContext";

const ROLE_OVERRIDE_KEY = "sibs_hris_journey_role_override_v1";

export const DEMO_ACCOUNTS = [
  { sibsId: "DEMO-EMP", name: "Alyssa Rivera", email: "alyssa.rivera@sibs.local", role: "Employee", journeyEmployeeId: "SIBS-2901" },
  { sibsId: "DEMO-TA", name: "Alena Batacan", email: "ta@sibs.local", role: "TA" },
  { sibsId: "DEMO-IT", name: "IT Operations", email: "it@sibs.local", role: "IT" },
  { sibsId: "DEMO-QDS", name: "QDS Lead", email: "qds@sibs.local", role: "QDS" },
  { sibsId: "DEMO-TRN", name: "Maria Cruz", email: "trainer@sibs.local", role: "Trainer", trainerName: "Maria Cruz" },
  { sibsId: "DEMO-WFM", name: "WFM Planner", email: "wfm@sibs.local", role: "WFM" },
  { sibsId: "DEMO-HR", name: "HR Specialist", email: "hr@sibs.local", role: "HR" },
  { sibsId: "DEMO-HRADMIN", name: "HR Admin", email: "hradmin@sibs.local", role: "HR Admin" },
  { sibsId: "DEMO-TL", name: "Anton Reyes", email: "tl@sibs.local", role: "Team Leader" },
  { sibsId: "DEMO-MGR", name: "Operations Manager", email: "manager@sibs.local", role: "Manager" },
  { sibsId: "DEMO-SOM", name: "Senior Operations Manager", email: "som@sibs.local", role: "SOM" },
  { sibsId: "DEMO-ADMIN", name: "Super Admin", email: "admin@sibs.local", role: "Super Admin" },
];

export function mapHrisUserToDemoRole(hrisUser) {
  if (!hrisUser) return "Super Admin";
  const access = Number(hrisUser.adminAccess);
  if (access === 7) return "Super Admin";
  if (access === 3) return "HR Admin";
  if (access === 2) return "HR";
  if (access === 1) return "TA";
  if (access === 9) return "WFM";
  if (access === 10) return "SOM";
  if (access === 5) return "Manager";
  if (access === 8) return "Team Leader";
  if (access === 4 || access === 6) return "HR Admin";
  if (hrisUser.role === "employee") return "Employee";
  return "HR Admin";
}

export function mapHrisUserToAdapterUser(hrisUser, roleOverride = null) {
  const baseRole = mapHrisUserToDemoRole(hrisUser);
  const canOverride = baseRole !== "Employee";
  const effectiveRole = canOverride && roleOverride ? roleOverride : baseRole;

  if (!hrisUser) {
    return {
      sibsId: "SIBS-ADMIN",
      name: "HRIS Administrator",
      email: "admin@sibs.local",
      role: effectiveRole,
      journeyEmployeeId: "SIBS-2901",
      trainerName: "Maria Cruz",
    };
  }

  const fullName =
    [hrisUser.first_name || hrisUser.firstName, hrisUser.last_name || hrisUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    hrisUser.name ||
    hrisUser.email ||
    "SiBS User";

  const sibsId = String(
    hrisUser.employee_id || hrisUser.sibs_id || hrisUser.id || "SIBS-2901"
  );

  return {
    sibsId,
    name: fullName,
    email: hrisUser.email || "user@sibs.local",
    role: effectiveRole,
    baseRole,
    journeyEmployeeId: effectiveRole === "Employee" ? sibsId : "SIBS-2901",
    trainerName: effectiveRole === "Trainer" ? fullName : "Maria Cruz",
  };
}

const journeyTabs = {
  Employee: ["trainee-dashboard"],
  TA: [
    "benchmark",
    "esep-coaching",
    "trainer-monitoring",
    "trainee-dashboard",
    "notifications",
    "configuration",
  ],
  IT: ["trainee-dashboard"],
  QDS: [
    "qds-dashboard",
    "trainer-monitoring",
    "esep-coaching",
    "benchmark",
    "trainee-dashboard",
    "notifications",
  ],
  Trainer: [
    "trainer-monitoring",
    "trainee-dashboard",
    "esep-coaching",
    "benchmark",
    "notifications",
  ],
  WFM: ["benchmark", "esep-coaching", "trainer-monitoring", "notifications"],
  HR: [
    "benchmark",
    "esep-coaching",
    "trainer-monitoring",
    "trainee-dashboard",
    "notifications",
    "configuration",
  ],
  "HR Admin": [
    "benchmark",
    "esep-coaching",
    "trainer-monitoring",
    "trainee-dashboard",
    "notifications",
    "configuration",
  ],
  "Team Leader": [
    "benchmark",
    "esep-coaching",
    "trainer-monitoring",
    "trainee-dashboard",
    "notifications",
  ],
  Manager: [
    "benchmark",
    "esep-coaching",
    "trainer-monitoring",
    "trainee-dashboard",
    "notifications",
  ],
  SOM: [
    "benchmark",
    "esep-coaching",
    "trainer-monitoring",
    "trainee-dashboard",
    "notifications",
  ],
  "Super Admin": [
    "benchmark",
    "esep-coaching",
    "trainer-monitoring",
    "trainee-dashboard",
    "notifications",
    "configuration",
  ],
};

export function canAccessJourneyTab(role, tab) {
  const list = journeyTabs[role] || journeyTabs["HR Admin"];
  return list.includes(tab);
}

export function defaultJourneyTab(role) {
  const list = journeyTabs[role] || journeyTabs["HR Admin"];
  return list[0] || "benchmark";
}

export const nhoRoleForDemoRole = {
  Employee: "Applicant",
  TA: "TA",
  IT: "IT",
  QDS: "QDS",
  Trainer: "Trainer",
  WFM: "WFM",
  HR: "HR",
  "HR Admin": "HR",
  "Team Leader": "HR",
  Manager: "HR",
  SOM: "HR",
  "Super Admin": "TA",
};

export function useDemoAuth() {
  const userCtx = useUser();
  const hrisUser = userCtx?.user || null;

  const [roleOverride, setRoleOverrideState] = useState(() => {
    try {
      return sessionStorage.getItem(ROLE_OVERRIDE_KEY) || null;
    } catch {
      return null;
    }
  });

  const setRoleOverride = useCallback((nextRole) => {
    setRoleOverrideState(nextRole);
    try {
      if (nextRole) sessionStorage.setItem(ROLE_OVERRIDE_KEY, nextRole);
      else sessionStorage.removeItem(ROLE_OVERRIDE_KEY);
    } catch {
      /* ignore session storage errors */
    }
  }, []);

  const adaptedUser = useMemo(
    () => mapHrisUserToAdapterUser(hrisUser, roleOverride),
    [hrisUser, roleOverride]
  );

  return useMemo(
    () => ({
      user: adaptedUser,
      roleOverride,
      setRoleOverride,
      signIn: () => ({ ok: true, user: adaptedUser }),
      signOut: () => setRoleOverride(null),
    }),
    [adaptedUser, roleOverride, setRoleOverride]
  );
}

export function useHrisModuleNavigation() {
  const navigate = useNavigate();

  return useCallback(
    (moduleName, journeyId) => {
      const normalized = String(moduleName || "").trim();
      if (
        normalized === "Employee Public Portal" ||
        normalized === "Public Applicant Portal" ||
        normalized === "NHO Applicant Portal" ||
        normalized === "Applicant Portal"
      ) {
        navigate("/public/applicant-portal");
        return;
      }
      if (
        normalized === "Orientation Settings" ||
        normalized === "Recruitment Settings"
      ) {
        navigate(
          "/settings/recruitment-settings?panel=" +
            encodeURIComponent("Orientation Deck & Knowledge Check")
        );
        return;
      }
      if (
        normalized === "New Hire Orientation" ||
        normalized === "New Hire Orientation (NHO)"
      ) {
        navigate("/recruitment/new-hire-orientation");
        return;
      }
      if (
        normalized === "QDS Dashboard" ||
        normalized === "Separate QDS Application" ||
        normalized === "QDS Application" ||
        normalized === "QDS"
      ) {
        navigate("/recruitment/qds-dashboard");
        return;
      }
      if (normalized === "ESEP Coaching") {
        navigate("/recruitment/esep-coaching");
        return;
      }
      if (normalized === "Trainer Monitoring") {
        navigate("/recruitment/trainer-monitoring");
        return;
      }
      if (
        normalized === "Trainee Dashboard" ||
        normalized === "Trainee Learning & Progress" ||
        normalized === "Trainee Learning"
      ) {
        navigate("/trainee-learning");
        return;
      }
      if (
        normalized === "Onboarding" ||
        normalized === "30 / 60 / 90 Reviews" ||
        normalized === "30/60/90 Reviews" ||
        normalized === "30/60/90 Employee Journey" ||
        normalized === "Employee Journey"
      ) {
        const suffix = journeyId
          ? `?tab=journey&journeyId=${encodeURIComponent(journeyId)}`
          : "?tab=journey";
        navigate(`/recruitment/onboarding${suffix}`);
        return;
      }
    },
    [navigate]
  );
}

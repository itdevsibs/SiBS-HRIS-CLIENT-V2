import { useEffect, useMemo, useState } from "react";

import { getAvailablePositionApprovalUsers } from "../lib/axios/getAvailablePositionApprovalSettings";
import { getHiringNeedsApprovalUsers } from "../lib/axios/getHiringNeedsApprovalSettings";
import { getJobDescriptionApprovalUsers } from "../lib/axios/getJobDescriptionApprovalSettings";

const APPROVAL_RULE_API_BY_MODULE = {
  availablePositions: getAvailablePositionApprovalUsers,
  hiringNeeds: getHiringNeedsApprovalUsers,
  jobDescription: getJobDescriptionApprovalUsers,
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeSibsId(value) {
  return cleanText(value).replace(/^SIBS[-_ ]?/i, "");
}

function getCurrentUserSibsId(user = {}) {
  return normalizeSibsId(
    user?.sibsId ||
      user?.sibs_id ||
      user?.employeeSibsId ||
      user?.employee_sibs_id ||
      user?.gy_emp_code ||
      user?.gy_user_code ||
      user?.userCode ||
      user?.user_code ||
      user?.employeeCode ||
      user?.employee_code ||
      user?.username,
  );
}

function getApprovalSettingsRows(responseData) {
  const rows =
    responseData?.data?.users ||
    responseData?.data?.rows ||
    responseData?.data ||
    responseData?.users ||
    responseData?.rows ||
    responseData ||
    [];

  return Array.isArray(rows) ? rows : [];
}

function getApprovalSettingsSibsId(row = {}) {
  return normalizeSibsId(
    row?.sibsId ||
      row?.sibs_id ||
      row?.employeeSibsId ||
      row?.employee_sibs_id ||
      row?.gy_emp_code ||
      row?.gy_user_code ||
      row?.userCode ||
      row?.user_code ||
      row?.username,
  );
}

export default function useApprovalRuleAccess(moduleKey, user) {
  const [approvalUsers, setApprovalUsers] = useState([]);
  const [canApprove, setCanApprove] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUserSibsId = useMemo(() => getCurrentUserSibsId(user), [user]);

  useEffect(() => {
    let cancelled = false;
    const getApprovalUsers = APPROVAL_RULE_API_BY_MODULE[moduleKey];
    const cleanUserSibsId = normalizeSibsId(currentUserSibsId);

    async function loadAccess() {
      if (!getApprovalUsers || !cleanUserSibsId) {
        if (!cancelled) {
          setApprovalUsers([]);
          setCanApprove(false);
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);

        const result = await getApprovalUsers();
        const rows = getApprovalSettingsRows(result);
        const allowed = rows.some(
          (row) =>
            getApprovalSettingsSibsId(row).toLowerCase() ===
            cleanUserSibsId.toLowerCase(),
        );

        if (!cancelled) {
          setApprovalUsers(rows);
          setCanApprove(allowed);
        }
      } catch (error) {
        console.error(`CHECK ${moduleKey} APPROVAL ACCESS ERROR:`, error);

        if (!cancelled) {
          setApprovalUsers([]);
          setCanApprove(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAccess();

    return () => {
      cancelled = true;
    };
  }, [currentUserSibsId, moduleKey]);

  return {
    approvalUsers,
    canApprove,
    loading,
  };
}

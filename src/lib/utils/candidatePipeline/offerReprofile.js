function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

// FST is the same training account represented in Talent Pool as
// "Foundation Skills Training" and in some approved PRFs as "FST".
// Keep this alias scoped to that account, not all training accounts.
function normalizedAccount(value) {
  const key = normalizeKey(value);
  if (["fst", "foundation skills training", "foundational skills training"].includes(key)) {
    return "foundation skills training";
  }
  return key;
}

// The applicant-facing position is FST TRAINER while the linked JD/PRF uses
// FOUNDATIONAL SKILLS TRAINER. Preserve the saved/displayed role labels;
// normalize only for linking to an approved PRF.
function normalizedRole(value) {
  const key = normalizeKey(value);
  if (["fst trainer", "foundation skills trainer", "foundational skills trainer"].includes(key)) {
    return "foundational skills trainer";
  }
  return key;
}

function normalizedSite(value) {
  return normalizeKey(value).replace(/ (site|branch)$/, "").trim();
}

/** Compare the approved PRF's canonical account/role, not only the displayed
 * labels. Account IDs can originate from different HRIS/Kronos namespaces,
 * so a verified canonical account name can match despite differing IDs. */
export function matchesApprovedPrfAssignment(option = {}, assignment = {}) {
  const role = normalizedRole(assignment.roleTitle);
  const prfRole = normalizedRole(option.roleTitle || option.raw?.roleTitle || option.raw?.jdRoleTitle);
  if (role && prfRole && role !== prfRole) return false;
  if (!role || !prfRole) return false; // Never link unrelated roles on account alone.

  const requestedAccountId = cleanText(assignment.accountId);
  const prfAccountId = cleanText(option.accountId || option.raw?.accountId || option.raw?.account_id);

  const requestedAccount = normalizedAccount(assignment.account);
  const validAccounts = [option.account, option.accountGhlName, option.raw?.accountName,
    option.raw?.account_name, option.raw?.accountGhlName, option.raw?.account_ghl_name]
    .map(normalizedAccount).filter(Boolean);
  const matchingName = requestedAccount && validAccounts.includes(requestedAccount);
  const matchingId = requestedAccountId && prfAccountId && requestedAccountId === prfAccountId;
  // Never override an explicit conflicting account name with an ID: account
  // IDs may come from distinct HRIS/Kronos masters and share numeric values.
  if (requestedAccount && validAccounts.length) {
    if (!matchingName) return false;
  } else if (!matchingId) {
    return false;
  }

  const requestedSite = normalizedSite(assignment.site);
  const prfSite = normalizedSite(option.locationSite || option.raw?.locationSite || option.raw?.location_site);
  if (requestedSite && prfSite && !["both", "all", "all locations"].includes(prfSite) &&
      requestedSite !== prfSite) return false;

  // Only usable, approved, unexpired requisitions may be selected.
  const row = option.raw || option;
  const approvalStatus = normalizeKey(row.approvalStatus || row.approval_status);
  if (approvalStatus && approvalStatus !== "approved") return false;
  if (row.isExpired === true || row.is_expired === true ||
      row.canUseInCandidatePipeline === false || row.can_use_in_candidate_pipeline === false) return false;
  const requestType = normalizeKey(row.requestType || row.request_type);
  if (requestType && requestType !== "requisition") return false;
  if (row.isHeadcountFilled === true || row.is_headcount_filled === true) return false;
  return true;
}

export function buildApprovedReprofileOptions({ hiringNeeds = [] }) {
  return hiringNeeds
    .map((item) => {
      const id = cleanText(
        item.id ?? item.hiringNeedId ?? item.hiring_need_id ?? item.prfId ?? item.prf_id,
      );
      const account = cleanText(item.account || item.accountName || item.account_name);
      const accountGhlName = cleanText(item.accountGhlName || item.account_ghl_name);
      const department = cleanText(item.department || item.departmentName || item.department_name);
      const displayLabel = [department, account].filter(Boolean).join(" / ");

      return {
        value: id,
        label: displayLabel,
        subLabel: "",
        searchText: [department, account, accountGhlName].filter(Boolean).join(" "),
        account,
        accountGhlName,
        accountId: cleanText(item.accountId || item.account_id),
        department,
        locationSite: cleanText(item.locationSite || item.location_site),
        roleTitle: cleanText(item.roleTitle || item.role_title || item.jdRoleTitle),
        raw: item,
      };
    })
    .filter((option) => option.value && option.label);
}

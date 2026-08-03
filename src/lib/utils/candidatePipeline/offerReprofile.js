function cleanText(value) {
  return String(value ?? "").trim();
}

export function buildApprovedReprofileOptions({ hiringNeeds = [] }) {
  return hiringNeeds
    .map((item) => {
      const id = cleanText(
        item.id ??
          item.hiringNeedId ??
          item.hiring_need_id ??
          item.prfId ??
          item.prf_id,
      );
      const account = cleanText(
        item.account || item.accountName || item.account_name,
      );
      const department = cleanText(
        item.department || item.departmentName || item.department_name,
      );
      const displayLabel = [department, account].filter(Boolean).join(" / ");

      return {
        value: id,
        label: displayLabel,
        subLabel: "",
        searchText: [department, account].filter(Boolean).join(" "),
        account,
        department,
        roleTitle: cleanText(item.roleTitle || item.role_title),
        raw: item,
      };
    })
    .filter((option) => option.value && option.label);
}

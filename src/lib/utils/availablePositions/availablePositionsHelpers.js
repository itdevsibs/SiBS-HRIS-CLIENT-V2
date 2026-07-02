// helper functions
export function cleanText(value) {
  return String(value ?? "").trim();
}

export function sameText(left = "", right = "") {
  return cleanText(left).toLowerCase() === cleanText(right).toLowerCase();
}

export function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPersonName(value) {
  const raw = String(value || "").trim();

  if (!raw) return "—";

  if (raw.includes("@")) {
    return raw
      .split("@")[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  return raw;
}

export function getUserDisplayName(user) {
  return formatPersonName(
    user?.fullName ||
      user?.fullname ||
      user?.name ||
      user?.employeeName ||
      user?.gy_emp_fullname ||
      user?.displayName ||
      user?.username ||
      user?.email ||
      "Current User",
  );
}

export function getStatusOption(meta, keyword) {
  const options = Array.isArray(meta?.statusOptions) ? meta.statusOptions : [];
  const lowerKeyword = String(keyword || "").toLowerCase();

  return (
    options.find(
      (item) =>
        String(item || "")
          .trim()
          .toLowerCase() === lowerKeyword,
    ) ||
    options.find((item) =>
      String(item || "")
        .trim()
        .toLowerCase()
        .includes(lowerKeyword),
    ) ||
    ""
  );
}

export function getInitialStatus(meta) {
  return getStatusOption(meta, "active") || meta?.statusOptions?.[0] || "";
}

export function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

export function getStatusTone(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus.includes("active") && !normalizedStatus.includes("in")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalizedStatus.includes("inactive")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (normalizedStatus.includes("draft")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalizedStatus.includes("archive")) {
    return "border-gray-200 bg-gray-50 text-gray-600";
  }

  return "border-blue-200 bg-blue-50 text-sibs-primary-1";
}



export function normalizeDropdownOptions(options = []) {
  return options
    .map((option) => {
      if (typeof option === "string" || typeof option === "number") {
        return {
          id: option,
          value: option,
          label: String(option),
          description: "",
          searchText: String(option),
          raw: null,
        };
      }

      const value = option?.value ?? option?.id ?? "";
      const label = option?.label ?? option?.name ?? option?.value ?? "";

      if (!cleanText(value) && !cleanText(label)) return null;

      return {
        ...option,
        id: option?.id ?? value ?? label,
        value: value || label,
        label: label || String(value),
        description: option?.description || "",
        searchText: [
          option?.searchText,
          option?.label,
          option?.name,
          option?.value,
          option?.id,
          option?.description,
        ]
          .filter(Boolean)
          .join(" "),
        raw: option?.raw || option,
      };
    })
    .filter(Boolean);
}

function cleanOptionValue(value) {
  return String(value ?? "").trim();
}

function toDropdownOption(value) {
  return {
    label: value,
    value,
    isEmpty: false,
  };
}

export function buildEmployeeDropdownOptions(
  options = [],
  selectedValue = "",
  emptyLabel = "Choose option",
  includeEmptyOption = true,
) {
  const configuredValues = [];
  const configuredSet = new Set();

  for (const option of Array.isArray(options) ? options : []) {
    const cleaned = cleanOptionValue(option);
    if (!cleaned || configuredSet.has(cleaned)) continue;

    configuredSet.add(cleaned);
    configuredValues.push(cleaned);
  }

  const selected = cleanOptionValue(selectedValue);
  const normalizedOptions = [];

  if (selected && !configuredSet.has(selected)) {
    normalizedOptions.push(toDropdownOption(selected));
  }

  normalizedOptions.push(...configuredValues.map(toDropdownOption));

  if (!includeEmptyOption) return normalizedOptions;

  return [
    {
      label: cleanOptionValue(emptyLabel) || "Choose option",
      value: "",
      isEmpty: true,
    },
    ...normalizedOptions,
  ];
}

export function filterEmployeeDropdownOptions(options = [], keyword = "") {
  const normalizedKeyword = cleanOptionValue(keyword).toLowerCase();
  const safeOptions = Array.isArray(options) ? options : [];

  if (!normalizedKeyword) return safeOptions;

  const clearOption = safeOptions.find((option) => option?.isEmpty);
  const matchedOptions = safeOptions.filter((option) => {
    if (option?.isEmpty) return false;

    return cleanOptionValue(option?.label)
      .toLowerCase()
      .includes(normalizedKeyword);
  });

  return clearOption ? [clearOption, ...matchedOptions] : matchedOptions;
}

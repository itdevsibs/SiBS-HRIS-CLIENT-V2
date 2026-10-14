import React, { useMemo } from "react";
import { SelectDropdown } from "@/components/ui";

export default function EmailLogCategoryDropdown({
  categories = [],
  value = "",
  onChange,
  label = "Template Category",
  placeholder = "Search categories...",
  disabled = false,
  className = "",
}) {
  const options = useMemo(() => {
    return categories.map((cat) => ({
      value: cat,
      label: cat,
    }));
  }, [categories]);

  return (
    <div className={`w-full font-jakarta ${className}`.trim()}>
      <SelectDropdown
        label={label}
        value={value}
        onChange={(val) => onChange?.(val)}
        options={options}
        placeholder={placeholder}
        searchable
        searchPlaceholder="Filter category..."
        clearable={false}
        disabled={disabled}
      />
    </div>
  );
}

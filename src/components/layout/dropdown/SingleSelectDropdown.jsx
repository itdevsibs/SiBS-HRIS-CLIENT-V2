import React from "react";
import SelectDropdown from "@/components/ui/SelectDropdown";

/**
 * Compatibility wrapper delegating to canonical SelectDropdown with DropdownPortal.
 * Prevents container clipping inside modals, tables, and compact card shells.
 */
const SingleSelectDropdown = ({
  refBox,
  label,
  required = false,
  value,
  placeholder = "Choose option",
  disabled = false,
  options = [],
  selectedValue,
  onSelect,
  loading = false,
  loadingText = "Loading...",
  emptyText = "No options found.",
  className = "",
  ...rest
}) => {
  return (
    <div ref={refBox} className="w-full">
      <SelectDropdown
        label={label}
        required={required}
        value={selectedValue ?? value}
        placeholder={loading ? loadingText : placeholder}
        disabled={disabled || loading}
        options={options}
        onChange={(val, opt) => onSelect?.(val, opt)}
        emptyMessage={emptyText}
        className={className}
        {...rest}
      />
    </div>
  );
};

export default SingleSelectDropdown;

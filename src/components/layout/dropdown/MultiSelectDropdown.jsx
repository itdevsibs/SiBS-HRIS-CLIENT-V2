import React from "react";
import SelectDropdown from "@/components/ui/SelectDropdown";

/**
 * Compatibility wrapper delegating to canonical SelectDropdown with DropdownPortal.
 * Prevents container clipping inside modals, tables, and compact card shells.
 */
const MultiSelectDropdown = ({
  refBox,
  label,
  required = false,
  values = [],
  placeholder = "Choose options",
  disabled = false,
  options = [],
  onChange,
  className = "",
  ...rest
}) => {
  return (
    <div ref={refBox} className="w-full">
      <SelectDropdown
        multiple
        label={label}
        required={required}
        value={values}
        placeholder={placeholder}
        disabled={disabled}
        options={options}
        onChange={onChange}
        className={className}
        {...rest}
      />
    </div>
  );
};

export default MultiSelectDropdown;

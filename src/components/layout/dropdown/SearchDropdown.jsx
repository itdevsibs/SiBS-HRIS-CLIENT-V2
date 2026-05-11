import React, { useMemo } from "react";

const SearchDropdown = ({
  refBox,
  label,
  required = false,
  value,
  searchValue,
  setSearchValue,
  placeholder,
  open,
  setOpen,
  disabled,
  loading,
  loadingText,
  options,
  selectedValue,
  getOptionValue,
  getOptionLabel,
  getOptionSubLabel,
  onSelect,
  onBeforeOpen,
  zIndex = "z-20",
}) => {
  const filteredOptions = useMemo(() => {
    const keyword = String(searchValue || "")
      .trim()
      .toLowerCase();

    if (!keyword) return options;

    return options.filter((option) => {
      const labelText = String(getOptionLabel(option) || "").toLowerCase();
      const subLabelText = String(
        getOptionSubLabel?.(option) || "",
      ).toLowerCase();

      return labelText.includes(keyword) || subLabelText.includes(keyword);
    });
  }, [options, searchValue, getOptionLabel, getOptionSubLabel]);

  return (
    <div ref={refBox} className={`relative self-start ${zIndex}`}>
      <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <input
        type="text"
        required={required}
        value={open ? searchValue : value || ""}
        onChange={(e) => {
          setSearchValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (disabled || loading) return;

          onBeforeOpen?.();
          setSearchValue(value || "");
          setOpen(true);
        }}
        placeholder={loading ? loadingText : placeholder}
        disabled={disabled || loading}
        autoComplete="off"
        className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-sibs-tertiary-5"
      />

      {open && !disabled && !loading && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-y-auto rounded-xl border border-sibs-tertiary-9 bg-white shadow-2xl">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const optionValue = getOptionValue(option);
              const optionLabel = getOptionLabel(option);
              const optionSubLabel = getOptionSubLabel?.(option);
              const isSelected =
                String(selectedValue || "") === String(optionValue || "");

              return (
                <button
                  key={String(optionValue)}
                  type="button"
                  onClick={() => {
                    onSelect(option);
                    setSearchValue(optionLabel || "");
                    setOpen(false);
                  }}
                  className={`block w-full border-b border-sibs-tertiary-9 px-4 py-3 text-left transition last:border-b-0 ${
                    isSelected
                      ? "bg-[#EAF2FB] font-medium text-sibs-primary-1"
                      : "text-sibs-primary-1 hover:bg-sibs-tertiary-10"
                  }`}
                >
                  <div className="text-sm font-semibold text-sibs-primary-1">
                    {optionLabel}
                  </div>

                  {optionSubLabel && (
                    <div className="text-xs text-sibs-tertiary-5">
                      {optionSubLabel}
                    </div>
                  )}
                </button>
              );
            })
          ) : searchValue.trim() ? (
            <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
              No results found
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-sibs-tertiary-5">
              Type to search
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;

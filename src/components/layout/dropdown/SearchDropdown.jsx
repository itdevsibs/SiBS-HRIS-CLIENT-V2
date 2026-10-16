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
    <div ref={refBox} className={`relative self-start ${zIndex} font-jakarta`}>
      {label && (
        <label className="mb-1 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
          {label} {required && <span className="text-sibs-orange">*</span>}
        </label>
      )}

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
        className="h-8.5 2xl:h-10 w-full rounded-lg 2xl:rounded-xl border border-sibs-border-subtle bg-sibs-canvas px-3 sibs-text-xs font-semibold text-sibs-navy outline-none transition focus:border-sibs-orange disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-slate-400"
      />

      {open && !disabled && !loading && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-sibs-border-subtle bg-white shadow-2xl sibs-scrollbar">
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
                  className={`block w-full border-b border-sibs-border/60 px-3 py-1.5 2xl:py-2 text-left transition last:border-b-0 ${
                    isSelected
                      ? "bg-sibs-cream-light font-extrabold text-sibs-orange"
                      : "text-sibs-navy hover:bg-sibs-canvas"
                  }`}
                >
                  <div className="sibs-text-xs font-semibold text-sibs-navy">
                    {optionLabel}
                  </div>

                  {optionSubLabel && (
                    <div className="text-[9px] font-bold text-slate-400">
                      {optionSubLabel}
                    </div>
                  )}
                </button>
              );
            })
          ) : searchValue.trim() ? (
            <div className="px-3 py-2 text-xs font-semibold text-slate-400">
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

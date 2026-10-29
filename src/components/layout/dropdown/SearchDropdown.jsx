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
        className={`h-8.5 2xl:h-10 w-full rounded-[10px] border px-3 sibs-text-xs font-bold text-sibs-navy outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-slate-400 ${
          open
            ? "border-sibs-orange bg-white ring-4 ring-sibs-orange/10"
            : "border-sibs-border bg-sibs-surface hover:border-sibs-orange/40 hover:bg-white"
        }`}
      />

      <div
        className={`sibs-animated-dropdown absolute left-0 right-0 top-full z-[9999] mt-1.5 ${
          open && !disabled && !loading ? "open" : "closed"
        }`}
      >
        <div className="sibs-animated-dropdown-inner">
          <div className="sibs-animated-dropdown-box overflow-hidden rounded-[10px] border border-sibs-border bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
            <div className="max-h-56 overflow-y-auto py-2 sibs-scrollbar">
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
                      className={`block w-full border-b border-sibs-border/40 px-3 py-2 2xl:px-4 2xl:py-2.5 text-left transition last:border-b-0 ${
                        isSelected
                          ? "bg-sibs-cream-light font-extrabold text-sibs-orange"
                          : "font-semibold text-sibs-text-secondary hover:bg-sibs-cream-subtle hover:text-sibs-orange"
                      }`}
                    >
                      <div className="sibs-text-xs font-semibold text-sibs-navy">
                        {optionLabel}
                      </div>

                      {optionSubLabel && (
                        <div className="mt-0.5 text-[9px] font-bold text-slate-400">
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
                <div className="px-4 py-3 text-sm text-sibs-muted">
                  Type to search
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDropdown;

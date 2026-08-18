import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  zIndex = "z-30",
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const displayValue = value || placeholder;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${zIndex}`}>
      <label className="mb-1 block sibs-text-micro font-extrabold uppercase tracking-wide text-[#667085]">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="flex h-8.5 2xl:h-10 w-full items-center justify-between rounded-lg border border-[#D0D5DD] bg-white px-3 text-left sibs-text-xs font-extrabold text-[#344054] outline-none transition hover:border-[#FF5C28]/30 hover:bg-[#F8FAFC] focus:border-[#FF5C28] focus:ring-2 focus:ring-[#FF5C28]/10"
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-[#667085] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div className={`sibs-animated-dropdown absolute left-0 right-0 top-full mt-2 ${open ? "open" : "closed"}`}>
        <div className="sibs-animated-dropdown-inner">
          <div className="sibs-animated-dropdown-box">
            <div className="max-h-64 overflow-y-auto py-1.5 sibs-scrollbar">
              {options.map((option) => {
                const selected = value === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                    className={`block w-full px-3.5 py-2 text-left sibs-text-xs transition ${
                      selected
                        ? "bg-[#E9F0FC] font-extrabold text-[#042C51]"
                        : "font-semibold text-[#344054] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <span className="block truncate">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

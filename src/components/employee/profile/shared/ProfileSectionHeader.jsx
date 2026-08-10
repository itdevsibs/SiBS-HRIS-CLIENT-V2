import { Edit3 } from "lucide-react";

export default function ProfileSectionHeader({
  title,
  subtitle,
  icon: Icon,
  isEditing,
  onEdit,
}) {
  return (
    <div className="mb-3 2xl:mb-4 flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <span className="flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-xl bg-[#E9F0FC] text-[#042C51]">
              <Icon size={16} className="2xl:h-4.5 2xl:w-4.5" />
            </span>
          ) : null}
          <h2 className="min-w-0 break-words text-xs sm:text-sm 2xl:text-base font-extrabold text-[#042C51]">
            {title}
          </h2>
        </div>
        <p className="mt-0.5 text-[10px] 2xl:text-xs font-medium leading-relaxed text-[#667085]">
          {subtitle ||
            "Official record values are shown from the existing employee data source."}
        </p>
      </div>

      {!isEditing && onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-7 2xl:h-8 w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#E6ECF2] bg-white px-2.5 2xl:px-3 text-[10px] 2xl:text-[11px] font-black text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F2] hover:text-[#FF5C28] sm:self-center"
        >
          <Edit3 size={12} className="text-[#FF5C28] 2xl:h-[13px] 2xl:w-[13px]" />
          Edit Section
        </button>
      ) : null}
    </div>
  );
}

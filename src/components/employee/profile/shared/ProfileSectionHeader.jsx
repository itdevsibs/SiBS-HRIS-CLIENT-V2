import { Edit3 } from "lucide-react";

export default function ProfileSectionHeader({
  title,
  subtitle,
  icon: Icon,
  isEditing,
  onEdit,
}) {
  return (
    <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E9F0FC] text-[#042C51]">
              <Icon size={18} />
            </span>
          ) : null}
          <h2 className="min-w-0 break-words text-base font-extrabold text-[#042C51]">
            {title}
          </h2>
        </div>
        <p className="mt-1 text-xs font-medium leading-5 text-[#667085]">
          {subtitle ||
            "Official record values are shown from the existing employee data source."}
        </p>
      </div>

      {!isEditing && onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-8 w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#E6ECF2] bg-white px-3 text-[11px] font-black text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F2] hover:text-[#FF5C28] sm:self-center"
        >
          <Edit3 size={13} className="text-[#FF5C28]" />
          Edit Section
        </button>
      ) : null}
    </div>
  );
}

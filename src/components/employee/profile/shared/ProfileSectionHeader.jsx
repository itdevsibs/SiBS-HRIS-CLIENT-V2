import { Edit3 } from "lucide-react";

export default function ProfileSectionHeader({
  title,
  subtitle,
  icon: Icon,
  isEditing,
  onEdit,
}) {
  return (
    <div className="mb-3 2xl:mb-4 flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between font-jakarta">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <span className="flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-xl bg-[#E9F0FC] text-sibs-navy">
              <Icon size={16} className="2xl:h-4.5 2xl:w-4.5 text-sibs-navy" />
            </span>
          ) : null}
          <h2 className="font-heading min-w-0 break-words text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
            {title}
          </h2>
        </div>
        <p className="mt-0.5 sibs-text-xs font-semibold leading-relaxed text-sibs-muted">
          {subtitle ||
            "Official record values are shown from the existing employee data source."}
        </p>
      </div>

      {!isEditing && onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-7 2xl:h-8 w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-sibs-border bg-white px-2.5 2xl:px-3 sibs-text-xs font-black text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-[#FFF7F2] hover:text-sibs-orange sm:self-center"
        >
          <Edit3 size={12} className="text-sibs-orange 2xl:h-[13px] 2xl:w-[13px]" />
          Edit Section
        </button>
      ) : null}
    </div>
  );
}

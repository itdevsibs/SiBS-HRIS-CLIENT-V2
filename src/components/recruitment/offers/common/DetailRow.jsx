export default function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] py-3 font-jakarta last:border-b-0">
      <p className="text-[10px] font-extrabold uppercase tracking-normal text-[#667085]">
        {label}
      </p>

      <div className="max-w-[62%] break-words text-right text-xs font-extrabold text-[#042C51]">
        {value || "--"}
      </div>
    </div>
  );
}

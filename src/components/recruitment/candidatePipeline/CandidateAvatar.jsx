import React from "react";

const CandidateAvatar = ({ candidate = {} }) => {
  const initials = String(candidate.name || candidate.candidateName || "?")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      aria-hidden="true"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white shadow-sm ring-2 ring-white ${
        candidate.avatarColor || "bg-[#042C51]"
      }`}
    >
      {initials || "?"}
    </div>
  );
};

export default CandidateAvatar;

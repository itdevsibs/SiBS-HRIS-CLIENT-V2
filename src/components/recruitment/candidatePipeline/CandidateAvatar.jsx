import React from "react";

const CandidateAvatar = ({ candidate }) => {
  const initials = String(candidate.name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
        candidate.avatarColor || "bg-sibs-primary-1"
      }`}
    >
      {initials}
    </div>
  );
};

export default CandidateAvatar;

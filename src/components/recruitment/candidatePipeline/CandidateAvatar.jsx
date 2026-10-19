import React from "react";

// Use first-name and last-name initials; never substitute the middle name.
export function getCandidateInitials(candidate = {}) {
  const firstName = String(candidate.firstName || candidate.first_name || "").trim();
  const lastName = String(candidate.lastName || candidate.last_name || "").trim();

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  // Pipeline records may only contain a combined display name.
  const fullName = String(
    candidate.name || candidate.candidateName || candidate.candidate_name || "",
  ).trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";

  // A trailing suffix isn't the surname (e.g. "Juan Pedro Dela Cruz Jr.").
  const suffixes = new Set(["JR", "SR", "II", "III", "IV", "V"]);
  const surnameIndex =
    parts.length > 1 && suffixes.has(parts[parts.length - 1].replace(/\./g, "").toUpperCase())
      ? parts.length - 2
      : parts.length - 1;

  return `${parts[0][0]}${surnameIndex > 0 ? parts[surnameIndex][0] : ""}`.toUpperCase();
}

const CandidateAvatar = ({ candidate = {} }) => {
  const initials = getCandidateInitials(candidate);

  return (
    <div
      aria-hidden="true"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white shadow-sm ring-2 ring-white ${
        candidate.avatarColor || "bg-sibs-navy"
      }`}
    >
      {initials || "?"}
    </div>
  );
};

export default CandidateAvatar;

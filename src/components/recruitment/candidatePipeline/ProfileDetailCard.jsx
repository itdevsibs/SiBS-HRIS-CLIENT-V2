import React from "react";

const ProfileDetailCard = ({ title, children }) => {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-[0_8px_22px_rgba(4,44,81,0.04)]">
      <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
        {title}
      </h4>
      <div className="rounded-xl border border-[#EEF2F6] bg-[#F8FAFC] p-4">
        {children}
      </div>
    </div>
  );
};

export default ProfileDetailCard;

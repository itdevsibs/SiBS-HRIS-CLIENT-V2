import React from "react";

const ProfileDetailCard = ({ title, children }) => {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {title}
      </h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
};

export default ProfileDetailCard;

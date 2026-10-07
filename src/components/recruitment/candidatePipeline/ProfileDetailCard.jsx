import React from "react";

const ProfileDetailCard = ({ title, children }) => {
  return (
    <div className="rounded-[10px] border border-sibs-border bg-white p-5 shadow-[0_8px_22px_rgba(4,44,81,0.04)]">
      <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-sibs-navy">
        {title}
      </h4>
      <div className="rounded-[10px] border border-sibs-border bg-sibs-surface p-4">
        {children}
      </div>
    </div>
  );
};

export default ProfileDetailCard;

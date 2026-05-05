import { SquarePen } from "lucide-react";
import React from "react";

const ProfileDropdown = ({ openModal, openDropdown }) => {
  return (
    <div className="profile-action-dropdown" onClick={(e) => e.stopPropagation()}>
      <div className="profile-action-dropdown-header">
        <p>Additional Actions</p>
      </div>

      <button
        type="button"
        onClick={() => {
          openModal(true);
          openDropdown(false);
        }}
        className="profile-action-dropdown-item"
      >
        <div className="profile-action-dropdown-icon">
          <SquarePen size={18} />
        </div>

        <div className="profile-action-dropdown-text">
          <span className="profile-action-dropdown-title">
            Submit Resignation
          </span>
          <span className="profile-action-dropdown-subtitle">
            Employee resignation request
          </span>
        </div>
      </button>
    </div>
  );
};

export default ProfileDropdown;
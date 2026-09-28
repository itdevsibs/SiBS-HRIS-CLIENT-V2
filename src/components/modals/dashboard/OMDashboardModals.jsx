import React from "react";
import OMRoleDetailsModal from "../../Dashboard/OMDashboard/OMRoleDetailsModal";

export { OMRoleDetailsModal };

export function OperationsHiringDetailsModal({ open, role, onClose }) {
  if (!open || !role) return null;
  return <OMRoleDetailsModal role={role} onClose={onClose} />;
}

export default OMRoleDetailsModal;

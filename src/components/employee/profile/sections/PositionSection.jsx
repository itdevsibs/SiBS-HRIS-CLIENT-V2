import { BriefcaseBusiness } from "lucide-react";

import ProfileSectionHeader from "../shared/ProfileSectionHeader.jsx";
import ProfilePanel from "../shared/ProfilePanel.jsx";
import {
  ProfileFieldControl,
  ProfileReadField,
} from "../shared/ProfileFields.jsx";
import ProfileSaveBar from "../shared/ProfileSaveBar.jsx";

export default function PositionSection({
  employee,
  isEditing,
  isSaving,
  canEditDetails,
  onEdit,
  onChange,
  onSave,
  onCancel,
}) {
  return (
    <div className="space-y-4">
      <ProfileSectionHeader
        title="Employee Position"
        subtitle="Manually maintain the employee's official position in the HRIS profile."
        icon={BriefcaseBusiness}
        isEditing={isEditing}
        onEdit={canEditDetails ? onEdit : undefined}
      />

      <ProfilePanel title={isEditing ? "Update Position" : "Current Position"}>
        <div className="max-w-2xl">
          {isEditing ? (
            <ProfileFieldControl
              label="Position"
              value={employee?.position}
              onChange={(value) => onChange?.("position", value)}
              placeholder="Enter employee position"
              disabled={isSaving}
            />
          ) : (
            <ProfileReadField label="Position" value={employee?.position} />
          )}
        </div>
      </ProfilePanel>

      {isEditing ? (
        <ProfileSaveBar
          label="Employee Position"
          onCancel={onCancel}
          onSave={onSave}
        />
      ) : null}
    </div>
  );
}

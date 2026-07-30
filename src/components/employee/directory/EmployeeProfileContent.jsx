import { ApplicationSection } from "../sections/ApplicationSection.jsx";
import DocumentsSection from "../sections/DocumentsSection.jsx";
import { FamilySection } from "../sections/FamilySection.jsx";
import { NotesSection } from "../sections/NotesSection.jsx";
import { PersonalSection } from "../sections/PersonalSection.jsx";
import { SkillsSection } from "../sections/SkillsSection.jsx";
import { TimelineSection } from "../sections/TimelineSection.jsx";

export default function EmployeeProfileContent({
  activePrimary,
  activeSubTab,
  sectionProps,
}) {
  const {
    employee,
    displayEmployee,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    onChange,
    onListChange,
    onDocumentsChange,
    onCommitNote,
    onFeedback,
  } = sectionProps;

  const commonEditProps = {
    employee: displayEmployee,
    isEditing,
    onEdit,
    onSave,
    onCancel,
  };

  if (activePrimary === "personal") {
    return (
      <PersonalSection
        {...commonEditProps}
        selectedSubTab={activeSubTab || "basic"}
        onChange={onChange}
      />
    );
  }

  if (activePrimary === "family") {
    return (
      <FamilySection
        {...commonEditProps}
        selectedSubTab={activeSubTab || "spouse"}
        onChange={onChange}
        onListChange={onListChange}
      />
    );
  }

  if (
    ["education", "eligibility", "experience", "training", "references"].includes(
      activePrimary,
    )
  ) {
    return (
      <TimelineSection
        {...commonEditProps}
        activeSection={activePrimary}
        onListChange={onListChange}
      />
    );
  }

  if (activePrimary === "skills") {
    return (
      <SkillsSection
        {...commonEditProps}
        selectedSubTab={activeSubTab || "skills"}
        onListChange={onListChange}
      />
    );
  }

  if (activePrimary === "application") {
    return (
      <ApplicationSection
        {...commonEditProps}
        selectedSubTab={activeSubTab || "overview"}
        onChange={onChange}
        onListChange={onListChange}
      />
    );
  }

  if (activePrimary === "documents") {
    return (
      <DocumentsSection
        employee={employee}
        onDocumentsChange={onDocumentsChange}
        onFeedback={onFeedback}
      />
    );
  }

  if (activePrimary === "notes") {
    return (
      <NotesSection
        employee={employee}
        onCommitNote={onCommitNote}
        onFeedback={onFeedback}
      />
    );
  }

  return null;
}

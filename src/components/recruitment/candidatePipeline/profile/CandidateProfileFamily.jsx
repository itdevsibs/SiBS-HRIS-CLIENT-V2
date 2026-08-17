import React from "react";
import { CandidateProfileField, CandidateProfilePanel } from "./CandidateProfileField";

export default function CandidateProfileFamily({ data }) {
  return (
    <CandidateProfilePanel title="Family Background & Emergency Contacts">
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <CandidateProfileField
          label="Emergency Contact Person"
          value={data.emergencyContactName}
          highlight
        />
        <CandidateProfileField
          label="Relationship"
          value={data.emergencyContactRelationship}
        />
        <CandidateProfileField
          label="Emergency Contact Number"
          value={data.emergencyContactPhone}
          copyable
        />
        <CandidateProfileField
          label="Father's Full Name"
          value={data.fatherName}
        />
        <CandidateProfileField
          label="Mother's Maiden Name"
          value={data.motherName}
        />
        <CandidateProfileField
          label="Spouse Full Name"
          value={data.spouseName}
        />
      </div>
    </CandidateProfilePanel>
  );
}

import React from "react";
import { CandidateProfileField, CandidateProfilePanel } from "./CandidateProfileField";

export default function CandidateProfilePersonalInfo({ data }) {
  return (
    <CandidateProfilePanel title="Personal & Contact Information">
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <CandidateProfileField label="First Name" value={data.firstName} />
        <CandidateProfileField label="Middle Name" value={data.middleName} />
        <CandidateProfileField label="Last Name" value={data.lastName} />
        <CandidateProfileField label="Suffix" value={data.suffix} />
        <CandidateProfileField label="Nickname" value={data.nickname} />
        <CandidateProfileField label="Date of Birth" value={data.dateOfBirthFormatted} />
        <CandidateProfileField label="Age" value={data.age} />
        <CandidateProfileField label="Gender / Sex" value={data.gender} />
        <CandidateProfileField label="Civil Status" value={data.civilStatus} />
        <CandidateProfileField label="Nationality" value={data.nationality} />
        <CandidateProfileField label="Religion" value={data.religion} />
        <CandidateProfileField label="Email Address" value={data.email} copyable />
        <CandidateProfileField label="Primary Phone" value={data.phone1} copyable />
        <CandidateProfileField label="Secondary Phone" value={data.phone2} copyable />
        <CandidateProfileField label="Landline" value={data.landline} />
        <CandidateProfileField label="Present / Physical Address" value={data.physicalAddress} className="sm:col-span-2" />
        <CandidateProfileField label="Permanent Address" value={data.permanentAddress || data.physicalAddress} className="sm:col-span-2" />
      </div>
    </CandidateProfilePanel>
  );
}

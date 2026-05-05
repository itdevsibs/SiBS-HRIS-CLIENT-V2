import { Library } from "lucide-react";
import React from "react";
import InfoField from "./tab-layout/InfoField";
import { useUser } from "@/services/context/UserContext";
import { formatDate } from "@/components/layout/FormatDateTime";

const PersonalTab = () => {
  const { user } = useUser();

  return (
    <div className="rounded-[22px] border border-[#D9E2EC] bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-6 flex items-center gap-2">
        <Library size={24} className="text-sibs-primary-1" />

        <h3 className="text-2xl font-bold leading-none text-sibs-primary-1 sm:text-[28px]">
          Basic Information
        </h3>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoField label="SiBS ID" value={user?.sibs_id || user?.sibsId} />
          <InfoField label="Status" value={user?.status || "Active"} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InfoField label="First Name" value={user?.firstName || "N/A"} />
          <InfoField label="Middle Name" value={user?.middleName || "N/A"} />
          <InfoField label="Last Name" value={user?.lastName || "N/A"} />
          <InfoField
            label="Preferred Name"
            value={user?.preferredName || "N/A"}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <InfoField label="Birth Date" value={formatDate(user?.birthdate)} />
          <InfoField label="Gender" value={user?.gender || "N/A"} />
          <InfoField
            label="Marital Status"
            value={user?.civilStatus || "N/A"}
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalTab;
import { Library } from "lucide-react";
import React from "react";
import InfoField from "./tab-layout/InfoField";
import { useUser } from "@/services/context/UserContext";
import { formatDate } from "@/components/layout/FormatDateTime";

const PersonalTab = () => {
  const { user } = useUser();

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#ffffff",
        border: "1px solid #D9E2EC",
        borderRadius: "22px",
        padding: "24px",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "28px",
        }}
      >
        <Library
          size={24}
          style={{
            flexShrink: 0,
            color: "var(--sibs-primary-1)",
          }}
        />

        <h3
          style={{
            margin: 0,
            color: "var(--sibs-primary-1)",
            fontSize: "28px",
            lineHeight: "1.2",
            fontWeight: 700,
          }}
        >
          Basic Information
        </h3>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "20px 16px",
          }}
        >
          <InfoField
            label="SiBS ID"
            value={user?.sibs_id || user?.sibsId || "N/A"}
          />
          <InfoField label="Status" value={user?.status || "Active"} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "20px 16px",
          }}
        >
          <InfoField label="First Name" value={user?.firstName || "N/A"} />
          <InfoField label="Middle Name" value={user?.middleName || "N/A"} />
          <InfoField label="Last Name" value={user?.lastName || "N/A"} />
          <InfoField
            label="Preferred Name"
            value={user?.preferredName || "N/A"}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "20px 16px",
          }}
        >
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
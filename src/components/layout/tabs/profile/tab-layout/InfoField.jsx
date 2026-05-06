import React from "react";

const InfoField = ({ label, value }) => {
  return (
    <div
      style={{
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <label
        style={{
          display: "block",
          margin: 0,
          color: "var(--sibs-primary-1)",
          fontSize: "14px",
          fontWeight: 500,
          lineHeight: "1.2",
        }}
      >
        {label}
      </label>

      <div
        style={{
          minHeight: "52px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          borderRadius: "10px",
          border: "1px solid var(--sibs-tertiary-8)",
          backgroundColor: "var(--sibs-tertiary-10)",
          padding: "0 16px",
          color: "var(--sibs-tertiary-5)",
          fontSize: "14px",
          fontWeight: 500,
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value || "N/A"}
        </span>
      </div>
    </div>
  );
};

export default InfoField;
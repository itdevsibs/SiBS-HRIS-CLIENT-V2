import React from "react";
import ResignationList from "./tab-layout/ResignationList";

const ResignationTab = ({ maxHeight }) => {
  return (
    <div className="mx-2 w-full" style={{ maxHeight }}>
      <ResignationList maxHeight={maxHeight} />
    </div>
  );
};

export default ResignationTab;

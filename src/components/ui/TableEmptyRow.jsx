import React from "react";
import EmptyStatePanel from "./EmptyStatePanel";

export default function TableEmptyRow({
  colSpan = 8,
  title = "No records found",
  description = "Try adjusting your search or filters.",
  icon,
  actionLabel,
  onAction,
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <EmptyStatePanel
          icon={icon}
          title={title}
          description={description}
          actionLabel={actionLabel}
          onAction={onAction}
        />
      </td>
    </tr>
  );
}

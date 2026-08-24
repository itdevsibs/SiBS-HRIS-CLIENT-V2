import { useEffect, useState } from "react";

import { subscribeToApprovalRuleChanges } from "../lib/utils/approvalRuleEvents";

export default function useApprovalRuleRevision(moduleKey) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    return subscribeToApprovalRuleChanges(moduleKey, () => {
      setRevision((current) => current + 1);
    });
  }, [moduleKey]);

  return revision;
}

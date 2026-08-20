import { useCallback, useState } from "react";
import {
  getJobDescriptionDeletionImpact,
  permanentlyDeleteJobDescription,
} from "../../lib/axios/getJobDescription";

const INITIAL_STATE = {
  open: false,
  loading: false,
  deleting: false,
  impact: null,
  error: "",
};

export default function useJobDescriptionDeletion() {
  const [state, setState] = useState(INITIAL_STATE);

  const openDeletionModal = useCallback(async (jdId) => {
    if (!jdId) {
      return {
        success: false,
        message: "Invalid job description ID.",
      };
    }

    setState({
      open: true,
      loading: true,
      deleting: false,
      impact: null,
      error: "",
    });

    const result = await getJobDescriptionDeletionImpact(jdId);

    if (!result?.success) {
      setState({
        open: false,
        loading: false,
        deleting: false,
        impact: null,
        error: result?.message || "",
      });

      return result;
    }

    setState({
      open: true,
      loading: false,
      deleting: false,
      impact: result.data,
      error: "",
    });

    return result;
  }, []);

  const closeDeletionModal = useCallback(() => {
    setState((current) => {
      if (current.deleting) {
        return current;
      }

      return INITIAL_STATE;
    });
  }, []);

  const permanentlyDelete = useCallback(async (jdId, payload = {}) => {
    if (!jdId) {
      return {
        success: false,
        message: "Invalid job description ID.",
      };
    }

    setState((current) => ({
      ...current,
      deleting: true,
      error: "",
    }));

    const result = await permanentlyDeleteJobDescription(jdId, payload);

    if (!result?.success) {
      setState((current) => ({
        ...current,
        deleting: false,
        error: result?.message || "Permanent deletion failed.",
      }));

      return result;
    }

    setState(INITIAL_STATE);

    return result;
  }, []);

  return {
    ...state,

    openDeletionModal,
    closeDeletionModal,
    permanentlyDelete,
  };
}

import { useEffect, useRef, useState } from "react";

export default function useAddJobDescriptionModal({
  open,
  onClose,
  resetRequirementFromProvider,
  resetJobDescriptionForm,
}) {
  const linkedRequirementRef = useRef(null);
  const accountSearchRef = useRef(null);
  const departmentSearchRef = useRef(null);
  const jdStatusRef = useRef(null);
  const requestedByRef = useRef(null);

  const [linkedRequirementOpen, setLinkedRequirementOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [jdStatusOpen, setJdStatusOpen] = useState(false);
  const [requestedByOpen, setRequestedByOpen] = useState(false);

  const [accountSearch, setAccountSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [requestedBySearch, setRequestedBySearch] = useState("");

  function closeAllDropdowns() {
    setLinkedRequirementOpen(false);
    setAccountOpen(false);
    setDepartmentOpen(false);
    setJdStatusOpen(false);
    setRequestedByOpen(false);
  }

  function clearSearchInputs() {
    setAccountSearch("");
    setDepartmentSearch("");
    setRequestedBySearch("");
  }

  function handleLinkedRequirementChange() {
    resetRequirementFromProvider();

    clearSearchInputs();
    closeAllDropdowns();
  }

  function handleResetForm() {
    resetJobDescriptionForm();

    clearSearchInputs();
    closeAllDropdowns();
  }

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeAllDropdowns();
        onClose?.();
      }
    };

    const handleClickOutside = (event) => {
      if (
        linkedRequirementRef.current &&
        !linkedRequirementRef.current.contains(event.target)
      ) {
        setLinkedRequirementOpen(false);
      }

      if (
        accountSearchRef.current &&
        !accountSearchRef.current.contains(event.target)
      ) {
        setAccountOpen(false);
      }

      if (
        departmentSearchRef.current &&
        !departmentSearchRef.current.contains(event.target)
      ) {
        setDepartmentOpen(false);
      }

      if (jdStatusRef.current && !jdStatusRef.current.contains(event.target)) {
        setJdStatusOpen(false);
      }

      if (
        requestedByRef.current &&
        !requestedByRef.current.contains(event.target)
      ) {
        setRequestedByOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);

      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open, onClose]);

  return {
    refs: {
      linkedRequirementRef,
      accountSearchRef,
      departmentSearchRef,
      jdStatusRef,
      requestedByRef,
    },

    dropdownState: {
      linkedRequirementOpen,
      setLinkedRequirementOpen,
      accountOpen,
      setAccountOpen,
      departmentOpen,
      setDepartmentOpen,
      jdStatusOpen,
      setJdStatusOpen,
      requestedByOpen,
      setRequestedByOpen,
    },

    searchState: {
      accountSearch,
      setAccountSearch,
      departmentSearch,
      setDepartmentSearch,
      requestedBySearch,
      setRequestedBySearch,
    },

    closeAllDropdowns,
    handleLinkedRequirementChange,
    handleResetForm,
  };
}

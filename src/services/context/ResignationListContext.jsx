import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const ResignationListContext = createContext(null);

export function ResignationListProvider({ children }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [openEditResignationModal, setOpenEditResignationModal] =
    useState(false);
  const [resignationId, setResignationId] = useState(null);

  const refreshResignationList = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const value = useMemo(
    () => ({
      refreshKey,
      refreshResignationList,
      openEditResignationModal,
      setOpenEditResignationModal,
      resignationId,
      setResignationId,
    }),
    [
      refreshKey,
      refreshResignationList,
      openEditResignationModal,
      setOpenEditResignationModal,
      resignationId,
      setResignationId,
    ],
  );

  return (
    <ResignationListContext.Provider value={value}>
      {children}
    </ResignationListContext.Provider>
  );
}

export function useResignationList() {
  const context = useContext(ResignationListContext);

  if (!context) {
    throw new Error(
      "useResignationList must be used within ResignationListProvider",
    );
  }

  return context;
}

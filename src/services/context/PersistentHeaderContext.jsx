import { createContext, useContext } from "react";

const PersistentHeaderContext = createContext(false);

export function PersistentHeaderProvider({ children }) {
  return (
    <PersistentHeaderContext.Provider value={true}>
      {children}
    </PersistentHeaderContext.Provider>
  );
}

export function usePersistentHeader() {
  return useContext(PersistentHeaderContext);
}

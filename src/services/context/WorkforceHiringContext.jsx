/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

const WorkforceHiringContext = createContext(null);

export function WorkforceHiringProvider({ children }) {
  const valueRef = useRef({});

  const setWorkforceHiringValue = useCallback((nextValue = {}) => {
    valueRef.current = nextValue || {};
  }, []);

  const clearWorkforceHiringValue = useCallback(() => {
    valueRef.current = {};
  }, []);

  const value = useMemo(
    () => ({
      setWorkforceHiringValue,
      clearWorkforceHiringValue,

      get pageHeader() {
        return valueRef.current.pageHeader || {};
      },

      get weeklyVersion() {
        return valueRef.current.weeklyVersion || {};
      },

      get viewPlanModal() {
        return valueRef.current.viewPlanModal || {};
      },

      get tables() {
        return valueRef.current.tables || {};
      },
    }),
    [clearWorkforceHiringValue, setWorkforceHiringValue],
  );

  return (
    <WorkforceHiringContext.Provider value={value}>
      {children}
    </WorkforceHiringContext.Provider>
  );
}

export function useWorkforceHiring(optional = false) {
  const context = useContext(WorkforceHiringContext);

  if (!context && !optional) {
    throw new Error(
      "useWorkforceHiring must be used within WorkforceHiringProvider",
    );
  }

  return context;
}

export function useRegisterWorkforceHiringValue(value) {
  const context = useWorkforceHiring();

  context.setWorkforceHiringValue(value);

  useEffect(() => {
    return () => {
      context.clearWorkforceHiringValue();
    };
  }, [context]);
}

export function useRegisterWorkforceHiringPage({
  pageHeader = {},
  weeklyVersion = {},
  viewPlanModal = {},
  tables = {},
}) {
  useRegisterWorkforceHiringValue({
    pageHeader,
    weeklyVersion,
    viewPlanModal,
    tables,
  });
}

export default WorkforceHiringContext;

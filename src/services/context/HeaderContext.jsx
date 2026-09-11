import { createContext, useContext, useState } from "react";

const HeaderContext = createContext();

export function useHeader() {
  const context = useContext(HeaderContext);

  if (!context) {
    throw new Error("useHeader must be used within HeaderProvider");
  }

  return context;
}

const HeaderProvider = ({ children }) => {
  const [adminLogin, setAdminLogin] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <HeaderContext.Provider
      value={{
        adminLogin,
        setAdminLogin,
        mobileSidebarOpen,
        setMobileSidebarOpen,
      }}
    >
      {children}
    </HeaderContext.Provider>
  );
};

export default HeaderProvider;

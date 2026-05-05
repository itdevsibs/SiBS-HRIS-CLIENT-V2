import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "./context/UserContext";
import HeaderProvider from "./context/HeaderContext";
import { AdminProvider } from "./context/AdminContext";
import { PaginationProvider } from "./context/PaginationContext";
import { ResignationListProvider } from "./context/ResignationListContext";

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PaginationProvider>
        <HeaderProvider>
          <UserProvider>
            <AdminProvider>
              <ResignationListProvider>{children}</ResignationListProvider>
            </AdminProvider>
          </UserProvider>
        </HeaderProvider>
      </PaginationProvider>
    </QueryClientProvider>
  );
}

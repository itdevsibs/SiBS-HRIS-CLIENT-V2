import { useEffect } from "react";
import AppShell from "./AppShell";
import Router from "./router";
import "./index.css";

export default function App() {
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <AppShell>
      <Router />
    </AppShell>
  );
}
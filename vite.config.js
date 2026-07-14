import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: {
    watch: {
      // Detect changes reliably on Windows, network drives,
      // Docker volumes, WSL, and some synced folders.
      usePolling: true,
      interval: 100,
    },

    // Keep React Hot Module Replacement enabled.
    hmr: true,
  },
});
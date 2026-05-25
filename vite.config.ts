// ============================================================
// FIXED vite.config.ts
// FIX: Added server.proxy so frontend /api/* calls are forwarded
//      to the Express server (port 3000) during development.
//      Without this, Vite (port 5173) returns 404 for all /api routes.
// ============================================================

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      port: 5173,
      // FIX: Proxy /api/* to the Express backend running on port 3000.
      // Previously ALL API requests returned 404 in development because
      // the Vite dev server doesn't serve Express routes.
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});

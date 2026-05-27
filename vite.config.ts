import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({ registerType: 'autoUpdate', workbox: { maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 } })
    ],
    define: {
      __BUILD_TIME__: Date.now(),
      'process.env': {}
    },
    build: { outDir: 'dist', emptyOutDir: true,
      sourcemap: mode !== 'production',
      minify: 'terser',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        external: ['@google/genai'],
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      port: 5173,
      // Proxy /api/* to the Express backend running on port 3000.
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

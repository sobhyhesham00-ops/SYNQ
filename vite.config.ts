import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // envPrefix is implicitly VITE_ but can be customized if needed.
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
    build: {
      outDir: 'dist',
      sourcemap: true, // true for debugging source maps in production/dev
      minify: 'terser',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        external: ['@google/genai'], // Assuming genai is used purely server-side
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor'; // Splitting dependencies into vendor chunk
            }
          }
        }
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      // Proxy /api/* to the Express backend running on port 3000.
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          secure: false, // Useful if the backend has self-signed certs in dev
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});

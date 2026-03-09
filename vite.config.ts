import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/tangerpay": {
        target: "https://app.tangerpay.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tangerpay/, "/api"),
      },
      "/api/tfnsw": {
        target: "https://api.transport.nsw.gov.au/v1/tp",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tfnsw/, ""),
      },
      "/api/visitors": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: 'terser',
  },
}));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backend = process.env.VITE_PROXY_TARGET || "http://localhost:3001";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/process": backend,
      "/emails": backend,
      "/review": backend,
      "/logs": backend,
      "/stats": backend,
      "/health": backend,
      "/test-email": backend,
      "/approve": backend,
      "/reject": backend,
    },
  },
});

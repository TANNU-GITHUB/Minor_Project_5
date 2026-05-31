import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), tanstackStart(), tsconfigPaths(), react()],
  server: {
    middlewareMode: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("three")) return "three";
            if (id.includes("recharts")) return "recharts";
            if (id.includes("@radix-ui")) return "radix-ui";
            if (id.includes("framer-motion")) return "framer-motion";
            return "vendor";
          }
        },
        compact: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});

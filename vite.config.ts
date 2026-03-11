import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [tailwindcss(), react()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.JWT_SECRET": JSON.stringify(env.JWT_SECRET),
      "process.env.MONGODB_URI": JSON.stringify(env.MONGODB_URI),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      hmr: process.env.DISABLE_HMR !== "true",
      // ⚡ Add proxy so frontend can call backend API
      proxy: {
        "/api": "http://localhost:3000",
      },
    },
  };
});

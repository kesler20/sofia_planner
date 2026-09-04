import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves the app from /sofia_planner/, but Auth0 only allows
  // http://localhost:5173/ as a local callback, so dev is served from the root.
  base: command === "build" ? "/sofia_planner/" : "/",
  build: {
    outDir: 'build',
  },
}));

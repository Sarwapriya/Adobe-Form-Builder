/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: false,
    // Scoped to the frontend's own tests/ — without this, vitest's default include
    // glob also picks up packages/shared/tests (its own workspace, own vitest.config.ts,
    // run via `npm run test:shared`), double-running it under the wrong environment/config.
    exclude: ["**/node_modules/**", "packages/**"],
  },
});

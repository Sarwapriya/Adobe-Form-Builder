import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  outDir: "dist",
  // Declarations are emitted separately via `tsc -p tsconfig.build.json` (see the
  // "build" script) instead of tsup's bundled dts step — tsup's internal dts builder
  // (rollup-plugin-dts) hits a hard `TS5101: baseUrl is deprecated` error against this
  // repo's TypeScript version even with no baseUrl configured anywhere.
  dts: false,
  sourcemap: true,
  splitting: false,
  clean: true,
});

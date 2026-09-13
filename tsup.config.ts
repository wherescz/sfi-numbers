import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  dts: true,
  clean: !options.watch && !process.env.TSUP_NO_CLEAN,
  sourcemap: true,
  target: "es2020",
  external: ["react", "react-dom", "react/jsx-runtime"],
  banner: { js: '"use client";' },
  outExtension: ({ format }) => ({ js: format === "cjs" ? ".cjs" : ".js" }),
}));

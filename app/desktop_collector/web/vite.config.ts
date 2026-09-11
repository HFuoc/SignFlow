import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const webRoot = fileURLToPath(new URL(".", import.meta.url));
const oneUiAssets = fileURLToPath(
  new URL("../../frontend/desktop/assets/", import.meta.url),
);
const oneUiShared = fileURLToPath(
  new URL("../../frontend/shared/one-ui/", import.meta.url),
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@one-ui": oneUiAssets,
      "@one-ui-shared": oneUiShared,
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    fs: {
      allow: [webRoot, oneUiAssets, oneUiShared],
    },
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

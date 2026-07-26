import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    css: false,
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});

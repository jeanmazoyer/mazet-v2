import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const fileEnv = loadEnv("test", process.cwd(), "");

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Les tests de base pointent sur la base de test, jamais sur la base de démo.
    env: {
      DATABASE_URL: (process.env.TEST_DATABASE_URL ?? fileEnv.TEST_DATABASE_URL) ?? "postgres://mazet:mazet_dev@localhost:5432/mazet_test",
    },
    fileParallelism: false,
  },
});

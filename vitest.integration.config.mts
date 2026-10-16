import { defineConfig } from "vitest/config";

// Integration tests talk to the real database configured in .env, so they are kept
// out of the fast unit-test run. Run with: npm run test:integration
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.int.test.ts"],
    setupFiles: ["dotenv/config", "tests/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});

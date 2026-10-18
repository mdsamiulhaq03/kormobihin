import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma CLI configuration (migrate, generate, studio).
// Migrations use the DIRECT (non-pooled) Neon URL; the running app uses the pooled
// DATABASE_URL through the pg driver adapter (see src/lib/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});

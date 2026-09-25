import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./database/models/index.ts",
  out: "./database/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL || "my-finances.db",
  },
});

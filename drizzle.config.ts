import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/models",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL || "my-finances.db",
  },
});

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./database/schema.ts",
  out: "./database/drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./database/pillora_v2.db",
  },
  strict: true,
  verbose: true,
});

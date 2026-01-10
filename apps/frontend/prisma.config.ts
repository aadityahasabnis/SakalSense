import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load env from the frontend folder
const envPath = path.resolve(__dirname, ".env.local");
console.log("Loading env from:", envPath);

config({ path: envPath });

export default defineConfig({
  schema: path.join(__dirname, "prisma/schema.prisma"),
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});

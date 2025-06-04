import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

// Parse the connection string
const connectionString = new URL(process.env.DATABASE_URL);

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: connectionString.hostname,
    port: Number(connectionString.port) || 5432, // Default to 5432 if port is not specified
    user: connectionString.username,
    password: connectionString.password,
    database: connectionString.pathname.slice(1), // Remove leading '/'
    ssl: "require",
  },
} satisfies Config;

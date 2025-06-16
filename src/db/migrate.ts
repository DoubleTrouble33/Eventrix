#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

const runMigrate = async () => {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const connection = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(connection);

  await migrate(db, { migrationsFolder: "drizzle" });

  await connection.end();
};

runMigrate().catch((err) => {
  console.error("Migration failed!");
  console.error(err);
  process.exit(1);
});

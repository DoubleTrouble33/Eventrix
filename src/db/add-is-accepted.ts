import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

async function addIsAcceptedColumn() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

  try {
    console.log("Adding is_accepted column to event_guests table...");

    await sql.unsafe`
      ALTER TABLE event_guests 
      ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN NOT NULL DEFAULT FALSE;
    `;

    console.log("Column added successfully!");
  } catch (error) {
    console.error("Error adding column:", error);
  } finally {
    await sql.end();
  }
}

addIsAcceptedColumn().catch(console.error);

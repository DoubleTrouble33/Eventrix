import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

async function addIsAcceptedColumn() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

  try {
    // Add is_accepted column with default value true
    await sql`
      ALTER TABLE event_guests 
      ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT true
    `;
  } catch (error) {
    console.error("Error adding column:", error);
  } finally {
    await sql.end();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  addIsAcceptedColumn().catch(console.error);
}

import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

async function verifySchema() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

  try {
    // Check if event_guests table exists and has the right columns
    await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'event_guests'
      ORDER BY ordinal_position;
    `;
  } catch (error) {
    console.error("Error verifying schema:", error);
  } finally {
    await sql.end();
  }
}

// Run the verification if this file is executed directly
if (require.main === module) {
  verifySchema().catch(console.error);
}

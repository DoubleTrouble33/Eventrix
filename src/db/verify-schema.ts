import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

async function verifySchema() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

  try {
    console.log("Verifying event_guests table schema...");

    const result = await sql.unsafe`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'event_guests'
      ORDER BY ordinal_position;
    `;

    console.log("Table schema:");
    console.table(result);
  } catch (error) {
    console.error("Error verifying schema:", error);
  } finally {
    await sql.end();
  }
}

verifySchema().catch(console.error);

/**
 * Fix: drop the stale non-sparse tokenHash_1 index on votertokens
 * and recreate it as sparse so multiple null values are allowed.
 *
 * Run with:  npx tsx scripts/fix-votertoken-index.ts
 */
import mongoose from "mongoose";

process.loadEnvFile(".env");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  console.log("Connected.");

  const col = db.collection("votertokens");

  // Show existing indexes
  const before = await col.indexes();
  console.log("Indexes before:", before.map((i) => `${i.name} (sparse=${!!i.sparse})`).join(", "));

  // Drop the tokenHash_1 index if it exists (sparse or otherwise) so
  // syncIndexes can recreate it as a partial index ($type:"string")
  const tokenHashIndex = before.find((i) => i.name === "tokenHash_1");
  if (tokenHashIndex) {
    await col.dropIndex("tokenHash_1");
    console.log("Dropped old tokenHash_1 index (will be recreated as partial).");
  } else {
    console.log("tokenHash_1 index not found — will be created by syncIndexes.");
  }

  // Sync all indexes from the Mongoose schema (creates sparse tokenHash_1)
  const { VoterToken } = await import("../src/models");
  await VoterToken.syncIndexes();
  console.log("VoterToken indexes synced.");

  // Show final indexes
  const after = await col.indexes();
  console.log("Indexes after:", after.map((i) => `${i.name} (sparse=${!!i.sparse})`).join(", "));

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

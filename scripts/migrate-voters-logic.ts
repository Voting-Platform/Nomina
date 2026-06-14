/**
 * One-off migration for the Voters' Logic rework.
 *
 * - Elections: old voter-base fields → accessType "public" (no PIN);
 *   allowVoterVisibility → revealVoterIdentities; removes dropped fields.
 * - Votes: backfills voterKey = "user:<voterId>" for legacy votes.
 * - Drops the old unique (election, voter, candidate) index, which breaks
 *   on anonymous votes and prevented maxVotesPerCandidate > 1.
 *
 * Run with:  npx tsx scripts/migrate-voters-logic.ts
 */
import mongoose from "mongoose";

process.loadEnvFile(".env.local");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  console.log("Connected.");

  // ─── Elections ───
  const elections = db.collection("elections");
  const electionResult = await elections.updateMany(
    { accessType: { $exists: false } },
    [
      {
        $set: {
          accessType: "public",
          pinEnabled: false,
          pin: null,
          otpRequired: false,
          collectVoterDetails: false,
          revealVoterIdentities: { $ifNull: ["$allowVoterVisibility", false] },
          emailTemplate: { preset: "formal", subject: "", message: "" },
        },
      },
      {
        $unset: [
          "voterBaseMode",
          "allowedVoterEmails",
          "allowedVoterDomains",
          "allowVoterVisibility",
        ],
      },
    ]
  );
  console.log(`Elections migrated: ${electionResult.modifiedCount}`);

  // ─── Votes: backfill voterKey ───
  const votes = db.collection("votes");
  const legacyVotes = await votes
    .find({ voterKey: { $exists: false }, voter: { $ne: null } })
    .project({ _id: 1, voter: 1 })
    .toArray();

  if (legacyVotes.length > 0) {
    const ops = legacyVotes.map((v) => ({
      updateOne: {
        filter: { _id: v._id },
        update: {
          $set: {
            voterKey: `user:${v.voter.toString()}`,
            voterToken: null,
            voterDetails: { name: null, email: null },
          },
        },
      },
    }));
    const bulk = await votes.bulkWrite(ops);
    console.log(`Votes backfilled: ${bulk.modifiedCount}`);
  } else {
    console.log("Votes backfilled: 0");
  }

  // ─── Drop the old unique vote index ───
  const indexes = await votes.indexes();
  const oldIndex = indexes.find(
    (i) => i.name === "election_1_voter_1_candidate_1"
  );
  if (oldIndex) {
    await votes.dropIndex("election_1_voter_1_candidate_1");
    console.log("Dropped old unique vote index.");
  } else {
    console.log("Old unique vote index not present (already dropped).");
  }
  // Drop the superseded per-voter index too (replaced by voterKey index)
  const oldVoterIndex = indexes.find((i) => i.name === "election_1_voter_1");
  if (oldVoterIndex) {
    await votes.dropIndex("election_1_voter_1");
    console.log("Dropped old election/voter index.");
  }

  // ─── Sync new indexes from the live schemas ───
  // Import models AFTER connecting so syncIndexes targets this connection.
  const { Vote, VoterToken, Election } = await import("../src/models");
  await Vote.syncIndexes();
  await VoterToken.syncIndexes();
  await Election.syncIndexes();
  console.log("Indexes synced.");

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

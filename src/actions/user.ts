"use server";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/auth";
import { cache } from "react";

/**
 * Gets the current DB user, syncing them from NextAuth (Google OAuth 2.0) if they don't exist.
 * Wrapped in React cache() so it safely executes at most ONCE per server request cycle,
 * completely avoiding the "hitting the DB on every page load repeatedly" issue.
 */
export const getOrSyncDbUser = cache(async () => {
  try {
    const session = await auth();
    console.log("[getOrSyncDbUser] Raw session parsed:", JSON.stringify(session, null, 2));

    if (!session?.user) {
      console.log("[getOrSyncDbUser] No active session found. Returning null.");
      return null;
    }

    await connectDB();

    // Map Google account ID (sub) or email as the unique identifier
    const userId = session.user.id || session.user.email;
    if (!userId) {
      console.log("[getOrSyncDbUser] Active session has no user ID or email. Returning null.");
      return null;
    }

    console.log("[getOrSyncDbUser] Querying database for user with ID:", userId);

    // FIND: 99% of the time they just exist, use .lean() for speed
    let user = await User.findOne({ auth0Id: userId }).lean();

    // SYNC: Only if they are missing or need profile updates
    if (!user) {
      console.log("[getOrSyncDbUser] User not found in DB. Creating new Google OAuth user entry...");
      try {
        const newUser = await User.create({
          auth0Id: userId,
          name: session.user.name || "Google User",
          email: session.user.email,
          picture: session.user.image,
          role: "user",
        });
        user = newUser.toObject(); // Make it plain JS like .lean()
        console.log("[getOrSyncDbUser] Successfully created and synced new user:", user);
      } catch (err: unknown) {
        // [FIX]: Race condition on signup. If two requests interleave, the second gets a 11000 Duplicate Key error.
        if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
          console.log("[getOrSyncDbUser] Duplicate key race condition caught. Refetching existing user...");
          user = await User.findOne({ auth0Id: userId }).lean();
        } else {
          console.error("[getOrSyncDbUser] Failed to create user entry:", err);
          throw err;
        }
      }
    } else {
      console.log("[getOrSyncDbUser] Found existing user in DB:", user);
      
      // [FIX]: Stale Profile Data. Check if the Mongo document is older than 24 hours.
      const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours in ms
      const isStale = !user.updatedAt || (Date.now() - new Date(user.updatedAt).getTime() > STALE_THRESHOLD);

      if (isStale) {
        console.log("[getOrSyncDbUser] User profile is stale (older than 24 hours). Triggering background update...");
        // Fix 3: Fire and forget the DB update to prevent blocking page load
        User.updateOne(
          { auth0Id: userId },
          { 
            name: session.user.name || user.name, 
            email: session.user.email || user.email, 
            picture: session.user.image || user.picture 
          }
        ).catch(err => console.error('[getOrSyncDbUser] Stale sync background update failed:', err));

        // Fix 1: Mutate the local in-memory object so the current page render 
        // doesn't show the old stale data while the DB updates in the background.
        user.name = session.user.name || user.name;
        user.email = session.user.email || user.email;
        user.picture = session.user.image || user.picture;
      }
    }

    // Always ensure _id is nicely stringified to avoid NextJS serialization warnings
    if (user && user._id) {
      user._id = user._id.toString();
    }

    return user;
  } catch (error) {
    // Fix 2: Properly log the error so we aren't swallowing crashes in production
    console.error('[getOrSyncDbUser] Critical database failure:', error);
    return null; // Return null so the page still loads even if DB is temporarily unreachable
  }
});

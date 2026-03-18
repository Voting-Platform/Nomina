"use server";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { auth0 } from "@/lib/auth0";
import { cache } from "react";

/**
 * Gets the current DB user, syncing them from Auth0 if they don't exist.
 * Wrapped in React cache() so it safely executes at most ONCE per server request cycle,
 * completely avoiding the "hitting the DB on every page load repeatedly" issue.
 */
export const getOrSyncDbUser = cache(async () => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return null;

    await connectDB();

    // FIND: 99% of the time they just exist, use .lean() for speed
    let user = await User.findOne({ auth0Id: session.user.sub }).lean();

    // SYNC: Only if they are missing or need profile updates
    if (!user) {
      console.log("New Auth0 user detected! Syncing to database...");
      try {
        const newUser = await User.create({
          auth0Id: session.user.sub,
          name: session.user.name,
          email: session.user.email,
          picture: session.user.picture,
          role: "user",
        });
        user = newUser.toObject(); // Make it plain JS like .lean()
      } catch (err: any) {
        // [FIX]: Race condition on signup. If two requests interleave, the second gets a 11000 Duplicate Key error.
        if (err.code === 11000) {
          user = await User.findOne({ auth0Id: session.user.sub }).lean();
        } else {
          throw err;
        }
      }
    } else {
      // [FIX]: Stale Profile Data. Check if the Mongo document is older than 24 hours.
      const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours in ms
      const isStale = !user.updatedAt || (Date.now() - new Date(user.updatedAt).getTime() > STALE_THRESHOLD);

      if (isStale) {
        // Fix 3: Fire and forget the DB update to prevent blocking page load
        User.updateOne(
          { auth0Id: session.user.sub },
          { 
            name: session.user.name, 
            email: session.user.email, 
            picture: session.user.picture 
          }
        ).catch(err => console.error('[getOrSyncDbUser] Stale sync background update failed:', err));

        // Fix 1: Mutate the local in-memory object so the current page render 
        // doesn't show the old stale data while the DB updates in the background.
        user.name = session.user.name;
        user.email = session.user.email;
        user.picture = session.user.picture;
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

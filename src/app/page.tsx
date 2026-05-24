

import { getOrSyncDbUser } from "@/actions/user";
import { Navbar } from "@/components/organisms/navbar";
import { ImageUploadForm } from "@/components/molecules";

export const dynamic = "force-dynamic";

export default async function Home() {
  let dbUser = null;
  
  // The cached DB function handles session retrieval and user sync,
  // deduplicating across all Server Components, Layouts, and Server Actions.
  dbUser = await getOrSyncDbUser();
  
  // Create a local session variable derived from the database user payload so the UI logic works
  const session = dbUser ? { user: { email: dbUser.email } } : null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="mx-auto max-w-4xl p-8">
        <h1 className="text-4xl font-bold text-center">Welcome to the Voting Platform</h1>
        <p className="text-center text-gray-600 mt-4">
          Unleash the power of decentralized decision-making with our cutting-edge voting platform. 
          Experience secure, transparent, and efficient voting like never before. 
          Join us in shaping the future of democracy today!
        </p>

      </div>
    </div>
  );
}

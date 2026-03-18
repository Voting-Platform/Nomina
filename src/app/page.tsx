

import { auth0 } from "@/lib/auth0";
import { getOrSyncDbUser } from "@/actions/user";

export default async function Home() {
  let dbUser = null;
  
  // We DO NOT call auth0.getSession() here anymore!
  // We just let the cached DB function handle everything natively so it deduplicates perfectly
  // across all Server Components, Layouts, and Server Actions without arguments messing up the React Cache key.
  dbUser = await getOrSyncDbUser();
  
  // Create a local session variable derived from the database user payload so the UI logic works
  const session = dbUser ? { user: { email: dbUser.email } } : null;

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center">Welcome to the Voting Platform</h1>
        <p className="text-center text-gray-600 mt-4">
          Unleash the power of decentralized decision-making with our cutting-edge voting platform. 
          Experience secure, transparent, and efficient voting like never before. 
          Join us in shaping the future of democracy today!
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          {!session ? (
            <div className="flex gap-4">
              <a 
                href="/auth/login?connection=google-oauth2" 
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </a>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-sm border w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Database Profile</h2>
                <a 
                  href="/auth/logout" 
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
                >
                  Log Out
                </a>
              </div>
              <p className="mb-4">Internal Mongo ID: <strong>{dbUser?._id.toString()}</strong></p>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(dbUser, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

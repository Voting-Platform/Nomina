import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client();
console.log("[auth0] Initialized Auth0Client instance", auth0);

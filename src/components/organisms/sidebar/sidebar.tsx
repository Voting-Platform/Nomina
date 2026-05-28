import { auth } from "@/auth";
import { AppShell } from "./app-shell";

export async function Sidebar({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user ?? null;

  return <AppShell user={user}>{children}</AppShell>;
}

export default Sidebar;

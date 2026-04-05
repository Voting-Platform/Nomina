import { Navbar } from "@/components/organisms/navbar";

export default function ElectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      {children}
    </div>
  );
}

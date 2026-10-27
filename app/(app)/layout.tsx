import { requireUser } from "@/lib/auth";
import { BottomNav, TopNav } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <TopNav name={user.name} />
      <main className="mx-auto max-w-5xl overflow-x-clip px-4 pt-4 pb-28 md:pb-10">{children}</main>
      <BottomNav />
    </>
  );
}

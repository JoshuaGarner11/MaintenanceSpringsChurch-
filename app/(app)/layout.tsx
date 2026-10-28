import { requireUser } from "@/lib/auth";
import { BottomNav, SideNav, TopNav } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <TopNav />
      <SideNav name={user.name} role={user.role} />
      <main className="mx-auto max-w-3xl overflow-x-clip px-4 pt-5 pb-32 md:ml-60 md:max-w-none md:px-10 md:pt-10 md:pb-16 print:m-0 print:p-0">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
      <BottomNav />
    </>
  );
}

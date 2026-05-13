import { Sidebar } from "@/components/dashboard/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="rzg-root flex min-h-screen w-full overflow-x-hidden">
      <Sidebar />
      <main className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="rzg-grid-fine pointer-events-none absolute inset-0 opacity-35" />
        <div className="relative min-h-screen min-w-0 max-w-full">{children}</div>
      </main>
    </div>
  );
}

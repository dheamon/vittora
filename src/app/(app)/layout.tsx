import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/session";
import { ClientModalProvider } from "@/components/ClientModalProvider";
import AppShell from "@/components/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <ClientModalProvider>
      {/* AppShell uses useSearchParams, so wrap in Suspense per Next.js. */}
      <Suspense fallback={null}>
        <AppShell user={user}>{children}</AppShell>
      </Suspense>
    </ClientModalProvider>
  );
}

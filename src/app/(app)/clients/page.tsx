import { Suspense } from "react";
import ClientsView from "@/components/ClientsView";

export const dynamic = "force-dynamic";

export default function ClientsPage() {
  return (
    <Suspense fallback={null}>
      <ClientsView />
    </Suspense>
  );
}

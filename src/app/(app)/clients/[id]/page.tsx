import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeClient } from "@/lib/serialize";
import ClientDetail from "@/components/ClientDetail";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) notFound();
  return <ClientDetail client={serializeClient(client)} />;
}

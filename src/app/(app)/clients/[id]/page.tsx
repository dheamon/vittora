import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { serializeClient } from "@/lib/serialize";
import ClientDetail from "@/components/ClientDetail";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "Admin";
  const client = await prisma.client.findFirst({
    where: isAdmin
      ? { id: params.id }
      : {
          id: params.id,
          OR: [
            { createdById: user.id },
            { assignedUsers: { some: { userId: user.id } } },
          ],
        },
    include: { createdBy: true, assignedUsers: true },
  });
  if (!client) notFound();

  return <ClientDetail client={serializeClient(client)} currentUser={user} />;
}

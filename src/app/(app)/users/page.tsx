import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import UsersView from "@/components/UsersView";

export default async function UsersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "Admin") redirect("/dashboard");
  return <UsersView />;
}

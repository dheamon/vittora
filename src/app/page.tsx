import { redirect } from "next/navigation";

// The root simply routes to the dashboard; middleware redirects to /login
// when there is no valid session.
export default function Home() {
  redirect("/dashboard");
}

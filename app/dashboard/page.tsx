import { Dashboard } from "@/components/forma/dashboard";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
export const metadata = {
  title: "Your workspace",
  robots: { index: false, follow: false },
};
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const demo = (await searchParams).demo === "1";
  if (demo) return <Dashboard demo name="Local workspace" />;
  const session = await getSession();
  if (!session) redirect("/login");
  return <Dashboard demo={false} name={session.user.name} />;
}

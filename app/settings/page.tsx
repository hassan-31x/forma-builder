import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/forma/settings";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};
export default async function Settings() {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <AccountSettings name={session.user.name} email={session.user.email} />
  );
}

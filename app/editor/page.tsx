import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Builder } from "@/components/forma/builder";
export const metadata = {
  title: "Website studio",
  robots: { index: false, follow: false },
};
export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; demo?: string }>;
}) {
  const p = await searchParams;
  if (!p.project) redirect(`/dashboard${p.demo === "1" ? "?demo=1" : ""}`);
  const demo = p.demo === "1";
  if (!demo && !(await getSession())) redirect("/login");
  return <Builder projectId={p.project} demo={demo} />;
}

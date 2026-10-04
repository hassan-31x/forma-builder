import { notFound } from "next/navigation";
import { database } from "@/lib/db";
import { siteSchema } from "@/lib/site";
import { SiteRenderer } from "@/components/forma/site-renderer";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
async function published(slug: string) {
  if (!process.env.MONGODB_URI || !/^[a-f0-9]{32}$/.test(slug)) return null;
  return (await database())
    .collection("published_sites")
    .findOne(
      { slug },
      { projection: { _id: 0, name: 1, description: 1, elements: 1 } },
    );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const site = await published((await params).slug);
  return {
    title: site?.name || "Site not found",
    description: site?.description || "Created with Forma",
    robots: { index: false, follow: false },
  };
}
export default async function PublishedSite({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const site = await published((await params).slug);
  if (!site) notFound();
  const parsed = siteSchema.safeParse(site.elements);
  if (!parsed.success) notFound();
  return (
    <main id="main" className="published-site">
      <SiteRenderer nodes={parsed.data} />
    </main>
  );
}

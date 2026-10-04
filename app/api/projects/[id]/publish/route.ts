import { authenticated, apiError, ApiError } from "@/lib/api";
import { database, mongoClient } from "@/lib/db";
import { siteSchema } from "@/lib/site";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  try {
    const user_id = await authenticated(request);
    const { id } = await context.params;
    const db = await database();
    const session = (await mongoClient()).startSession();
    const slug = id.replace(/-/g, "");
    try {
      await session.withTransaction(async () => {
        const p = await db
          .collection("projects")
          .findOneAndUpdate(
            { id, user_id },
            { $set: { updated_at: new Date().toISOString() } },
            { session, returnDocument: "after" },
          );
        if (!p) throw new ApiError("Project not found.", 404);
        const elements = siteSchema.parse(p.elements);
        await db.collection("published_sites").updateOne(
          { project_id: id, user_id },
          {
            $set: {
              slug,
              name: p.name,
              description: p.description,
              elements,
              published_at: new Date().toISOString(),
            },
          },
          { upsert: true, session },
        );
      });
    } finally {
      await session.endSession();
    }
    return Response.json({ slug });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const user_id = await authenticated(request);
    const { id } = await context.params;
    await (
      await database()
    )
      .collection("published_sites")
      .deleteOne({ project_id: id, user_id });
    return Response.json({ unpublished: true });
  } catch (e) {
    return apiError(e);
  }
}

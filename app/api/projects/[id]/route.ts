import { z } from "zod";
import { authenticated, apiError, ApiError, jsonBody } from "@/lib/api";
import { database, mongoClient } from "@/lib/db";
import { siteSchema } from "@/lib/site";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const user_id = await authenticated();
    const { id } = await context.params;
    const p = await (
      await database()
    )
      .collection("projects")
      .findOne({ id, user_id }, { projection: { _id: 0 } });
    if (!p) throw new ApiError("Project not found.", 404);
    return Response.json(p, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return apiError(e);
  }
}
const schema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(300),
  elements: siteSchema,
});
export async function PUT(request: Request, context: Context) {
  try {
    const user_id = await authenticated(request);
    const { id } = await context.params;
    const parsed = schema.safeParse(await jsonBody(request));
    if (!parsed.success)
      throw new ApiError("This page contains invalid elements or styles.", 400);
    const result = await (
      await database()
    )
      .collection("projects")
      .updateOne(
        { id, user_id },
        { $set: { ...parsed.data, updated_at: new Date().toISOString() } },
      );
    if (!result.matchedCount) throw new ApiError("Project not found.", 404);
    return Response.json({ saved: true });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const user_id = await authenticated(request);
    const { id } = await context.params;
    const db = await database();
    const session = (await mongoClient()).startSession();
    try {
      await session.withTransaction(async () => {
        const result = await db
          .collection("projects")
          .deleteOne({ id, user_id }, { session });
        if (!result.deletedCount) throw new ApiError("Project not found.", 404);
        await db
          .collection("published_sites")
          .deleteOne({ project_id: id, user_id }, { session });
      });
    } finally {
      await session.endSession();
    }
    return Response.json({ deleted: true });
  } catch (e) {
    return apiError(e);
  }
}

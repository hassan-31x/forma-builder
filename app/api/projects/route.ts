import { z } from "zod";
import { authenticated, apiError, ApiError, jsonBody } from "@/lib/api";
import { database, ensureIndexes } from "@/lib/db";
import { template, uid } from "@/lib/site";
export async function GET() {
  try {
    const user_id = await authenticated();
    const projects = await (
      await database()
    )
      .collection("projects")
      .find({ user_id }, { projection: { _id: 0 } })
      .sort({ updated_at: -1 })
      .limit(100)
      .toArray();
    return Response.json(projects, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return apiError(e);
  }
}
const input = z.object({
  name: z.string().trim().min(1).max(100),
  kind: z.enum(["studio", "portfolio", "blank"]),
});
export async function POST(request: Request) {
  try {
    const user_id = await authenticated(request);
    const parsed = input.safeParse(await jsonBody(request));
    if (!parsed.success)
      throw new ApiError(
        "Choose a template and a name up to 100 characters.",
        400,
      );
    await ensureIndexes();
    const db = await database();
    if ((await db.collection("projects").countDocuments({ user_id })) >= 100)
      throw new ApiError("Your workspace supports up to 100 projects.", 400);
    const project = {
      id: uid(),
      user_id,
      name: parsed.data.name,
      description: "",
      elements: template(parsed.data.kind),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await db.collection("projects").insertOne({ ...project });
    return Response.json(project, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

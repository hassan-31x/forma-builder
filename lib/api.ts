import "server-only";
import { getSession } from "./auth";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function authenticated(request?: Request) {
  if (request && request.method !== "GET") {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin)
      throw new ApiError("Request origin is not allowed.", 403);
  }
  const session = await getSession();
  if (!session) throw new ApiError("Please sign in to continue.", 401);
  return session.user.id;
}
export function apiError(error: unknown) {
  if (error instanceof ApiError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error(
    "Forma API error:",
    error instanceof Error ? error.name : "UnknownError",
  );
  return Response.json(
    { error: "We could not complete this request. Please try again." },
    { status: 500 },
  );
}
export async function jsonBody(request: Request) {
  const raw = await request.text();
  if (raw.length > 200000) throw new ApiError("Page is too large.", 413);
  try {
    return JSON.parse(raw);
  } catch {
    throw new ApiError("Invalid request.", 400);
  }
}

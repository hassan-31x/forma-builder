import { getAuth } from "@/lib/auth";
export const runtime = "nodejs";
async function handler(request: Request) {
  try {
    return (await getAuth()).handler(request);
  } catch {
    return Response.json(
      {
        message:
          "Accounts are temporarily unavailable. Please try again later or explore the local demo.",
      },
      { status: 503 },
    );
  }
}
export { handler as GET, handler as POST };

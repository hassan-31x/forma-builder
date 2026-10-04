import "server-only";
import { database, ensureIndexes } from "./db";
export async function consumeCredit(user_id: string) {
  await ensureIndexes();
  const collection = (await database()).collection("ai_usage");
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  try {
    await collection.updateOne(
      { user_id, day },
      {
        $setOnInsert: {
          requests: 0,
          last_request: new Date(0),
          expires_at: new Date(now.getTime() + 3 * 86400000),
        },
      },
      { upsert: true },
    );
  } catch (e) {
    if ((e as { code?: number }).code !== 11000) throw e;
  }
  const result = await collection.findOneAndUpdate(
    {
      user_id,
      day,
      requests: { $lt: 10 },
      last_request: { $lte: new Date(now.getTime() - 10000) },
    },
    { $inc: { requests: 1 }, $set: { last_request: now } },
    { returnDocument: "after" },
  );
  return result ? 10 - Number(result.requests) : null;
}

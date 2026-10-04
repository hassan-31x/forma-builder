import "server-only";
import { MongoClient } from "mongodb";
declare global {
  var formaMongo: Promise<MongoClient> | undefined;
  var formaIndexes: Promise<void> | undefined;
}
export async function mongoClient() {
  if (!process.env.MONGODB_URI) throw new Error("MongoDB is not configured.");
  if (!global.formaMongo)
    global.formaMongo = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    })
      .connect()
      .catch((e) => {
        global.formaMongo = undefined;
        throw e;
      });
  return global.formaMongo;
}
export async function database() {
  return (await mongoClient()).db(process.env.MONGODB_DB || "forma");
}
export async function ensureIndexes() {
  if (!global.formaIndexes)
    global.formaIndexes = (async () => {
      const db = await database();
      await Promise.all([
        db.collection("projects").createIndex({ user_id: 1, updated_at: -1 }),
        db.collection("projects").createIndex({ id: 1 }, { unique: true }),
        db
          .collection("published_sites")
          .createIndex({ slug: 1 }, { unique: true }),
        db
          .collection("published_sites")
          .createIndex({ project_id: 1 }, { unique: true }),
        db
          .collection("ai_usage")
          .createIndex({ user_id: 1, day: 1 }, { unique: true }),
        db
          .collection("ai_usage")
          .createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }),
        db.collection("user").createIndex({ email: 1 }, { unique: true }),
        db.collection("session").createIndex({ token: 1 }, { unique: true }),
        db.collection("session").createIndex({ userId: 1 }),
        db.collection("account").createIndex({ userId: 1 }),
        db.collection("verification").createIndex({ identifier: 1 }),
      ]);
    })().catch((e) => {
      global.formaIndexes = undefined;
      throw e;
    });
  return global.formaIndexes;
}

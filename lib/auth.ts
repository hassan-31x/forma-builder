import "server-only";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { after } from "next/server";
import { database, ensureIndexes, mongoClient } from "./db";
export const authConfigured = () =>
  Boolean(
    process.env.MONGODB_URI &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.NEXT_PUBLIC_APP_URL,
  );
const emailConfigured = () =>
  Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.EMAIL_FROM,
  );
async function sendEmail(to: string, subject: string, url: string) {
  if (!emailConfigured()) throw new Error("Email delivery is not configured.");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text: `${subject}\n\n${url}\n\nIf you didn't request this email, you can ignore it.`,
  });
}
let cached: ReturnType<typeof betterAuth> | undefined;
export async function getAuth() {
  if (!authConfigured())
    throw new Error("Cloud accounts are not configured. Try the local demo.");
  if (process.env.NODE_ENV === "production" && !emailConfigured())
    throw new Error("Production email delivery is not configured.");
  if (process.env.BETTER_AUTH_SECRET!.length < 32)
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters.");
  await ensureIndexes();
  if (!cached)
    cached = betterAuth<BetterAuthOptions>({
      appName: "Forma",
      baseURL: process.env.NEXT_PUBLIC_APP_URL,
      secret: process.env.BETTER_AUTH_SECRET,
      database: mongodbAdapter(await database(), {
        client: await mongoClient(),
      }),
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 10,
        requireEmailVerification: emailConfigured(),
        revokeSessionsOnPasswordReset: true,
        sendResetPassword: async ({ user, url }) => {
          after(() => sendEmail(user.email, "Reset your Forma password", url));
        },
      },
      emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
          if (emailConfigured())
            after(() => sendEmail(user.email, "Verify your Forma email", url));
        },
      },
      user: {
        deleteUser: {
          enabled: true,
          beforeDelete: async (user) => {
            const db = await database();
            const session = (await mongoClient()).startSession();
            try {
              await session.withTransaction(async () => {
                await db
                  .collection("published_sites")
                  .deleteMany({ user_id: user.id }, { session });
                await db
                  .collection("projects")
                  .deleteMany({ user_id: user.id }, { session });
                await db
                  .collection("ai_usage")
                  .deleteMany({ user_id: user.id }, { session });
              });
            } finally {
              await session.endSession();
            }
          },
        },
      },
      session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
      rateLimit: {
        enabled: true,
        storage: "database",
        window: 60,
        max: 30,
        customRules: {
          "/sign-up/email": { window: 60, max: 5 },
          "/sign-in/email": { window: 60, max: 10 },
          "/request-password-reset": { window: 60, max: 3 },
        },
      },
      advanced: {
        ipAddress: {
          ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"],
        },
      },
    });
  return cached!;
}
export async function getSession() {
  if (!authConfigured()) return null;
  return (await getAuth()).api.getSession({ headers: await headers() });
}

import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
const repl = await MongoMemoryReplSet.create({
  replSet: { count: 1 },
  binary: { version: "8.2.3" },
});
const base = "http://localhost:3100";
process.env.MONGODB_URI = repl.getUri();
process.env.MONGODB_DB = "forma-smoke";
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--port", "3100"],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_URL: base,
      BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
      FORMA_TEST_DIST: ".next-smoke",
      SMTP_HOST: "",
      SMTP_USER: "",
      SMTP_PASSWORD: "",
      NODE_OPTIONS: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
child.stdout.on("data", (d) => {
  logs += d;
});
child.stderr.on("data", (d) => {
  logs += d;
});
async function request(
  path: string,
  method = "GET",
  body?: unknown,
  cookie = "",
  origin = base,
) {
  return fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      Cookie: cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
}
try {
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {
      /* Wait until the development server is ready. */
    }
    if (child.exitCode !== null) throw new Error(logs);
    await delay(1000);
  }
  assert.equal((await request("/api/projects")).status, 401);
  async function signup(email: string, name: string) {
    const res = await request("/api/auth/sign-up/email", "POST", {
      email,
      name,
      password: "a-strong-test-password-42",
    });
    assert.equal(res.status, 200, await res.clone().text());
    const cookie = res.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    assert.ok(cookie);
    return cookie;
  }
  const alice = await signup("alice@example.com", "Alice");
  const bob = await signup("bob@example.com", "Bob");
  const created = await request(
    "/api/projects",
    "POST",
    { name: "Production smoke test", kind: "studio" },
    alice,
  );
  assert.equal(created.status, 201);
  const p = await created.json();
  assert.equal(
    (await request(`/api/projects/${p.id}`, "GET", undefined, bob)).status,
    404,
  );
  assert.equal(
    (await request(`/api/projects/${p.id}`, "PUT", p, bob)).status,
    404,
  );
  assert.equal(
    (await request(`/api/projects/${p.id}/publish`, "POST", undefined, bob))
      .status,
    404,
  );
  assert.equal(
    (await request(`/api/projects/${p.id}`, "DELETE", undefined, bob)).status,
    404,
  );
  assert.equal(
    (
      await request(
        `/api/projects/${p.id}`,
        "PUT",
        p,
        alice,
        "https://evil.example",
      )
    ).status,
    403,
  );
  const bad = structuredClone(p);
  bad.elements[0].styles.backgroundColor = "red;position:fixed";
  assert.equal(
    (await request(`/api/projects/${p.id}`, "PUT", bad, alice)).status,
    400,
  );
  p.name = "Renamed site";
  assert.equal(
    (await request(`/api/projects/${p.id}`, "PUT", p, alice)).status,
    200,
  );
  const pub = await request(
    `/api/projects/${p.id}/publish`,
    "POST",
    undefined,
    alice,
  );
  assert.equal(pub.status, 200, await pub.clone().text());
  const { slug } = await pub.json();
  let html = await (await request(`/sites/${slug}`)).text();
  assert.match(html, /Renamed site/);
  p.name = "Private edit";
  await request(`/api/projects/${p.id}`, "PUT", p, alice);
  html = await (await request(`/sites/${slug}`)).text();
  assert.match(html, /Renamed site/);
  assert.doesNotMatch(html, /<title>Private edit/);
  const { consumeCredit } = await import("../lib/quota");
  const { database } = await import("../lib/db");
  const results = await Promise.all(
    Array.from({ length: 20 }, () => consumeCredit("quota-user")),
  );
  assert.equal(results.filter((v) => v !== null).length, 1);
  const db = await database();
  await db
    .collection("ai_usage")
    .updateOne(
      { user_id: "quota-user" },
      { $set: { requests: 9, last_request: new Date(0) } },
    );
  assert.equal(await consumeCredit("quota-user"), 0);
  await db
    .collection("ai_usage")
    .updateOne(
      { user_id: "quota-user" },
      { $set: { last_request: new Date(0) } },
    );
  assert.equal(await consumeCredit("quota-user"), null);
  await request(`/api/projects/${p.id}/publish`, "DELETE", undefined, alice);
  assert.equal((await request(`/sites/${slug}`)).status, 404);
  await request(`/api/projects/${p.id}/publish`, "POST", undefined, alice);
  assert.equal(
    (await request(`/api/projects/${p.id}`, "DELETE", undefined, alice)).status,
    200,
  );
  assert.equal((await request(`/sites/${slug}`)).status, 404);
  assert.equal(
    (await request("/api/projects", "GET", undefined, alice)).status,
    200,
  );
  let carol = await signup("carol@example.com", "Carol");
  const cp = await (
    await request(
      "/api/projects",
      "POST",
      { name: "Delete with account", kind: "blank" },
      carol,
    )
  ).json();
  await request(`/api/projects/${cp.id}/publish`, "POST", undefined, carol);
  const change = await request(
    "/api/auth/change-password",
    "POST",
    {
      currentPassword: "a-strong-test-password-42",
      newPassword: "new-test-password-49",
      revokeOtherSessions: true,
    },
    carol,
  );
  assert.equal(change.status, 200, await change.clone().text());
  const newCookies = change.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  assert.equal(
    (await request("/api/projects", "GET", undefined, carol)).status,
    401,
  );
  if (newCookies) carol = newCookies;
  const removed = await request(
    "/api/auth/delete-user",
    "POST",
    { password: "new-test-password-49" },
    carol,
  );
  assert.equal(removed.status, 200, await removed.clone().text());
  assert.equal(
    await db.collection("projects").countDocuments({ id: cp.id }),
    0,
  );
  assert.equal(
    await db
      .collection("published_sites")
      .countDocuments({ project_id: cp.id }),
    0,
  );
  assert.equal(
    (await request("/api/projects", "GET", undefined, carol)).status,
    401,
  );
  console.log(
    "Smoke passed: signup, sessions, ownership isolation, CSRF, validation, save, private drafts, publish, unpublish, delete, concurrent quotas, password change and account deletion.",
  );
} catch (e) {
  console.error(logs.slice(-6000));
  throw e;
} finally {
  child.kill("SIGTERM");
  await delay(1000);
  const { mongoClient } = await import("../lib/db");
  await (await mongoClient()).close();
  await repl.stop();
}

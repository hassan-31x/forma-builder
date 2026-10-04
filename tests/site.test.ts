import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createNode,
  exportHtml,
  findNode,
  mapNodes,
  safeUrl,
  siteSchema,
  template,
  videoUrl,
  type SiteNode,
} from "../lib/site";
test("templates validate and exports contain no editor controls", () => {
  for (const kind of ["studio", "portfolio", "blank"] as const) {
    const page = template(kind);
    assert.equal(siteSchema.safeParse(page).success, true);
    const html = exportHtml(page, "My site");
    assert.match(html, /<!doctype html>/);
    assert.doesNotMatch(html, /contenteditable|node-tag|canvas-node/);
  }
});
test("URL policy rejects script, protocol relative, whitespace and data URLs", () => {
  for (const s of [
    "javascript:alert(1)",
    "//evil.example",
    "data:text/html,<script>",
    "https://a.com/\nattack",
    "\\evil",
    "https://a.com/'onload",
  ]) {
    assert.equal(safeUrl(s), "");
  }
  for (const s of [
    "https://example.com/path",
    "mailto:hello@example.com",
    "/about",
    "#contact",
  ]) {
    assert.equal(safeUrl(s), s);
  }
  assert.equal(videoUrl("https://evil.example/embed/a"), "");
  assert.equal(
    videoUrl("https://www.youtube.com/embed/abc"),
    "https://www.youtube.com/embed/abc",
  );
});
test("HTML export escapes user text, title, attributes and preserves link content", () => {
  const p = template("blank");
  const n = createNode("link");
  n.content = {
    innerText: '<script>alert("x")</script>',
    href: "https://example.com",
  };
  p[0].content = [n];
  const html = exportHtml(p, '<img src=x onerror="alert(1)">');
  assert.doesNotMatch(html, /<script>|<title><img/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /href="https:\/\/example.com"/);
});
test("unsafe CSS and malformed tree shapes are rejected", () => {
  const p = template("blank");
  p[0].styles.backgroundColor = "red;position:fixed";
  assert.equal(siteSchema.safeParse(p).success, false);
  p[0].styles = { backgroundImage: "url(https://evil.example)" };
  assert.equal(siteSchema.safeParse(p).success, false);
  p[0].styles = {};
  p[0].content = { innerText: "wrong" };
  assert.equal(siteSchema.safeParse(p).success, false);
});
test("duplicate IDs and too-deep trees are rejected", () => {
  const p = template("blank");
  const a = createNode("text");
  p[0].content = [a, { ...a }];
  assert.equal(siteSchema.safeParse(p).success, false);
  let inner: SiteNode = createNode("text");
  for (let i = 0; i < 10; i++)
    inner = { ...createNode("container"), content: [inner] };
  p[0].content = [inner];
  assert.equal(siteSchema.safeParse(p).success, false);
});
test("nested edits preserve unrelated elements and earlier snapshots", () => {
  const p = template("studio");
  const before = JSON.stringify(p);
  const hero = (p[0].content as SiteNode[])[1];
  const heading = (hero.content as SiteNode[])[1];
  const edited = mapNodes(p, heading.id, (n) => ({
    ...n,
    content: { innerText: "New heading" },
  }));
  assert.equal(JSON.stringify(p), before);
  assert.deepEqual(findNode(edited, heading.id)?.content, {
    innerText: "New heading",
  });
  assert.deepEqual(
    (edited[0].content as SiteNode[])[0],
    (p[0].content as SiteNode[])[0],
  );
  const deleted = mapNodes(edited, hero.id, () => null);
  assert.equal(findNode(deleted, heading.id), undefined);
  assert.equal(siteSchema.safeParse(deleted).success, true);
});

test("very deep input is rejected before recursive parsing",()=>{let inner:unknown={id:"leaf"};for(let i=0;i<10000;i++)inner={content:[inner]};assert.equal(siteSchema.safeParse([inner]).success,false);});

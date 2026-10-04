import { z } from "zod";
import type { CSSProperties } from "react";

export const styleKeys = [
  "color",
  "backgroundColor",
  "fontSize",
  "fontWeight",
  "fontFamily",
  "textAlign",
  "lineHeight",
  "letterSpacing",
  "padding",
  "margin",
  "gap",
  "width",
  "maxWidth",
  "minHeight",
  "borderRadius",
  "border",
  "display",
  "flexDirection",
  "justifyContent",
  "alignItems",
  "opacity",
] as const;
const safeValue = z.union([
  z
    .string()
    .max(120)
    .refine(
      (v) => !/[<>;{}\\]|url\s*\(|expression\s*\(|@import/i.test(v),
      "Unsafe style",
    ),
  z.number().finite(),
]);
export const stylesSchema = z
  .object(Object.fromEntries(styleKeys.map((k) => [k, safeValue.optional()])))
  .strict();
export const contentSchema = z
  .object({
    innerText: z.string().max(10000).optional(),
    href: z.string().max(2000).optional(),
    src: z.string().max(2000).optional(),
    alt: z.string().max(300).optional(),
  })
  .strict();
export type SiteNode = {
  id: string;
  name: string;
  type: "__body" | "container" | "2Col" | "text" | "link" | "image" | "video";
  styles: CSSProperties;
  content: SiteNode[] | z.infer<typeof contentSchema>;
};
const nodeSchema: z.ZodType<SiteNode> = z.lazy(
  () =>
    z.object({
      id: z.string().min(1).max(100),
      name: z.string().min(1).max(100),
      type: z.enum([
        "__body",
        "container",
        "2Col",
        "text",
        "link",
        "image",
        "video",
      ]),
      styles: stylesSchema,
      content: z.union([z.array(nodeSchema).max(80), contentSchema]),
    }) as z.ZodType<SiteNode>,
);
const parsedSiteSchema = z
  .array(nodeSchema)
  .length(1)
  .superRefine((nodes, ctx) => {
    const ids = new Set<string>();
    let count = 0;
    function visit(node: SiteNode, depth: number) {
      if (++count > 250 || depth > 8) {
        ctx.addIssue({ code: "custom", message: "Page is too complex" });
        return;
      }
      if (ids.has(node.id))
        ctx.addIssue({ code: "custom", message: "Duplicate element ID" });
      ids.add(node.id);
      const container = ["__body", "container", "2Col"].includes(node.type);
      if (
        container !== Array.isArray(node.content) ||
        (depth > 0 && node.type === "__body")
      )
        ctx.addIssue({ code: "custom", message: "Invalid element structure" });
      if (Array.isArray(node.content))
        node.content.forEach((n) => visit(n, depth + 1));
      else
        for (const value of [node.content.src, node.content.href])
          if (value && !safeUrl(value))
            ctx.addIssue({ code: "custom", message: "Invalid URL" });
    }
    if (nodes[0]?.type !== "__body" || nodes[0]?.id !== "__body")
      ctx.addIssue({ code: "custom", message: "Page must have a body root" });
    nodes.forEach((n) => visit(n, 0));
  });
// Bound depth and total nodes before recursive validation, including untrusted JSON.
export const siteSchema = z
  .array(z.unknown())
  .length(1)
  .superRefine((roots, ctx) => {
    const queue = roots.map((node) => ({ node, depth: 0 }));
    let count = 0;
    while (queue.length) {
      const { node, depth } = queue.pop()!;
      if (++count > 250 || depth > 8) {
        ctx.addIssue({ code: "custom", message: "Page is too complex" });
        return;
      }
      if (
        node &&
        typeof node === "object" &&
        "content" in node &&
        Array.isArray(node.content)
      ) {
        if (node.content.length > 80) {
          ctx.addIssue({
            code: "custom",
            message: "Too many elements in a section",
          });
          return;
        }
        node.content.forEach((child) =>
          queue.push({ node: child, depth: depth + 1 }),
        );
      }
    }
  })
  .pipe(parsedSiteSchema);
export function safeUrl(value?: string): string {
  if (!value) return "";
  if (
    /^(https?:\/\/|mailto:|tel:|#[a-zA-Z0-9_-]*$|\/(?!\/))/i.test(value) &&
    !/[<>"'\\]/.test(value) &&
    !Array.from(value).some((c) => c.charCodeAt(0) <= 32)
  )
    return value;
  return "";
}
export function videoUrl(value?: string) {
  try {
    const u = new URL(value || "");
    return u.protocol === "https:" &&
      ["www.youtube.com", "www.youtube-nocookie.com"].includes(u.hostname) &&
      /^\/embed\/[\w-]+$/.test(u.pathname)
      ? u.href
      : "";
  } catch {
    return "";
  }
}
export const uid = () => crypto.randomUUID();
export function createNode(type: SiteNode["type"]): SiteNode {
  const base = {
    id: uid(),
    name:
      type === "2Col" ? "Two columns" : type[0].toUpperCase() + type.slice(1),
    type,
    styles: {},
  };
  if (type === "container" || type === "2Col")
    return {
      ...base,
      styles: {
        padding: "24px",
        minHeight: "80px",
        ...(type === "2Col" ? { display: "flex", gap: "24px" } : {}),
      },
      content:
        type === "2Col"
          ? [createNode("container"), createNode("container")]
          : [],
    };
  if (type === "link")
    return {
      ...base,
      styles: {
        display: "inline-block",
        backgroundColor: "#c6c9fa",
        color: "#171821",
        padding: "12px 24px",
        borderRadius: "8px",
        fontWeight: "600",
      },
      content: { innerText: "Get in touch", href: "mailto:hello@example.com" },
    };
  if (type === "image")
    return {
      ...base,
      styles: { width: "100%", borderRadius: "8px" },
      content: { src: "", alt: "Describe your image" },
    };
  if (type === "video") return { ...base, content: { src: "", alt: "Video" } };
  return {
    ...base,
    styles: { fontSize: "18px", color: "#ececf0", lineHeight: "1.6" },
    content: { innerText: "Write something worth sharing." },
  };
}
export function template(
  kind: "studio" | "portfolio" | "blank" = "studio",
): SiteNode[] {
  const root: SiteNode = {
    id: "__body",
    name: "Page",
    type: "__body",
    styles: {
      backgroundColor: "#111214",
      color: "#eeeeef",
      padding: "48px",
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif",
    },
    content: [],
  };
  if (kind === "blank") return [root];
  const text = (
    name: string,
    value: string,
    styles: CSSProperties = {},
  ): SiteNode => ({
    id: uid(),
    name,
    type: "text",
    styles,
    content: { innerText: value },
  });
  const link = createNode("link");
  link.content = {
    innerText: "Let's talk ↗",
    href: "mailto:hello@example.com",
  };
  root.content = [
    {
      id: uid(),
      name: "Navigation",
      type: "container",
      styles: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 0 64px",
      },
      content: [
        text("Brand", kind === "studio" ? "orbit®" : "Alex Morgan", {
          fontSize: "24px",
          fontWeight: "600",
        }),
        text("Navigation links", "Independent design studio", {
          fontSize: "14px",
          color: "#9b9ba5",
        }),
      ],
    },
    {
      id: uid(),
      name: "Hero",
      type: "container",
      styles: { padding: "48px 0", maxWidth: "800px" },
      content: [
        text(
          "Eyebrow",
          kind === "studio"
            ? "A small studio. A wider perspective."
            : "Designer & creative developer",
          { fontSize: "14px", color: "#b8b5eb", margin: "0 0 24px" },
        ),
        text(
          "Heading",
          kind === "studio"
            ? "Good things start\nwith a different view."
            : "Making digital\nfeel a little more human.",
          {
            fontSize: "64px",
            fontWeight: "600",
            lineHeight: "1.1",
            letterSpacing: "-3px",
            margin: "0 0 24px",
          },
        ),
        text(
          "Description",
          "We bring clarity to ambitious ideas. Thoughtful identities, considered websites, and digital experiences that feel like you.",
          {
            fontSize: "18px",
            lineHeight: "1.7",
            color: "#a5a5b0",
            maxWidth: "480px",
            margin: "0 0 32px",
          },
        ),
        link,
      ],
    },
    {
      id: uid(),
      name: "Services",
      type: "2Col",
      styles: {
        display: "flex",
        gap: "32px",
        padding: "48px 0",
        border: "1px solid #2b2c32",
        borderRadius: "12px",
      },
      content: ["Identity & direction", "Websites & experiences"].map(
        (s, i) => ({
          id: uid(),
          name: s,
          type: "container" as const,
          styles: { padding: "24px", width: "100%" },
          content: [
            text("Service", s, {
              fontSize: "24px",
              fontWeight: "600",
              margin: "0 0 16px",
            }),
            text(
              "Detail",
              i
                ? "Considered from the first click to the last detail."
                : "A clear point of view. A brand people remember.",
              { color: "#a5a5b0", lineHeight: "1.6" },
            ),
          ],
        }),
      ),
    },
    text("Footer", "Independent by design. Built with Forma.", {
      color: "#9b9ba5",
      fontSize: "14px",
      padding: "48px 0 0",
    }),
  ];
  return [root];
}
export function findNode(nodes: SiteNode[], id: string): SiteNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (Array.isArray(n.content)) {
      const found = findNode(n.content, id);
      if (found) return found;
    }
  }
}
export function mapNodes(
  nodes: SiteNode[],
  id: string,
  fn: (n: SiteNode) => SiteNode | null,
): SiteNode[] {
  return nodes.flatMap((n) => {
    if (n.id === id) {
      const next = fn(n);
      return next ? [next] : [];
    }
    return [
      {
        ...n,
        content: Array.isArray(n.content)
          ? mapNodes(n.content, id, fn)
          : n.content,
      },
    ];
  });
}
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function css(styles: CSSProperties) {
  return Object.entries(styles)
    .filter(([k]) => (styleKeys as readonly string[]).includes(k))
    .map(
      ([k, v]) =>
        `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${typeof v === "number" && !["opacity", "fontWeight", "lineHeight"].includes(k) ? `${v}px` : v}`,
    )
    .join(";");
}
export function exportHtml(nodes: SiteNode[], title: string) {
  siteSchema.parse(nodes);
  const render = (n: SiteNode): string => {
    const attrs = `id="${escape(n.id)}" style="${escape(css(n.styles))}" class="${n.type === "2Col" ? "columns" : n.type === "text" ? "text" : "element"}"`;
    if (Array.isArray(n.content))
      return `<div ${attrs}>${n.content.map(render).join("")}</div>`;
    if (n.type === "image")
      return n.content.src
        ? `<img ${attrs} src="${escape(safeUrl(n.content.src))}" alt="${escape(n.content.alt || "")}" loading="lazy">`
        : "";
    if (n.type === "video")
      return videoUrl(n.content.src)
        ? `<iframe ${attrs} src="${escape(videoUrl(n.content.src))}" title="${escape(n.content.alt || "Video")}" sandbox="allow-scripts allow-same-origin allow-presentation" allowfullscreen></iframe>`
        : "";
    if (n.type === "link")
      return `<a ${attrs} href="${escape(safeUrl(n.content.href))}">${escape(n.content.innerText || "")}</a>`;
    return `<div ${attrs}>${escape(n.content.innerText || "")}</div>`;
  };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>*{box-sizing:border-box}body{margin:0}img{max-width:100%;height:auto}iframe{width:100%;aspect-ratio:16/9;border:0}.text{white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:600px){.columns{flex-direction:column!important}body>div{padding:24px!important}.text{font-size:clamp(14px,5vw,64px)}}</style></head><body>${nodes.map(render).join("")}</body></html>`;
}

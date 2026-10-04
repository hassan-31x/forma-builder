import { safeUrl, videoUrl, type SiteNode } from "@/lib/site";
export function SiteRenderer({ nodes }: { nodes: SiteNode[] }) {
  return (
    <>
      {nodes.map((n) => (
        <SiteElement key={n.id} node={n} />
      ))}
    </>
  );
}
export function SiteElement({ node }: { node: SiteNode }) {
  const style = node.styles;
  if (Array.isArray(node.content))
    return (
      <div
        id={node.id}
        style={style}
        className={node.type === "2Col" ? "site-columns" : ""}
      >
        <SiteRenderer nodes={node.content} />
      </div>
    );
  if (node.type === "image")
    return safeUrl(node.content.src) ? (
      <img
        id={node.id}
        style={style}
        src={safeUrl(node.content.src)}
        alt={node.content.alt || ""}
        loading="lazy"
      />
    ) : null;
  if (node.type === "video")
    return videoUrl(node.content.src) ? (
      <iframe
        id={node.id}
        style={style}
        src={videoUrl(node.content.src)}
        title={node.content.alt || "Video"}
        sandbox="allow-scripts allow-same-origin allow-presentation"
        allowFullScreen
      />
    ) : null;
  if (node.type === "link")
    return (
      <a id={node.id} style={style} href={safeUrl(node.content.href)}>
        {node.content.innerText}
      </a>
    );
  return (
    <div
      id={node.id}
      style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", ...style }}
      className="site-text"
    >
      {node.content.innerText}
    </div>
  );
}

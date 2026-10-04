"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
  type CSSProperties,
  type DragEvent,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  Image as ImageIcon,
  Layers,
  Link as LinkIcon,
  Monitor,
  MousePointer2,
  Plus,
  Redo2,
  Save,
  Settings2,
  Smartphone,
  Sparkles,
  Square,
  Tablet,
  Trash2,
  Type,
  Undo2,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createNode,
  exportHtml,
  findNode,
  mapNodes,
  safeUrl,
  siteSchema,
  uid,
  videoUrl,
  type SiteNode,
} from "@/lib/site";
import {
  getProject,
  saveProject,
  publishProject,
  unpublishProject,
  type Project,
} from "@/lib/projects";
import { Mark } from "./brand";
import { SiteRenderer } from "./site-renderer";
const tools = [
  { type: "text", label: "Text", icon: Type },
  { type: "container", label: "Section", icon: Square },
  { type: "2Col", label: "Columns", icon: Layers },
  { type: "link", label: "Button / link", icon: LinkIcon },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "video", label: "Video", icon: Video },
] as const;
type Timeline = { history: SiteNode[][]; index: number };
export function Builder({
  projectId,
  demo,
}: {
  projectId: string;
  demo: boolean;
}) {
  const [project, setProject] = useState<Project | null>(null),
    [timeline, setTimeline] = useState<Timeline>({ history: [], index: 0 }),
    [selected, setSelected] = useState("__body"),
    [tab, setTab] = useState<"layers" | "add" | "ai">("layers"),
    [device, setDevice] = useState("Desktop"),
    [preview, setPreview] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [aiBusy, setAiBusy] = useState(false),
    [prompt, setPrompt] = useState(""),
    [dirty, setDirty] = useState(false),
    [publishOpen, setPublishOpen] = useState(false),
    [publicUrl, setPublicUrl] = useState(""),
    [mobilePanel, setMobilePanel] = useState<"left" | "right" | null>(null),
    [replaceReady, setReplaceReady] = useState<SiteNode[] | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<Project | null>(null);
  const revision = useRef(0);
  const nodes = useMemo(
    () => timeline.history[timeline.index] || [],
    [timeline],
  );
  const current = findNode(nodes, selected);
  useEffect(() => {
    let live = true;
    getProject(projectId, demo)
      .then((p) => {
        if (!p) throw new Error("This project could not be found.");
        const elements = siteSchema.parse(p.elements);
        if (live) {
          setProject({ ...p, elements });
          projectRef.current = { ...p, elements };
          setTimeline({ history: [elements], index: 0 });
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [projectId, demo]);
  const commit = useCallback((next: SiteNode[]) => {
    const parsed = siteSchema.safeParse(next);
    if (!parsed.success) {
      toast.error(
        "This change would make the page invalid. Check your values.",
      );
      return;
    }
    revision.current++;
    setTimeline((t) => {
      const history = [...t.history.slice(0, t.index + 1), next].slice(-80);
      return { history, index: history.length - 1 };
    });
    setDirty(true);
  }, []);
  const undo = useCallback(() => {
    revision.current++;
    setTimeline((t) => ({ ...t, index: Math.max(0, t.index - 1) }));
    setDirty(true);
  }, []);
  const redo = useCallback(() => {
    revision.current++;
    setTimeline((t) => ({
      ...t,
      index: Math.min(t.history.length - 1, t.index + 1),
    }));
    setDirty(true);
  }, []);
  useEffect(() => {
    if (project) {
      const next = { ...project, elements: nodes };
      projectRef.current = next;
    }
  }, [nodes, project]);
  const save = useCallback(async () => {
    const snapshot = projectRef.current;
    if (!snapshot) return;
    const savingRevision = revision.current;
    setSaving(true);
    try {
      await saveProject(snapshot, demo);
      if (savingRevision === revision.current) setDirty(false);
      toast.success(demo ? "Saved in this browser" : "Website saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [demo]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);
  useEffect(() => {
    const keyboard = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
        return;
      }
      if (target.closest("input,textarea,select,[contenteditable=true]"))
        return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === "Escape") {
        setPreview(false);
        setMobilePanel(null);
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [save, undo, redo]);
  function update(node: SiteNode) {
    commit(mapNodes(nodes, node.id, () => node));
  }
  function add(type: SiteNode["type"], targetId?: string) {
    const target = targetId ? findNode(nodes, targetId) : current;
    const container =
      target && Array.isArray(target.content) ? target.id : "__body";
    const node = createNode(type);
    commit(
      mapNodes(nodes, container, (n) => ({
        ...n,
        content: [...(n.content as SiteNode[]), node],
      })),
    );
    setSelected(node.id);
    setTab("layers");
  }
  function remove() {
    if (!current || current.type === "__body") return;
    commit(mapNodes(nodes, current.id, () => null));
    setSelected("__body");
  }
  function duplicate() {
    if (!current || current.type === "__body") return;
    function clone(n: SiteNode): SiteNode {
      return {
        ...n,
        id: uid(),
        content: Array.isArray(n.content)
          ? n.content.map(clone)
          : { ...n.content },
      };
    }
    const copy = clone(current);
    function walk(items: SiteNode[]): SiteNode[] {
      return items.flatMap((n) =>
        n.id === selected
          ? [n, copy]
          : [
              {
                ...n,
                content: Array.isArray(n.content) ? walk(n.content) : n.content,
              },
            ],
      );
    }
    commit(walk(nodes));
    setSelected(copy.id);
  }
  function move(direction: number) {
    function walk(items: SiteNode[]): SiteNode[] {
      const index = items.findIndex((n) => n.id === selected);
      if (index >= 0) {
        const result = [...items];
        const next = index + direction;
        if (next >= 0 && next < items.length)
          [result[index], result[next]] = [result[next], result[index]];
        return result;
      }
      return items.map((n) => ({
        ...n,
        content: Array.isArray(n.content) ? walk(n.content) : n.content,
      }));
    }
    commit(walk(nodes));
  }
  function style(key: keyof CSSProperties, value: string) {
    if (current)
      update({ ...current, styles: { ...current.styles, [key]: value } });
  }
  function content(key: string, value: string) {
    if (current && !Array.isArray(current.content))
      update({ ...current, content: { ...current.content, [key]: value } });
  }
  function download() {
    try {
      const blob = new Blob(
        [exportHtml(nodes, project?.name || "My website")],
        { type: "text/html" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(project?.name || "website").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("HTML exported");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function generate() {
    if (demo) {
      toast("AI needs a cloud account", {
        description:
          "Sign up to generate websites. Templates are available in this local demo.",
      });
      return;
    }
    setAiBusy(true);
    setError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReplaceReady(siteSchema.parse(data.elements));
      toast.success(`Draft ready. ${data.remaining} generations left today.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAiBusy(false);
    }
  }
  async function publish() {
    const snapshot = projectRef.current;
    if (!snapshot) return;
    if (demo) {
      toast("Publishing needs a cloud account", {
        description: "You can export this website as HTML right now.",
      });
      return;
    }
    setSaving(true);
    const savingRevision = revision.current;
    try {
      await saveProject(snapshot, false);
      const slug = await publishProject(snapshot);
      setPublicUrl(`${location.origin}/sites/${slug}`);
      if (savingRevision === revision.current) setDirty(false);
      toast.success("Your website is live");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  const back = `/dashboard${demo ? "?demo=1" : ""}`;
  if (loading)
    return (
      <main id="main" className="builder-loading">
        <Mark />
        <p>Opening your studio…</p>
        <div className="loading-block" />
      </main>
    );
  if (!project)
    return (
      <main id="main" className="legal-page">
        <h1>We couldn’t open this website.</h1>
        <p className="error-message">{error}</p>
        <Link href={back} className="button">
          <ArrowLeft size={16} />
          Back to workspace
        </Link>
      </main>
    );
  return (
    <main id="main" className={`builder ${preview ? "is-preview" : ""}`}>
      <header className="builder-toolbar">
        <div className="builder-title">
          <Link
            href={back}
            aria-label="Back to workspace"
            className="icon-button"
            onClick={(e) => {
              if (dirty) {
                e.preventDefault();
                setPublishOpen(false);
                toast("Save your changes before leaving", {
                  action: { label: "Save", onClick: () => void save() },
                });
              }
            }}
          >
            <ArrowLeft size={16} />
          </Link>
          <Mark />
          <div>
            <input
              aria-label="Website name"
              value={project.name}
              maxLength={100}
              onChange={(e) => {
                revision.current++;
                setProject({ ...project, name: e.target.value });
                setDirty(true);
              }}
            />
            <span>
              {demo ? "Local demo" : "Website studio"}
              <i /> {dirty ? "Unsaved changes" : "All changes saved"}
            </span>
          </div>
        </div>
        <div className="device-controls" aria-label="Preview size">
          {[
            ["Desktop", Monitor],
            ["Tablet", Tablet],
            ["Mobile", Smartphone],
          ].map(([label, Icon]) => {
            const DeviceIcon = Icon as typeof Monitor;
            return (
              <button
                key={String(label)}
                aria-label={`${label} preview`}
                aria-pressed={device === label}
                className={`icon-button ${device === label ? "active" : ""}`}
                onClick={() => setDevice(String(label))}
              >
                <DeviceIcon size={16} />
              </button>
            );
          })}
        </div>
        <div className="builder-actions">
          <button
            className="icon-button history-button"
            disabled={timeline.index === 0}
            onClick={undo}
            aria-label="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            className="icon-button history-button"
            disabled={timeline.index === timeline.history.length - 1}
            onClick={redo}
            aria-label="Redo"
          >
            <Redo2 size={16} />
          </button>
          <span className="toolbar-separator" />
          <button
            className="icon-button"
            onClick={() => setPreview((v) => !v)}
            aria-label={preview ? "Exit preview" : "Preview website"}
            aria-pressed={preview}
          >
            <Eye size={16} />
          </button>
          <button
            className="icon-button export-button"
            onClick={download}
            aria-label="Export HTML"
          >
            <Download size={16} />
          </button>
          <button
            className="button small secondary save-button"
            onClick={save}
            disabled={saving || aiBusy}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            className="button small accent"
            onClick={() => setPublishOpen((v) => !v)}
          >
            Publish <ArrowUpRight size={13} />
          </button>
        </div>
      </header>
      {publishOpen && (
        <section className="publish-panel">
          <div>
            <h2>Your website, out in the world.</h2>
            <button
              className="icon-button"
              aria-label="Close publishing"
              onClick={() => setPublishOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
          <label className="field">
            Search description
            <textarea
              maxLength={300}
              value={project.description}
              onChange={(e) => {
                revision.current++;
                setProject({ ...project, description: e.target.value });
                setDirty(true);
              }}
              placeholder="A short description of your website"
            />
          </label>
          <p className="notice">
            Publish saves a snapshot of your page. Later edits stay private
            until you publish again.
            {demo && " Public publishing is available with a cloud account."}
          </p>
          {publicUrl && (
            <div className="published-link">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                View live website <ArrowUpRight size={14} />
              </a>
              <button
                className="icon-button"
                aria-label="Copy website link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(publicUrl);
                    toast.success("Link copied");
                  } catch {
                    toast.error(
                      "Copy failed. Open the link and copy its address.",
                    );
                  }
                }}
              >
                <Copy size={15} />
              </button>
            </div>
          )}
          <div className="panel-actions">
            <button
              className="button small"
              disabled={saving}
              onClick={publish}
            >
              {saving
                ? "Publishing…"
                : publicUrl
                  ? "Publish changes"
                  : "Publish website"}
            </button>
            <button className="button small secondary" onClick={download}>
              Export HTML
            </button>
            {!demo && (
              <button
                className="text-button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await unpublishProject(project.id);
                    setPublicUrl("");
                    toast.success("Public website removed");
                  } catch (e) {
                    toast.error((e as Error).message);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Unpublish
              </button>
            )}
          </div>
        </section>
      )}
      <div className="builder-mobile-bar">
        <button
          className="text-button"
          onClick={() => setMobilePanel((m) => (m === "left" ? null : "left"))}
        >
          <Layers size={14} />
          Elements
        </button>
        <button
          className="text-button"
          onClick={() =>
            setMobilePanel((m) => (m === "right" ? null : "right"))
          }
        >
          <Settings2 size={14} />
          Design
        </button>
        <button
          className="icon-button"
          disabled={!dirty || saving}
          onClick={save}
          aria-label="Save website"
        >
          <Save size={15} />
        </button>
      </div>
      <div className="builder-body">
        <aside
          className={`builder-left ${mobilePanel === "left" ? "mobile-open" : ""}`}
        >
          <div className="builder-panel-tabs">
            <button
              className={tab === "layers" ? "active" : ""}
              onClick={() => setTab("layers")}
            >
              <Layers size={14} />
              Layers
            </button>
            <button
              className={tab === "add" ? "active" : ""}
              onClick={() => setTab("add")}
            >
              <Plus size={14} />
              Add
            </button>
            <button
              className={tab === "ai" ? "active" : ""}
              onClick={() => setTab("ai")}
              aria-label="AI generator"
            >
              <Sparkles size={14} />
            </button>
          </div>
          {tab === "layers" ? (
            <div className="layer-tree">
              <div className="panel-heading">
                Page structure{" "}
                <button
                  className="icon-button"
                  aria-label="Add an element"
                  onClick={() => setTab("add")}
                >
                  <Plus size={14} />
                </button>
              </div>
              <LayerTree
                nodes={nodes}
                selected={selected}
                onSelect={setSelected}
              />
              <div className="sidebar-note">
                <MousePointer2 size={14} />
                <p>
                  Select an element to edit it.
                  <br />
                  Double click text on the canvas to write.
                </p>
              </div>
            </div>
          ) : tab === "add" ? (
            <div className="add-panel">
              <h2>Make room for more.</h2>
              <p>Add to the selected section, or drag onto the canvas.</p>
              <div className="element-tools">
                {tools.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => add(t.type)}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("forma-element", t.type)
                    }
                  >
                    <t.icon size={20} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ai-panel">
              <Sparkles size={24} />
              <h2>Start with a thought.</h2>
              <p>
                Describe the website you have in mind. We’ll create a draft you
                can make your own.
              </p>
              <label className="field">
                Your brief
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={2000}
                  placeholder="A minimal website for my ceramics studio, with an about section, services, and a contact link."
                />
              </label>
              <button
                className="button small accent"
                disabled={aiBusy || prompt.trim().length < 15}
                onClick={generate}
              >
                {aiBusy ? "Creating your draft…" : "Generate website"}
                <Sparkles size={14} />
              </button>
              {demo && (
                <p className="notice">
                  AI generation needs a cloud account.{" "}
                  <Link href="/login?mode=signup">Create an account ↗</Link>
                </p>
              )}
              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}
              {replaceReady && (
                <div className="draft-confirm">
                  <h3>Your draft is ready.</h3>
                  <p>This replaces the page in your editor. You can undo it.</p>
                  <button
                    className="button small"
                    onClick={() => {
                      commit(replaceReady);
                      setReplaceReady(null);
                      setSelected("__body");
                      setTab("layers");
                    }}
                  >
                    Use this draft
                    <Check size={14} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setReplaceReady(null)}
                  >
                    Keep my page
                  </button>
                </div>
              )}
              <span className="notice">
                10 generations per day. Every attempt counts.
              </span>
            </div>
          )}
        </aside>
        <section className="builder-workarea" aria-label="Website canvas">
          <div className="canvas-topline">
            <span>
              <span className="status-dot" />
              {project.name || "Untitled site"}
            </span>
            <span>
              {device}{" "}
              <span className="muted">/ {preview ? "Preview" : "Editing"}</span>
            </span>
          </div>
          <div className="canvas-scroll">
            <div
              ref={canvasRef}
              className={`builder-canvas ${device.toLowerCase()}`}
              style={{
                width:
                  device === "Mobile"
                    ? 390
                    : device === "Tablet"
                      ? 768
                      : "100%",
              }}
            >
              {preview ? (
                <SiteRenderer nodes={nodes} />
              ) : (
                nodes.map((n) => (
                  <CanvasNode
                    key={n.id}
                    node={n}
                    selected={selected}
                    onSelect={setSelected}
                    onUpdate={update}
                    onDrop={add}
                  />
                ))
              )}
            </div>
          </div>
          <div className="canvas-bottomline">
            <span>{preview ? "Preview mode" : "Your canvas. Your call."}</span>
            <span>
              {demo ? "Saved in your browser" : "Save to sync your work"}
            </span>
          </div>
          {preview && (
            <button
              className="button small preview-exit"
              onClick={() => setPreview(false)}
            >
              <ArrowLeft size={14} />
              Back to editing
            </button>
          )}
        </section>
        <aside
          className={`builder-right ${mobilePanel === "right" ? "mobile-open" : ""}`}
        >
          <div className="panel-heading">
            Design <Settings2 size={14} />
          </div>
          {current ? (
            <>
              <div className="selected-heading">
                <span>{current.type}</span>
                <input
                  aria-label="Element name"
                  value={current.name}
                  maxLength={100}
                  onChange={(e) =>
                    update({ ...current, name: e.target.value || "Element" })
                  }
                />
                {current.type !== "__body" && (
                  <div className="element-actions">
                    <button
                      className="icon-button"
                      onClick={duplicate}
                      aria-label="Duplicate element"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => move(-1)}
                      aria-label="Move element up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => move(1)}
                      aria-label="Move element down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={remove}
                      aria-label="Delete element"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              {!Array.isArray(current.content) && (
                <details className="design-group" open>
                  <summary>
                    Content
                    <ChevronDown size={12} />
                  </summary>
                  {["text", "link"].includes(current.type) && (
                    <label className="field">
                      Text
                      <textarea
                        value={current.content.innerText || ""}
                        onChange={(e) => content("innerText", e.target.value)}
                        maxLength={10000}
                      />
                    </label>
                  )}
                  {current.type === "link" && (
                    <label className="field">
                      Destination
                      <input
                        key={`${current.id}-href-${current.content.href}`}
                        defaultValue={current.content.href || ""}
                        onBlur={(e) => content("href", e.target.value)}
                        placeholder="https:// or mailto:"
                      />
                    </label>
                  )}
                  {["image", "video"].includes(current.type) && (
                    <>
                      <label className="field">
                        {current.type === "video"
                          ? "YouTube embed URL"
                          : "Image URL"}
                        <input
                          key={`${current.id}-src-${current.content.src}`}
                          defaultValue={current.content.src || ""}
                          onBlur={(e) => content("src", e.target.value)}
                          placeholder={
                            current.type === "video"
                              ? "https://www.youtube.com/embed/…"
                              : "https://…"
                          }
                        />
                      </label>
                      <label className="field">
                        {current.type === "image"
                          ? "Alternative text"
                          : "Video title"}
                        <input
                          value={current.content.alt || ""}
                          onChange={(e) => content("alt", e.target.value)}
                        />
                      </label>
                    </>
                  )}
                </details>
              )}
              <details className="design-group" open>
                <summary>
                  Layout
                  <ChevronDown size={12} />
                </summary>
                <div className="design-grid">
                  {(
                    [
                      "width",
                      "maxWidth",
                      "minHeight",
                      "padding",
                      "margin",
                      "gap",
                    ] as const
                  ).map((k) => (
                    <StyleField
                      key={k}
                      node={current}
                      property={k}
                      onChange={style}
                    />
                  ))}
                </div>
                {Array.isArray(current.content) && (
                  <>
                    <label className="field">
                      Display
                      <select
                        value={current.styles.display || "block"}
                        onChange={(e) => style("display", e.target.value)}
                      >
                        <option value="block">Block</option>
                        <option value="flex">Flex</option>
                      </select>
                    </label>
                    {current.styles.display === "flex" && (
                      <>
                        <label className="field">
                          Direction
                          <select
                            value={current.styles.flexDirection || "row"}
                            onChange={(e) =>
                              style("flexDirection", e.target.value)
                            }
                          >
                            <option value="row">Row</option>
                            <option value="column">Column</option>
                          </select>
                        </label>
                        <label className="field">
                          Align items
                          <select
                            value={current.styles.alignItems || "stretch"}
                            onChange={(e) =>
                              style("alignItems", e.target.value)
                            }
                          >
                            {[
                              "stretch",
                              "center",
                              "flex-start",
                              "flex-end",
                            ].map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          Justify
                          <select
                            value={
                              current.styles.justifyContent || "flex-start"
                            }
                            onChange={(e) =>
                              style("justifyContent", e.target.value)
                            }
                          >
                            {[
                              "flex-start",
                              "center",
                              "flex-end",
                              "space-between",
                              "space-around",
                            ].map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </label>
                      </>
                    )}
                  </>
                )}
              </details>
              <details className="design-group" open>
                <summary>
                  Typography
                  <ChevronDown size={12} />
                </summary>
                <div className="design-grid">
                  {(
                    [
                      "fontSize",
                      "fontWeight",
                      "lineHeight",
                      "letterSpacing",
                    ] as const
                  ).map((k) => (
                    <StyleField
                      key={k}
                      node={current}
                      property={k}
                      onChange={style}
                    />
                  ))}
                </div>
                <label className="field">
                  Text alignment
                  <select
                    value={current.styles.textAlign || "left"}
                    onChange={(e) => style("textAlign", e.target.value)}
                  >
                    {["left", "center", "right", "justify"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
              </details>
              <details className="design-group" open>
                <summary>
                  Appearance
                  <ChevronDown size={12} />
                </summary>
                {(
                  [
                    "color",
                    "backgroundColor",
                    "borderRadius",
                    "border",
                    "opacity",
                  ] as const
                ).map((k) => (
                  <StyleField
                    key={k}
                    node={current}
                    property={k}
                    onChange={style}
                  />
                ))}
                <p className="notice">
                  Use px, %, or CSS values. Opacity is 0 to 1.
                </p>
              </details>
            </>
          ) : (
            <div className="sidebar-note">
              <MousePointer2 />
              <p>
                Select an element on the canvas or in Layers to edit its design.
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
function StyleField({
  node,
  property,
  onChange,
}: {
  node: SiteNode;
  property: keyof CSSProperties;
  onChange: (key: keyof CSSProperties, value: string) => void;
}) {
  return (
    <label className="field">
      {property.replace(/[A-Z]/g, (c) => ` ${c.toLowerCase()}`)}
      <input
        key={`${node.id}-${property}-${node.styles[property]}`}
        defaultValue={String(node.styles[property] ?? "")}
        placeholder={property === "padding" ? "24px" : "Default"}
        onBlur={(e) => {
          if (e.target.value !== String(node.styles[property] ?? ""))
            onChange(property, e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
    </label>
  );
}
function LayerTree({
  nodes,
  selected,
  onSelect,
  depth = 0,
}: {
  nodes: SiteNode[];
  selected: string;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  return (
    <>
      {nodes.map((n) => (
        <div key={n.id}>
          <button
            className={`layer-row ${n.id === selected ? "selected" : ""}`}
            style={{ paddingLeft: 12 + depth * 12 }}
            onClick={() => onSelect(n.id)}
          >
            {Array.isArray(n.content) ? (
              <Layers size={12} />
            ) : n.type === "text" ? (
              <Type size={12} />
            ) : n.type === "image" ? (
              <ImageIcon size={12} />
            ) : (
              <LinkIcon size={12} />
            )}
            <span>{n.name}</span>
          </button>
          {Array.isArray(n.content) && (
            <LayerTree
              nodes={n.content}
              selected={selected}
              onSelect={onSelect}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </>
  );
}
function CanvasNode({
  node,
  selected,
  onSelect,
  onUpdate,
  onDrop,
}: {
  node: SiteNode;
  selected: string;
  onSelect: (id: string) => void;
  onUpdate: (node: SiteNode) => void;
  onDrop: (type: SiteNode["type"], id?: string) => void;
}) {
  const container = Array.isArray(node.content);
  const active = selected === node.id;
  const [editing, setEditing] = useState(false);
  function drop(e: DragEvent) {
    if (!container) return;
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData("forma-element");
    if (tools.some((t) => t.type === type))
      onDrop(type as SiteNode["type"], node.id);
  }
  return (
    <div
      className={`canvas-node ${active ? "node-selected" : ""} ${container ? "node-container" : ""} ${node.type === "2Col" ? "site-columns" : ""}`}
      id={node.id}
      style={{
        ...node.styles,
        ...(!container ? { position: "relative" } : {}),
        ...(container && (node.content as SiteNode[]).length === 0
          ? { minHeight: 120 }
          : {}),
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onDragOver={(e) => {
        if (container) e.preventDefault();
      }}
      onDrop={drop}
    >
      {active && <span className="node-tag">{node.name}</span>}
      {container ? (
        (node.content as SiteNode[]).length ? (
          (node.content as SiteNode[]).map((n) => (
            <CanvasNode
              key={n.id}
              node={n}
              selected={selected}
              onSelect={onSelect}
              onUpdate={onUpdate}
              onDrop={onDrop}
            />
          ))
        ) : (
          <div className="container-empty">
            <Plus size={18} />
            <span>Add or drop an element here</span>
          </div>
        )
      ) : (
        (() => {
          const c = node.content as Exclude<SiteNode["content"], SiteNode[]>;
          if (node.type === "image")
            return safeUrl(c.src) ? (
              <img src={safeUrl(c.src)} alt={c.alt || ""} draggable={false} />
            ) : (
              <div className="media-empty">
                <ImageIcon size={24} />
                <span>Add an image URL in Design</span>
              </div>
            );
          if (node.type === "video")
            return videoUrl(c.src) ? (
              <iframe
                src={videoUrl(c.src)}
                title={c.alt || "Video"}
                sandbox="allow-scripts allow-same-origin allow-presentation"
              />
            ) : (
              <div className="media-empty">
                <Video size={24} />
                <span>Add a YouTube embed URL in Design</span>
              </div>
            );
          return (
            <div
              className="editable-text"
              contentEditable={editing}
              suppressContentEditableWarning
              role={editing ? "textbox" : undefined}
              aria-label={editing ? node.name : undefined}
              onDoubleClick={() => setEditing(true)}
              onBlur={(e) => {
                if (editing) {
                  const text = e.currentTarget.innerText;
                  setEditing(false);
                  if (text !== c.innerText)
                    onUpdate({ ...node, content: { ...c, innerText: text } });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") e.currentTarget.blur();
              }}
            >
              {c.innerText}
            </div>
          );
        })()
      )}
    </div>
  );
}

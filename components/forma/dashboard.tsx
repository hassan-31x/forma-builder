"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  LayoutTemplate,
  LogOut,
  Plus,
  Trash2,
  Settings2,
  X,
} from "lucide-react";
import { Brand } from "./brand";
import { SiteRenderer } from "./site-renderer";
import {
  createProject,
  deleteProject,
  listProjects,
  saveProject,
  type Project,
} from "@/lib/projects";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
export function Dashboard({ demo, name }: { demo: boolean; name: string }) {
  const [projects, setProjects] = useState<Project[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [creating, setCreating] = useState(false),
    [busy, setBusy] = useState(false),
    [title, setTitle] = useState(""),
    [kind, setKind] = useState<"studio" | "portfolio" | "blank">("studio"),
    [search, setSearch] = useState(""),
    [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    listProjects(demo)
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [demo]);
  async function create() {
    setBusy(true);
    setError("");
    try {
      const p = await createProject(title || "Untitled site", kind, demo);
      router.push(`/editor?project=${p.id}${demo ? "&demo=1" : ""}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    try {
      await deleteProject(id, demo);
      setProjects((p) => p.filter((x) => x.id !== id));
      setDeleting(null);
      toast.success("Project deleted");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function duplicate(p: Project) {
    setBusy(true);
    try {
      const next = await createProject(
        `${p.name.slice(0, 90)} copy`,
        "blank",
        demo,
      );
      await saveProject(
        { ...next, elements: p.elements, description: p.description },
        demo,
      );
      setProjects(await listProjects(demo));
      toast.success("Project duplicated");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="app-header">
        <Brand />
        <div className="header-meta">
          <span>{name}</span>
          {demo ? (
            <Link href="/login?mode=signup" className="button small secondary">
              Create an account <ArrowUpRight size={13} />
            </Link>
          ) : (
            <>
              <Link
                href="/settings"
                className="icon-button"
                aria-label="Account settings"
              >
                <Settings2 size={16} />
              </Link>
              <button
                className="icon-button"
                aria-label="Log out"
                onClick={async () => {
                  await authClient.signOut();
                  router.push("/");
                  router.refresh();
                }}
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </header>
      {demo && (
        <div className="demo-banner">
          Local demo. Projects are saved only in this browser.{" "}
          <Link href="/login?mode=signup">Sign up for cloud saving and AI</Link>
        </div>
      )}
      <main id="main" className="dashboard">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">Your workspace</span>
            <h1>A home for your ideas.</h1>
            <p>Start something new. Or give an old idea a little more room.</p>
          </div>
          <button className="button" onClick={() => setCreating(true)}>
            <Plus size={16} />
            New website
          </button>
        </div>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        {creating && (
          <section className="create-panel">
            <div>
              <h2>Where should we start?</h2>
              <button
                className="icon-button"
                onClick={() => setCreating(false)}
                aria-label="Close new website form"
              >
                <X size={16} />
              </button>
            </div>
            <label className="field">
              Website name
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="My next idea"
                autoFocus
              />
            </label>
            <div className="template-options">
              {[
                [
                  "studio",
                  "Design studio",
                  "A considered starting point for creative businesses.",
                ],
                [
                  "portfolio",
                  "Personal portfolio",
                  "Let your work and your point of view do the talking.",
                ],
                [
                  "blank",
                  "Blank canvas",
                  "A clean page with room for whatever comes next.",
                ],
              ].map(([id, h, p]) => (
                <button
                  key={id}
                  className={`template-option ${kind === id ? "selected" : ""}`}
                  onClick={() => setKind(id as typeof kind)}
                  aria-pressed={kind === id}
                >
                  {kind === id ? (
                    <Check size={20} />
                  ) : (
                    <LayoutTemplate size={20} />
                  )}
                  <span>{h}</span>
                  <small>{p}</small>
                </button>
              ))}
            </div>
            <div className="panel-actions">
              <button className="button" disabled={busy} onClick={create}>
                {busy ? "Creating…" : "Open in studio"}
                <ArrowRight size={15} />
              </button>
              <span className="notice">
                You can start with AI inside the studio.
              </span>
            </div>
          </section>
        )}
        <div className="workspace-tabs">
          <span>
            All websites <span className="muted">({projects.length})</span>
          </span>
          <input
            aria-label="Search websites"
            className="text-input search-input"
            placeholder="Search websites…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="project-grid">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="loading-block"
                aria-label="Loading projects"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <section className="empty-state">
            <LayoutTemplate size={32} />
            <h2>Your first website is waiting.</h2>
            <p>
              Start with a template, make it your own,
              <br />
              and give your idea a place on the web.
            </p>
            <button className="button" onClick={() => setCreating(true)}>
              Create your first website
              <ArrowRight size={16} />
            </button>
          </section>
        ) : (
          <div className="project-grid">
            {projects
              .filter((p) =>
                p.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((p) => (
                <article className="project-card" key={p.id}>
                  <Link
                    href={`/editor?project=${p.id}${demo ? "&demo=1" : ""}`}
                    className="project-thumb"
                    aria-label={`Edit ${p.name}`}
                  >
                    <div className="project-thumb-inner">
                      <SiteRenderer nodes={p.elements} />
                    </div>
                  </Link>
                  <div className="project-card-info">
                    <Link
                      href={`/editor?project=${p.id}${demo ? "&demo=1" : ""}`}
                    >
                      <h2>{p.name}</h2>
                      <p>
                        Edited{" "}
                        {new Date(p.updated_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </Link>
                    <div className="flex">
                      <button
                        className="icon-button"
                        aria-label={`Duplicate ${p.name}`}
                        disabled={busy}
                        onClick={() => duplicate(p)}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete ${p.name}`}
                        disabled={busy}
                        onClick={() => setDeleting(p.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {deleting === p.id && (
                    <div className="delete-confirm">
                      <p>Delete this website and its published page?</p>
                      <div>
                        <button
                          className="button small danger"
                          disabled={busy}
                          onClick={() => remove(p.id)}
                        >
                          Delete website
                        </button>
                        <button
                          className="button small secondary"
                          onClick={() => setDeleting(null)}
                        >
                          Keep it
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
          </div>
        )}
        {!loading &&
          projects.length > 0 &&
          !projects.some((p) =>
            p.name.toLowerCase().includes(search.toLowerCase()),
          ) && (
            <p className="notice">
              No websites match “{search}”. Try another name.
            </p>
          )}
      </main>
    </>
  );
}

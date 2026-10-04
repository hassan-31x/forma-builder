import { siteSchema, template, uid, type SiteNode } from "./site";
export type Project = {
  id: string;
  name: string;
  description: string;
  elements: SiteNode[];
  updated_at: string;
  created_at: string;
  user_id?: string;
};
const key = "forma-demo-projects-v1";
export function demoProjects(): Project[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      "Your local projects could not be read. Clear Forma site storage to reset the demo.",
    );
  }
}
async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data as T;
}
export async function listProjects(demo: boolean): Promise<Project[]> {
  return demo ? demoProjects() : api("/api/projects");
}
export async function getProject(
  id: string,
  demo: boolean,
): Promise<Project | undefined> {
  return demo
    ? demoProjects().find((p) => p.id === id)
    : api(`/api/projects/${id}`);
}
export async function createProject(
  name: string,
  kind: "studio" | "portfolio" | "blank",
  demo: boolean,
): Promise<Project> {
  if (!demo)
    return api("/api/projects", "POST", {
      name: name.trim() || "Untitled site",
      kind,
    });
  const project: Project = {
    id: uid(),
    name: name.trim().slice(0, 100) || "Untitled site",
    description: "",
    elements: template(kind),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify([project, ...demoProjects()]));
  return project;
}
export async function saveProject(project: Project, demo: boolean) {
  siteSchema.parse(project.elements);
  const update = {
    name: project.name.trim().slice(0, 100) || "Untitled site",
    description: project.description.slice(0, 300),
    elements: project.elements,
    updated_at: new Date().toISOString(),
  };
  if (demo) {
    const projects = demoProjects();
    if (!projects.some((p) => p.id === project.id))
      throw new Error("Project no longer exists.");
    localStorage.setItem(
      key,
      JSON.stringify(
        projects.map((p) => (p.id === project.id ? { ...p, ...update } : p)),
      ),
    );
    return;
  }
  await api(`/api/projects/${project.id}`, "PUT", update);
}
export async function deleteProject(id: string, demo: boolean) {
  if (demo) {
    localStorage.setItem(
      key,
      JSON.stringify(demoProjects().filter((p) => p.id !== id)),
    );
    return;
  }
  await api(`/api/projects/${id}`, "DELETE");
}
export async function publishProject(project: Project) {
  siteSchema.parse(project.elements);
  const data = await api<{ slug: string }>(
    `/api/projects/${project.id}/publish`,
    "POST",
  );
  return data.slug;
}
export async function unpublishProject(id: string) {
  await api(`/api/projects/${id}/publish`, "DELETE");
}

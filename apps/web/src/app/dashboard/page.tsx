import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

async function getProjects(token: string) {
  try {
    const res = await fetch(`${process.env["API_URL"] ?? "http://localhost:3001"}/api/projects`, {
      headers: { Cookie: `auth_token=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { success: boolean; data?: Array<{ id: string; title: string; stage: string; essayType: string; targetWordCount: number; updatedAt: string }> };
    return data.data ?? [];
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const { cookies } = await import("next/headers");
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value ?? "";

  const user = await getServerUser();
  if (!user) redirect("/login");

  const projects = await getProjects(token);

  const stageColors: Record<string, string> = {
    CREATED: "bg-gray-100 text-gray-700",
    RESEARCHING: "bg-blue-100 text-blue-700",
    SOURCES_APPROVED: "bg-blue-100 text-blue-700",
    THESIS_DRAFTED: "bg-yellow-100 text-yellow-700",
    THESIS_APPROVED: "bg-yellow-100 text-yellow-700",
    OUTLINE_DRAFTED: "bg-orange-100 text-orange-700",
    OUTLINE_APPROVED: "bg-orange-100 text-orange-700",
    DRAFTING: "bg-purple-100 text-purple-700",
    REVISING: "bg-pink-100 text-pink-700",
    READY_TO_EXPORT: "bg-green-100 text-green-700",
    EXPORTED: "bg-green-100 text-green-700",
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back{user.name ? `, ${user.name}` : ""}!
              </h1>
              <p className="text-gray-500 mt-1">Your essay projects</p>
            </div>
            <Link
              href="/projects/new"
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              + New Essay
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-5xl mb-4">✍️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No essays yet</h2>
              <p className="text-gray-500 mb-6">
                Start your first AI-assisted essay project
              </p>
              <Link
                href="/projects/new"
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create your first essay
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {project.essayType.replace(/_/g, " ")} · {project.targetWordCount.toLocaleString()} words
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageColors[project.stage] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {project.stage.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

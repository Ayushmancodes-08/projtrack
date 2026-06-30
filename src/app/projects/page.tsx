"use client"

import { useEffect, useState, Suspense } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, FolderKanban, Code2, HardHat, CalendarCheck, Megaphone, FlaskConical, FolderOpen } from "lucide-react"
import { getTemplate } from "@/lib/templates"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useAppStore } from "@/store/app-store"
import { useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"

const iconMap: Record<string, React.ElementType> = {
  Code2, HardHat, CalendarCheck, Megaphone, FlaskConical, FolderKanban,
}

const healthColors: Record<string, string> = {
  ON_TRACK: "bg-green-100 text-green-700 border-green-200",
  AT_RISK: "bg-amber-100 text-amber-700 border-amber-200",
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
}

function ProjectsPageContent() {
  const { user } = useAuth()
  const { projects, tasks, initializeStore, isLoaded } = useAppStore()
  const searchParams = useSearchParams()

  // BUG-006 FIXED: Search state with real-time filtering
  const [query, setQuery] = useState(searchParams.get("q") || "")

  useEffect(() => {
    if (user) {
      initializeStore(user)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        <div className="relative w-72">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-card">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // BUG-006 FIXED: Filter projects by query
  const filteredProjects = query.trim()
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(query.trim().toLowerCase())
      )
    : projects

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} active in your workspace
            </p>
          </div>
          {!user?.isTeamMember && (
            <Link href="/projects/new">
              <Button className="bg-gradient-to-r from-navy to-navy-lighter text-xs font-semibold shadow-sm hover:shadow-md border-0 cursor-pointer">
                <Plus className="mr-1.5 h-4 w-4" />
                New Project
              </Button>
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <Card className="border-0 shadow-card bg-slate-50/50">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy/5">
                <FolderOpen className="h-6 w-6 text-navy/60" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-sm font-bold text-navy">No Projects Created</h3>
                <p className="text-xs text-muted-foreground">
                  {user?.isTeamMember 
                    ? "You haven't been assigned to any projects yet. Please contact your workspace administrator."
                    : "Get started by creating your first workspace project. Choose a template to pre-configure columns."
                  }
                </p>
              </div>
              {!user?.isTeamMember && (
                <Link href="/projects/new" className="pt-2">
                  <Button className="bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm border-0 cursor-pointer">
                    Create First Project
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* BUG-006 FIXED: Search input with value and onChange */}
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 rounded-lg border-gray-200 bg-white pl-9 text-xs shadow-card"
              />
            </div>

            {filteredProjects.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-center space-y-2">
                <p className="text-sm font-semibold text-navy">No projects match &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-muted-foreground">Try a different search term.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => {
                  const template = getTemplate(project.project_type)
                  const Icon = iconMap[template.icon] || FolderKanban
                  const projectTasks = tasks[project.id] || []

                  return (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <Card className="group cursor-pointer border-0 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/[0.04] transition-colors group-hover:bg-navy/[0.08]">
                              <Icon className="h-5 w-5 text-navy/70" />
                            </div>
                            <Badge variant="outline" className={cn("text-[10px] font-semibold tracking-wide px-2 py-0.5", healthColors[project.health_status])}>
                              {project.health_status === "ON_TRACK" ? "On Track" : project.health_status === "AT_RISK" ? "At Risk" : "Critical"}
                            </Badge>
                          </div>
                          <h3 className="mt-3.5 text-sm font-bold text-navy group-hover:text-gold-dark transition-colors">{project.name}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Workspace</span>
                            <span className="text-[10px] text-muted-foreground/50">&bull;</span>
                            <Badge variant="outline" className="text-[9px] font-medium text-muted-foreground/60 border-muted-foreground/15 px-1.5 py-0">
                              {template.label}
                            </Badge>
                          </div>
                          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-muted-foreground">
                            <span className="font-medium">{projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'}</span>
                            <span className="font-medium">Due {project.deadline}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-40" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <div className="relative w-72">
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-card">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-3.5 w-28" />
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppShell>
    }>
      <ProjectsPageContent />
    </Suspense>
  )
}


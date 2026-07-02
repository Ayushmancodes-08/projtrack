"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import {
  FolderKanban,
  AlertTriangle,
  CalendarCheck,
  DollarSign,
  FolderOpen
} from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-cards"
import { ProjectHealthCard } from "@/components/dashboard/project-health-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getTemplate } from "@/lib/templates"
import { useAppStore } from "@/store/app-store"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { user } = useAuth()
  const { projects, tasks, initializeStore, isLoaded } = useAppStore()

  useEffect(() => {
    if (user) {
      initializeStore(user)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (user && projects.length > 0) {
      const fetchCounts = async () => {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("project_members")
          .select("project_id")
        
        if (!error && data) {
          const counts: Record<string, number> = {}
          data.forEach((row: any) => {
            counts[row.project_id] = (counts[row.project_id] || 0) + 1
          })
          setMemberCounts(counts)
        }
      }
      fetchCounts()
    }
  }, [user, projects])

  if (!isLoaded) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-60" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-card">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-12" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-9 w-9 rounded-xl" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-card">
              <CardContent className="p-5 space-y-4">
                <Skeleton className="h-4 w-40" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-5 space-y-4">
                <Skeleton className="h-4 w-40" />
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    )
  }

  const allTypes = [...new Set(projects.map((p) => p.project_type))]
  
  // Calculate tasks only for active projects to guarantee deleted projects' tasks are not counted
  const totalTasks = projects.reduce((acc, project) => {
    const projectTasks = tasks[project.id] || []
    return acc + projectTasks.length
  }, 0)

  const totalBlockedTasks = projects.reduce((acc, project) => {
    const projectTasks = tasks[project.id] || []
    return acc + projectTasks.filter(
      (t) => t.status !== "done" && (t.blocked_reason || t.priority === "CRITICAL")
    ).length
  }, 0)

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Status Control Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time health overview across {projects.length} {projects.length === 1 ? 'project' : 'projects'} active in your workspace
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Active Projects"
            value={String(projects.length)}
            trend="neutral"
            trendLabel="Across all categories"
            icon={FolderKanban}
          />
          <KPICard
            title="Projects At Risk"
            value={String(projects.filter((p) => p.health_status !== "ON_TRACK").length)}
            trend="neutral"
            trendLabel="Requires attention"
            icon={AlertTriangle}
            accent="bg-gold/10"
          />
          <KPICard
            title="Total Workspace Tasks"
            value={String(totalTasks)}
            trend="neutral"
            trendLabel="Across all boards"
            icon={CalendarCheck}
            accent="bg-amber-50"
          />
          <KPICard
            title="Blocked Signals"
            value={String(totalBlockedTasks)}
            trend={totalBlockedTasks > 0 ? "up" : "neutral"}
            trendLabel={totalBlockedTasks > 0 ? "Needs PM review" : "All clear"}
            icon={DollarSign}
            accent="bg-green-50"
          />
        </div>

        {projects.length === 0 ? (
          <Card className="border-0 shadow-card bg-slate-50/50">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy/5">
                <FolderOpen className="h-6 w-6 text-navy/60" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-sm font-bold text-navy">Welcome to projectBeacon!</h3>
                <p className="text-xs text-muted-foreground">
                  Your workspace is currently empty. Create a new project to start tracking stages, visual signals, and team progress.
                </p>
              </div>
              <Link href="/projects/new" className="pt-2">
                <Button className="bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm">
                  Create Your First Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                Project Health
              </h2>
              <div className="h-3 w-px bg-border" />
              <div className="flex gap-1.5">
                {allTypes.map((type) => {
                  const template = getTemplate(type)
                  return (
                    <Badge
                      key={type}
                      variant="outline"
                      className="text-[9px] font-medium text-muted-foreground/70 border-muted-foreground/15 px-2 py-0"
                    >
                      {template.label}
                    </Badge>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project) => {
                const template = getTemplate(project.project_type)
                const statuses = project.status_config && project.status_config.length > 0
                  ? project.status_config
                  : template.defaultStatuses

                const projectTasks = tasks[project.id] || []
                const completedTasksCount = projectTasks.filter((t) => {
                  const taskStatus = statuses.find((s) => s.id === t.status)
                  return taskStatus?.category === "done" || t.status === "done" || t.status === "completed"
                }).length

                const progressVal = projectTasks.length > 0 
                  ? Math.round((completedTasksCount / projectTasks.length) * 100)
                  : 0

                return (
                  <div key={project.id}>
                    <Badge
                      variant="outline"
                      className="mb-2 ml-0.5 text-[9px] font-medium text-muted-foreground/60 border-muted-foreground/10 px-2 py-0"
                    >
                      {template.label}
                    </Badge>
                    <ProjectHealthCard 
                      id={project.id}
                      name={project.name}
                      healthStatus={project.health_status}
                      progress={progressVal}
                      deadline={project.deadline || ""}
                      memberCount={(memberCounts[project.id] || 0) + 1}
                    />
                  </div>
                )}
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}


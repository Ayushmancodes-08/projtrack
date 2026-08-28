"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Download, CheckCircle, AlertTriangle, DollarSign, FolderOpen } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export default function ReportsPage() {
  const { user } = useAuth()
  const { projects, tasks: storeTasks, initializeStore, isLoaded } = useAppStore()
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  useEffect(() => {
    if (user) {
      initializeStore(user)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Set default selected project when loaded
  useEffect(() => {
    if (isLoaded && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [isLoaded, projects, selectedProjectId])

  if (!isLoaded) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-60" />
            </div>
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </AppShell>
    )
  }

  if (projects.length === 0) {
    return (
      <AppShell>
        <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
          <FolderOpen className="h-10 w-10 text-muted-foreground/60" />
          <h2 className="text-sm font-semibold text-navy">No Projects Found</h2>
          <p className="text-xs text-muted-foreground">Create a project and add tasks to view reports.</p>
          <Link href="/projects/new">
            <Button className="bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm">
              Create First Project
            </Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  const project = projects.find((p) => p.id === selectedProjectId) || projects[0]
  const projectTasks = storeTasks[project.id] || []

  // Dynamic statistics calculations
  const totalTasks = projectTasks.length
  const completedTasks = projectTasks.filter((t) => t.status === "done" || t.status === "completed").length
  const inProgressTasks = projectTasks.filter((t) => t.status === "in_progress" || t.status === "review").length
  const blockedTasksList = projectTasks.filter((t) => t.blocked_reason || t.priority === "CRITICAL")
  const blockedTasksCount = blockedTasksList.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Group tasks by status category to show real workflow stages
  const statuses = project.status_config.length > 0 ? project.status_config : [
    { id: "todo", label: "To Do", category: "todo" },
    { id: "in_progress", label: "In Progress", category: "in_progress" },
    { id: "review", label: "Review", category: "review" },
    { id: "done", label: "Complete", category: "done" }
  ]

  const stageBreakdown = statuses.map((status) => {
    const statusTasks = projectTasks.filter((t) => t.status === status.id)
    const count = statusTasks.length
    const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
    return {
      phase: status.label,
      count,
      percentage,
      tasks: statusTasks,
    }
  })

  // Dynamic AI summary based on real metrics without artificial hours
  const aiSummary = `The "${project.name}" project is currently ${project.health_status.replace(/_/g, " ")}. Out of ${totalTasks} total tasks in the workspace, ${completedTasks} have been completed (${completionRate}% overall progress), and ${inProgressTasks} are currently in active execution. There are currently ${blockedTasksCount} active blocked or critical tasks requiring attention. ${
    project.health_status === "ON_TRACK"
      ? "Team velocity is consistent and the project is advancing steadily toward delivery."
      : "Immediate PM intervention is recommended to clear active blockers and maintain project velocity."
  }`

  const [activeSignalPopup, setActiveSignalPopup] = useState<string | null>(null)

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">Select Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-8 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold shadow-sm focus:outline-none focus:ring-1 focus:ring-gold"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2.5">
              <Badge className={cn(
                "text-[10px] font-semibold px-2 py-0.5",
                project.health_status === "ON_TRACK" ? "bg-green-500 text-white" : project.health_status === "AT_RISK" ? "bg-amber-500 text-white" : "bg-red-500 text-white"
              )}>
                {project.health_status.replace(/_/g, " ")}
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight text-navy">{project.name}</h1>
            </div>
            <p className="text-sm text-muted-foreground">Workspace performance &amp; metrics report</p>
          </div>
          <Button
            onClick={() => window.print()}
            className="bg-gradient-to-r from-navy to-navy-lighter text-xs font-semibold shadow-sm hover:shadow-md cursor-pointer"
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export PDF
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              id: "completion",
              icon: CheckCircle,
              iconBg: "bg-green-100",
              iconColor: "text-green-600",
              value: `${completionRate}%`,
              label: "Completion Rate",
              explanation: "Percentage of total workspace tasks that have reached the Completed / Done stage.",
            },
            {
              id: "inprogress",
              icon: FolderOpen,
              iconBg: "bg-amber-100",
              iconColor: "text-amber-600",
              value: String(inProgressTasks),
              label: "Tasks In Progress",
              explanation: "Number of active tasks currently being developed or under review by team members.",
            },
            {
              id: "completed",
              icon: CheckCircle,
              iconBg: "bg-blue-100",
              iconColor: "text-blue-600",
              value: String(completedTasks),
              label: "Tasks Completed",
              explanation: "Total number of tasks verified and marked done across this project.",
            },
            {
              id: "blockers",
              icon: AlertTriangle,
              iconBg: "bg-red-100",
              iconColor: "text-red-600",
              value: String(blockedTasksCount),
              label: "Active Blockers",
              explanation: "Tasks flagged with blockers or critical priority impediments requiring immediate PM unblocking action.",
              isBlocked: blockedTasksCount > 0,
            },
          ].map((stat) => (
            <div key={stat.id} className="relative">
              <Card
                onMouseEnter={() => setActiveSignalPopup(stat.id)}
                onMouseLeave={() => setActiveSignalPopup(null)}
                onClick={() => setActiveSignalPopup(activeSignalPopup === stat.id ? null : stat.id)}
                className={cn(
                  "border-0 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer relative group",
                  stat.isBlocked && "ring-1 ring-red-200 bg-red-50/15"
                )}
              >
                {stat.isBlocked && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white" />
                  </span>
                )}
                <CardContent className="p-5 text-center">
                  <div className={cn("mx-auto flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110", stat.iconBg)}>
                    <stat.icon className={cn("h-4.5 w-4.5", stat.iconColor)} />
                  </div>
                  <p className="mt-2.5 text-2xl font-bold tracking-tight text-navy">{stat.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{stat.label}</p>
                  <p className="mt-1 text-[9px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    Hover for reason
                  </p>
                </CardContent>
              </Card>

              {/* Animated Reason Card on Hover/Click */}
              {activeSignalPopup === stat.id && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl animate-in fade-in-0 zoom-in-95">
                  <p className="text-xs font-bold text-navy">{stat.label} Breakdown</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{stat.explanation}</p>
                  {stat.id === "blockers" && blockedTasksList.length > 0 && (
                    <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-red-600">Blocked Tasks:</span>
                      {blockedTasksList.map((bt) => (
                        <div key={bt.id} className="rounded bg-red-50 p-1.5 text-[10px] border border-red-100">
                          <p className="font-semibold text-red-900 truncate">{bt.title}</p>
                          <p className="text-[9px] text-red-600">Reason: {bt.blocked_reason || "Critical priority blocker"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Workflow Stage Progress & Task Distribution (Clean, No fake Est hours) */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Workflow Stage Distribution
              </h3>
              <span className="text-xs text-muted-foreground font-medium">
                {totalTasks} total tasks across {stageBreakdown.length} stages
              </span>
            </div>

            {totalTasks === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No tasks inside this project yet.</p>
            ) : (
              <div className="space-y-4">
                {stageBreakdown.map((stage) => {
                  return (
                    <div key={stage.phase}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-navy">{stage.phase}</span>
                        <span className="text-muted-foreground font-medium text-xs">
                          {stage.count} {stage.count === 1 ? "task" : "tasks"}
                          <span className="ml-2 font-semibold text-navy/70">({stage.percentage}%)</span>
                        </span>
                      </div>
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-navy to-gold transition-all duration-500"
                          style={{ width: `${stage.percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="border-l-4 border-gold pl-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-3">
                AI-Generated Executive Summary
              </h3>
              <p className="text-sm leading-relaxed text-navy/80">
                {aiSummary}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

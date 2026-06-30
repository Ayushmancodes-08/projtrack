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
  const completedTasks = projectTasks.filter((t) => t.status === "done").length
  const blockedTasks = projectTasks.filter((t) => t.blocked_reason || t.priority === "CRITICAL").length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Estimate vs Actual hours calculations
  // Group tasks by status category to show phases
  const statuses = project.status_config.length > 0 ? project.status_config : [
    { id: "todo", label: "To Do", category: "todo" },
    { id: "in_progress", label: "In Progress", category: "in_progress" },
    { id: "review", label: "Review", category: "review" },
    { id: "done", label: "Complete", category: "done" }
  ]

  const phases = statuses.map((status) => {
    const statusTasks = projectTasks.filter((t) => t.status === status.id)
    const estimated = statusTasks.reduce((sum, t) => sum + (t.estimated_hours || 4), 0)
    const actual = statusTasks.reduce((sum, t) => {
      if (t.status === "done") {
        return sum + (t.actual_hours || t.estimated_hours || 4)
      }
      return sum + (t.actual_hours || 0)
    }, 0)

    return {
      phase: status.label,
      estimated,
      actual,
    }
  })

  const totalEstimated = phases.reduce((sum, p) => sum + p.estimated, 0)
  const totalActual = phases.reduce((sum, p) => sum + p.actual, 0)
  const variance = totalEstimated > 0 ? Math.round(((totalActual - totalEstimated) / totalEstimated) * 100) : 0

  // Dynamic AI summary based on real metrics
  const aiSummary = `The "${project.name}" project is currently ${project.health_status.replace(/_/g, " ")}. Out of ${totalTasks} total tasks in the workspace, ${completedTasks} have been successfully completed (${completionRate}% progress). There are currently ${blockedTasks} active blocked tasks or critical impediments requiring PM review. Total estimated effort is ${totalEstimated} hours compared to ${totalActual} actual hours spent so far, resulting in a ${variance >= 0 ? "+" : ""}${variance}% variance. ${
    project.health_status === "ON_TRACK"
      ? "Team velocity is consistent and the project remains on track for the target deadline."
      : "Immediate attention is required to unblock critical tasks and restore project health."
  }`

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
            className="bg-gradient-to-r from-navy to-navy-lighter text-xs font-semibold shadow-sm hover:shadow-md"
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export PDF
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CheckCircle, iconBg: "bg-green-100", iconColor: "text-green-600", value: `${completionRate}%`, label: "Completion Rate" },
            { icon: DollarSign, iconBg: "bg-amber-100", iconColor: "text-amber-600", value: `${variance >= 0 ? "+" : ""}${variance}%`, label: "Effort Variance" },
            { icon: CheckCircle, iconBg: "bg-blue-100", iconColor: "text-blue-600", value: String(completedTasks), label: "Tasks Completed" },
            { icon: AlertTriangle, iconBg: "bg-gold/10", iconColor: "text-gold-dark", value: String(blockedTasks), label: "Active Blockers" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-card transition-all hover:shadow-card-hover">
              <CardContent className="p-5 text-center">
                <div className={cn("mx-auto flex h-9 w-9 items-center justify-center rounded-xl", stat.iconBg)}>
                  <stat.icon className={cn("h-4.5 w-4.5", stat.iconColor)} />
                </div>
                <p className="mt-2.5 text-2xl font-bold tracking-tight text-navy">{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-5">
              Estimated vs Actual Hours (by Stage)
            </h3>
            {totalTasks === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No tasks inside this project to estimate hours.</p>
            ) : (
              <div className="space-y-4">
                {phases.map((phase) => {
                  const maxHours = Math.max(totalEstimated, totalActual, 10)
                  return (
                    <div key={phase.phase}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-navy">{phase.phase}</span>
                        <span className="text-muted-foreground/70">
                          Est: {phase.estimated}h &middot; Act: {phase.actual}h
                          <span className={cn(
                            "ml-2 font-semibold",
                            phase.actual <= phase.estimated ? "text-green-600" : "text-gold-dark"
                          )}>
                            ({phase.actual > phase.estimated ? "+" : ""}{phase.actual - phase.estimated}h)
                          </span>
                        </span>
                      </div>
                      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-l-full bg-navy/20 transition-all" style={{ width: `${(phase.estimated / maxHours) * 100}%` }} />
                        <div className={cn(
                          "h-full rounded-r-full transition-all",
                          phase.actual <= phase.estimated ? "bg-green-500" : "bg-gold-dark"
                        )} style={{ width: `${(phase.actual / maxHours) * 100}%` }} />
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
                AI-Generated Summary
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

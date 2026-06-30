"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Plus, Building2, FolderKanban, ArrowUpRight, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useAppStore } from "@/store/app-store"
import { Skeleton } from "@/components/ui/skeleton"
import type { ProjectType } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

const portfolioMeta: Record<ProjectType, { name: string; description: string; color: string }> = {
  SOFTWARE: { name: "Engineering & IT", description: "Software development, infrastructure, and tech platform projects", color: "blue" },
  MARKETING: { name: "Marketing & Growth", description: "Brand campaigns, product launches, content, and customer acquisition", color: "purple" },
  CONSTRUCTION: { name: "Construction & Facilities", description: "Physical builds, renovations, site surveys, and structural work", color: "amber" },
  EVENT: { name: "Events & Operations", description: "Corporate conferences, meetups, webinars, and logistics planning", color: "teal" },
  RESEARCH: { name: "Research & Development", description: "Academic research, data studies, prototypes, and testing", color: "indigo" },
  GENERAL: { name: "General Operations", description: "Internal process improvements, admin tasks, and miscellaneous work", color: "slate" },
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  amber: "bg-amber-50 text-amber-700",
  teal: "bg-teal-50 text-teal-700",
  indigo: "bg-indigo-50 text-indigo-700",
  slate: "bg-slate-50 text-slate-700",
}

const iconColorMap: Record<string, string> = {
  blue: "text-blue-600",
  purple: "text-purple-600",
  amber: "text-amber-600",
  teal: "text-teal-600",
  indigo: "text-indigo-600",
  slate: "text-slate-600",
}

export default function PortfoliosPage() {
  const { user } = useAuth()
  const { projects, tasks, initializeStore, isLoaded } = useAppStore()

  useEffect(() => {
    if (user) {
      initializeStore(user)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (!isLoaded) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-card">
                <CardContent className="p-5 space-y-4">
                  <div className="flex gap-3">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3.5 w-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppShell>
    )
  }

  // Dynamically group projects by template types
  const portfolios = Object.keys(portfolioMeta).map((typeKey) => {
    const type = typeKey as ProjectType
    const meta = portfolioMeta[type]
    const typeProjects = projects.filter((p) => p.project_type === type)
    
    // Count stats
    const projectCount = typeProjects.length
    const atRisk = typeProjects.filter((p) => p.health_status !== "ON_TRACK").length

    // Completion percentage across all tasks in these projects
    let totalTypeTasks = 0
    let completedTypeTasks = 0
    typeProjects.forEach((p) => {
      const projTasks = tasks[p.id] || []
      totalTypeTasks += projTasks.length
      completedTypeTasks += projTasks.filter((t) => t.status === "done").length
    })
    const progress = totalTypeTasks > 0 ? Math.round((completedTypeTasks / totalTypeTasks) * 100) : 0

    return {
      id: type.toLowerCase(),
      type,
      name: meta.name,
      description: meta.description,
      color: meta.color,
      projectCount,
      atRisk,
      progress,
    }
  }).filter((p) => p.projectCount > 0) // Only show portfolios that contain active projects

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Portfolios</h1>
            <p className="mt-1 text-sm text-muted-foreground">Group and track projects by department or initiative</p>
          </div>
          <Button
            onClick={() => toast.info("Create a new project with a different template to generate a new portfolio category!")}
            className="bg-gradient-to-r from-navy to-navy-lighter text-xs font-semibold shadow-sm hover:shadow-md"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Portfolio
          </Button>
        </div>

        {portfolios.length === 0 ? (
          <Card className="border-0 shadow-card bg-slate-50/50">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy/5">
                <Building2 className="h-6 w-6 text-navy/60" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-sm font-bold text-navy">No Portfolios Yet</h3>
                <p className="text-xs text-muted-foreground">
                  Portfolios are dynamically generated when you create projects under different template categories.
                </p>
              </div>
              <Link href="/projects/new" className="pt-2">
                <Button className="bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm">
                  Create a Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {portfolios.map((portfolio) => (
              <Card key={portfolio.id} className="group border-0 shadow-card transition-all duration-200 hover:shadow-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", colorMap[portfolio.color] || "bg-gray-50")}>
                        <Building2 className={cn("h-5 w-5", iconColorMap[portfolio.color] || "text-gray-600")} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-navy">{portfolio.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{portfolio.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {[
                      { label: "Projects", value: portfolio.projectCount, color: "text-navy" },
                      { label: "At Risk", value: portfolio.atRisk, color: portfolio.atRisk > 0 ? "text-gold-dark animate-pulse" : "text-slate-500" },
                      { label: "Completion", value: `${portfolio.progress}%`, color: "text-navy" },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        portfolio.progress > 80 ? "bg-green-500" : portfolio.progress > 40 ? "bg-gold" : "bg-gold-dark"
                      )}
                      style={{ width: `${portfolio.progress}%` }}
                    />
                  </div>

                  <Link
                    href={`/projects`}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-gray-50 hover:text-navy"
                  >
                    <FolderKanban className="h-3.5 w-3.5" />
                    View Projects
                    <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

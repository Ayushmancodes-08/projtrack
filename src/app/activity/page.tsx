"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Filter, AlertCircle } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { useAuth } from "@/lib/auth-context"

// BUG-010 FIXED: Build activity from actual store data (tasks created)
// Note: Deep real-time activity logging requires Supabase triggers.
// This version shows a live feed derived from the store's task state.

type ActivityItem = {
  id: string
  actor: string
  initials: string
  action: string
  target: string
  time: string
  type: string
  to?: string
  reason?: string
}

const typeConfig: Record<string, { dot: string; bg: string; label: string }> = {
  status: { dot: "bg-gold", bg: "bg-gold/5", label: "Status Change" },
  comment: { dot: "bg-navy", bg: "bg-navy/5", label: "Comment" },
  blocker: { dot: "bg-gold", bg: "bg-gold/5", label: "Blocker" },
  completion: { dot: "bg-green-500", bg: "bg-green-50", label: "Completion" },
  assignment: { dot: "bg-gold", bg: "bg-gold/5", label: "Assignment" },
  health: { dot: "bg-gold", bg: "bg-gold/5", label: "Health Change" },
  creation: { dot: "bg-navy", bg: "bg-navy/5", label: "Creation" },
}

const filterTabs = ["All Activity", "Blockers", "Completions"] as const
type FilterTab = typeof filterTabs[number]

export default function ActivityFeedPage() {
  const { tasks: storeTasks, projects } = useAppStore()
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All Activity")
  
  const { user } = useAuth()
  const isAdmin = user ? !user.isTeamMember : false
  const userRole = isAdmin ? "Program Manager" : "Team Member"
  const selfInitials = user?.fullName 
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "YO"

  // BUG-010 FIXED: Derive activity items from real store data
  const storeActivities: ActivityItem[] = []

  projects.forEach((project) => {
    const projectTasks = storeTasks[project.id] || []
    projectTasks.forEach((task) => {
      // Determine actor and initials dynamically
      const isSelf = !task.assignee_id || task.assignee_id === selfInitials
      const actorName = isSelf 
        ? `${userRole} (You)` 
        : (task.assignee_id === "PM" ? "Program Manager" : `Team Member (${task.assignee_id})`)
      const initials = isSelf ? selfInitials : (task.assignee_id || "TM")

      // Task creation events
      storeActivities.push({
        id: `create-${task.id}`,
        actor: actorName,
        initials: initials,
        action: "created task",
        target: task.title,
        time: new Date(task.created_at).toLocaleString(),
        type: "creation",
      })

      // Blocked events
      if (task.blocked_reason) {
        storeActivities.push({
          id: `blocked-${task.id}`,
          actor: actorName,
          initials: initials,
          action: "blocked",
          target: task.title,
          reason: task.blocked_reason,
          time: new Date(task.updated_at).toLocaleString(),
          type: "blocker",
        })
      }

      // Completion events
      if (task.status === "done") {
        storeActivities.push({
          id: `done-${task.id}`,
          actor: actorName,
          initials: initials,
          action: "completed",
          target: task.title,
          time: new Date(task.updated_at).toLocaleString(),
          type: "completion",
      })
      }
    })
  })

  // Sort by most recent
  storeActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  // BUG-010 FIXED: Filter tabs actually filter by type
  const filtered =
    activeFilter === "All Activity"
      ? storeActivities
      : activeFilter === "Blockers"
      ? storeActivities.filter((a) => a.type === "blocker")
      : storeActivities.filter((a) => a.type === "completion")

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Activity Feed</h1>
            <p className="mt-1 text-sm text-muted-foreground">Real-time log of all project activity across your organization</p>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-gray-50 hover:text-navy">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>

        {/* Demo notice */}
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Activity is derived from your current projects and tasks. Full real-time event streaming requires Supabase triggers.
        </div>

        {/* BUG-010 FIXED: Filter tabs are now functional */}
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          {filterTabs.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                activeFilter === filter
                  ? "bg-navy text-white shadow-sm"
                  : "bg-gray-100/80 text-muted-foreground hover:bg-gray-200/80 hover:text-navy"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-center space-y-2">
            <p className="text-sm font-semibold text-navy">No activity yet</p>
            <p className="text-xs text-muted-foreground">
              Create projects and tasks to see activity here.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((activity, i) => {
              const config = typeConfig[activity.type] || typeConfig.status
              return (
                <div
                  key={activity.id}
                  className={cn(
                    "relative flex items-start gap-4 rounded-xl px-4 py-3.5 transition-all hover:bg-gray-50/80",
                    config.bg
                  )}
                >
                  {i < filtered.length - 1 && (
                    <div className="absolute left-[26px] top-[52px] h-full w-px bg-gray-200/60" />
                  )}
                  <Avatar className="h-9 w-9 shrink-0 ring-2 ring-white shadow-sm">
                    <AvatarFallback className="text-[10px] font-bold text-white bg-gradient-to-br from-navy to-navy-lighter">
                      {activity.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-navy">{activity.actor}</span>
                      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
                      <span className="text-[10px] font-medium text-muted-foreground">{activity.time}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {activity.action} <span className="font-medium text-navy">"{activity.target}"</span>
                      {activity.to && <> to <span className="font-medium text-navy">"{activity.to}"</span></>}
                      {activity.reason && <span className="text-muted-foreground/70"> &mdash; {activity.reason}</span>}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    {config.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

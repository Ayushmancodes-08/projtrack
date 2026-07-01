"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Filter, AlertCircle } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

// Live activity feed loaded from Supabase activity_logs table.

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
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All Activity")
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const { user } = useAuth()

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
        
        if (!error && data) {
          const mapped: ActivityItem[] = data.map((log) => {
            const isSelf = log.actor_email === user?.email
            const actorName = isSelf ? `${log.actor_name} (You)` : log.actor_name
            const initials = (log.actor_name || "System").slice(0, 2).toUpperCase()
            
            let actionText = ""
            let activityType = "status"
            
            if (log.action === "project_created") {
              actionText = "created project"
              activityType = "creation"
            } else if (log.action === "task_created") {
              actionText = "created task"
              activityType = "creation"
            } else if (log.action === "status_changed") {
              actionText = `moved task to "${log.new_value}"`
              activityType = log.new_value?.toLowerCase() === "completed" || log.new_value?.toLowerCase() === "done" ? "completion" : "status"
            } else if (log.action === "task_updated") {
              actionText = "updated task"
              activityType = "status"
            } else if (log.action === "task_deleted") {
              actionText = "deleted task"
              activityType = "status"
            } else {
              actionText = log.action || "performed action"
            }

            return {
              id: log.id,
              actor: actorName,
              initials: initials,
              action: actionText,
              target: log.details || "",
              time: new Date(log.created_at).toLocaleString(),
              type: activityType,
              to: log.new_value || undefined
            }
          })
          setActivities(mapped)
        }
      } catch (e) {
        console.error("Failed to fetch activity logs", e)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (user) {
      fetchLogs()

      const supabase = createClient()
      const channel = supabase
        .channel("activity-logs-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "activity_logs" },
          (payload) => {
            const log = payload.new
            const isSelf = log.actor_email === user?.email
            const actorName = isSelf ? `${log.actor_name} (You)` : log.actor_name
            const initials = (log.actor_name || "System").slice(0, 2).toUpperCase()
            
            let actionText = ""
            let activityType = "status"
            
            if (log.action === "project_created") {
              actionText = "created project"
              activityType = "creation"
            } else if (log.action === "task_created") {
              actionText = "created task"
              activityType = "creation"
            } else if (log.action === "status_changed") {
              actionText = `moved task to "${log.new_value}"`
              activityType = log.new_value?.toLowerCase() === "completed" || log.new_value?.toLowerCase() === "done" ? "completion" : "status"
            } else if (log.action === "task_updated") {
              actionText = "updated task"
              activityType = "status"
            } else if (log.action === "task_deleted") {
              actionText = "deleted task"
              activityType = "status"
            } else {
              actionText = log.action || "performed action"
            }

            const newItem: ActivityItem = {
              id: log.id,
              actor: actorName,
              initials: initials,
              action: actionText,
              target: log.details || "",
              time: new Date(log.created_at).toLocaleString(),
              type: activityType,
              to: log.new_value || undefined
            }

            setActivities((prev) => [newItem, ...prev])
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      </AppShell>
    )
  }

  // Filter tabs
  const filtered =
    activeFilter === "All Activity"
      ? activities
      : activeFilter === "Blockers"
      ? activities.filter((a) => a.type === "blocker")
      : activities.filter((a) => a.type === "completion")

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

        {/* Filter tabs */}
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

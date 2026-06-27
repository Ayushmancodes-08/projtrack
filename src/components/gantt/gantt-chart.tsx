"use client"

import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"
import { useAppStore } from "@/store/app-store"

type GanttChartProps = {
  // BUG-008 FIXED: Accept projectId to load real tasks from store
  projectId: string
}

const dayWidth = 44

export function GanttChart({ projectId }: GanttChartProps) {
  const { tasks: storeTasks, projects } = useAppStore()

  // BUG-008 FIXED: Use actual project tasks instead of hardcoded milestones
  const projectTasks = storeTasks[projectId] || []
  const project = projects.find((p) => p.id === projectId)

  if (projectTasks.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-gray-200/80 bg-white shadow-card text-center space-y-2">
        <p className="text-sm font-semibold text-navy">No tasks to display</p>
        <p className="text-xs text-muted-foreground">
          Add tasks using the &ldquo;Add Task&rdquo; button to see them on the Gantt chart.
        </p>
      </div>
    )
  }

  // Group tasks by status to act as "phases"
  const statusGroups = projectTasks.reduce<Record<string, typeof projectTasks>>((acc, task) => {
    const key = task.status || "todo"
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {})

  // Build flat list with derived start/duration based on sort_order and creation order
  const allTaskRows = projectTasks.map((task, i) => ({
    id: task.id,
    name: task.title,
    startDay: i * 2,
    duration: task.estimated_hours ? Math.max(1, Math.ceil(task.estimated_hours / 8)) : 3,
    critical: task.is_critical_path || task.priority === "CRITICAL",
    assignee: task.assignee_id || "—",
    status: task.status,
  }))

  const totalDays = Math.max(20, allTaskRows.reduce((max, t) => Math.max(max, t.startDay + t.duration), 0) + 2)

  return (
    <div className="space-y-3">
      {/* Demo notice — Gantt doesn't have real timeline data yet */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-700 font-medium">
        ℹ️ Gantt timeline is approximated from task order. Real start/end dates require milestone tracking (coming soon).
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-card">
        <div className="flex">
          <div className="w-60 shrink-0 border-r border-gray-100">
            <div className="flex h-11 items-center border-b border-gray-100 bg-gray-50/80 px-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Task {project ? `— ${project.name}` : ""}
              </span>
            </div>
            {allTaskRows.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "flex h-10 items-center gap-2.5 border-b border-gray-50 px-4 text-xs transition-colors",
                  task.critical && "bg-gold/[0.05]"
                )}
              >
                {task.critical ? (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-gold-dark" />
                ) : (
                  <div className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className={cn("truncate", task.critical && "font-semibold text-gold-dark")}>
                  {task.name}
                </span>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-x-auto">
            <div className="flex h-11 border-b border-gray-100 bg-gray-50/80" style={{ width: totalDays * dayWidth }}>
              {Array.from({ length: totalDays }, (_, i) => (
                <div
                  key={i}
                  className="flex shrink-0 items-center justify-center border-r border-gray-100 text-[10px] font-medium text-muted-foreground/60"
                  style={{ width: dayWidth }}
                >
                  D{i + 1}
                </div>
              ))}
            </div>
            {allTaskRows.map((task) => {
              const left = task.startDay * dayWidth
              const width = task.duration * dayWidth
              return (
                <div
                  key={task.id}
                  className="relative h-10 border-b border-gray-50"
                  style={{ width: totalDays * dayWidth }}
                >
                  <div
                    className={cn(
                      "absolute top-1/2 h-6 -translate-y-1/2 rounded-md px-2.5 text-[10px] font-semibold leading-6 text-white transition-all duration-150 hover:opacity-90 hover:scale-y-110 cursor-pointer shadow-sm",
                      task.critical
                        ? "bg-gradient-to-r from-gold to-gold-dark text-navy"
                        : "bg-gradient-to-r from-navy to-navy-lighter"
                    )}
                    style={{ left, width: Math.max(width - 4, 30) }}
                    title={`${task.name} — ${task.assignee}`}
                  >
                    <span className="opacity-90 truncate block">{task.assignee}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-gradient-to-r from-gold to-gold-dark" />
          Critical path task
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-gradient-to-r from-navy to-navy-lighter" />
          Standard task
        </span>
      </div>
    </div>
  )
}

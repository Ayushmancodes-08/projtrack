"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HEALTH_STATUSES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { getTemplate } from "@/lib/templates"
import type { StatusConfig, Priority } from "@/lib/types"
import {
  Calendar,
  DollarSign,
  Users,
  Plus,
  BarChart3,
  Columns3,
  Table2,
  AlertTriangle,
  FolderOpen
} from "lucide-react"
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { GanttChart } from "@/components/gantt/gantt-chart"
import { SpreadsheetView } from "@/components/spreadsheet/spreadsheet-view"
import Link from "next/link"
import { useAppStore } from "@/store/app-store"
import { useUser, useOrganization } from "@clerk/nextjs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

const viewIcons: Record<string, React.ElementType> = { kanban: Columns3, gantt: BarChart3, spreadsheet: Table2 }

import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const { projects, tasks: storeTasks, initializeStore, addTask, updateTaskStatus, isLoaded, addNotification } = useAppStore()
  const { user: clerkUser } = useUser()
  const { organization: clerkOrg, membership, memberships } = useOrganization()

  const isAdmin = !clerkOrg || membership?.role === "org:admin"
  const userName = clerkUser?.fullName || clerkUser?.primaryEmailAddress?.emailAddress || "Team Member"

  const [view, setView] = useState<"kanban" | "gantt" | "spreadsheet">("kanban")
  
  // Task Creation Dialog State
  const [isTaskOpen, setIsTaskOpen] = useState(false)
  // BUG-024: Track the pre-selected status when clicking a column's "+" button
  const [defaultStatus, setDefaultStatus] = useState<string>("todo")
  const [taskTitle, setTaskTitle] = useState("")
  const [taskPriority, setTaskPriority] = useState<Priority>("MEDIUM")
  const [taskAssignee, setTaskAssignee] = useState("")
  const [taskDueDate, setTaskDueDate] = useState("")
  const [taskBlocked, setTaskBlocked] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)

  useEffect(() => {
    initializeStore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const project = projects.find((p) => p.id === projectId)
  
  if (!isLoaded) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <Skeleton className="h-8 w-60" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <div className="flex flex-wrap items-center gap-5 pt-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg p-1 bg-gray-100/40 w-80">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-md" />
            ))}
          </div>

          <div className="flex gap-5 overflow-x-auto pb-6">
            {Array.from({ length: 3 }).map((_, colIdx) => (
              <div key={colIdx} className="flex w-72 shrink-0 flex-col rounded-2xl border border-slate-100 bg-slate-50/50 p-3 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-5 rounded-md" />
                </div>
                {Array.from({ length: 2 }).map((_, cardIdx) => (
                  <div key={cardIdx} className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-3 shadow-xs">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-12 rounded" />
                      <Skeleton className="h-4 w-16 rounded" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-3.5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    )
  }

  if (!project) {
    return (
      <AppShell>
        <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
          <FolderOpen className="h-10 w-10 text-muted-foreground/60" />
          <h2 className="text-sm font-semibold text-navy">Project Not Found</h2>
          <Link href="/projects">
            <Button variant="outline" className="text-xs">Back to Projects</Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  const template = getTemplate(project.project_type)
  const health = HEALTH_STATUSES.find((h) => h.value === project.health_status) || HEALTH_STATUSES[0]
  const projectTasks = storeTasks[project.id] || []
  const statuses: StatusConfig[] = project.status_config.length > 0 ? project.status_config : template.defaultStatuses

  // Map of active organization members for the assignee select list
  const teamMembers = memberships?.data?.map((m) => {
    const pd = m.publicUserData
    const name = pd?.firstName 
      ? `${pd.firstName} ${pd.lastName?.[0] || ""}`.trim()
      : pd?.identifier || ""
    const initials = pd?.firstName 
      ? `${pd.firstName[0]}${pd.lastName?.[0] || ""}`.toUpperCase()
      : pd?.identifier?.slice(0, 2).toUpperCase() || ""
    return { id: initials, name }
  }) || []

  // Group tasks by status for the Kanban board view
  const tasksByStatus: Record<string, { id: string; title: string; priority?: string; assignee?: string; dueDate?: string; comments: number; attachments: number; blocked: boolean }[]> = {}
  statuses.forEach((s) => {
    tasksByStatus[s.id] = []
  })
  projectTasks.forEach((t) => {
    const statusId = t.status || "todo"
    if (!tasksByStatus[statusId]) {
      tasksByStatus[statusId] = []
    }
    tasksByStatus[statusId].push({
      id: t.id,
      title: t.title,
      priority: t.priority,
      assignee: t.assignee_id || "",
      dueDate: t.due_date || "",
      comments: 0,
      attachments: 0,
      blocked: !!t.blocked_reason
    })
  })

  // BUG-024: Open the Add Task dialog pre-filtered with the clicked column's status
  const handleAddTaskForStatus = (statusId: string) => {
    setDefaultStatus(statusId)
    setIsTaskOpen(true)
  }

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) {
      toast.error("Please enter a task title")
      return
    }

    try {
      setIsCreatingTask(true)
      await addTask(
        project.id,
        taskTitle,
        taskPriority,
        taskAssignee,
        taskDueDate ? new Date(taskDueDate).toLocaleDateString() : "",
        taskBlocked,
        defaultStatus
      )
      toast.success("Task added to Kanban Board!")
      setIsTaskOpen(false)
      setTaskTitle("")
      setTaskPriority("MEDIUM")
      setTaskAssignee("")
      setTaskDueDate("")
      setTaskBlocked(false)
      setDefaultStatus("todo")
    } catch {
      toast.error("Failed to add task")
    } finally {
      setIsCreatingTask(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-navy">{project.name}</h1>
              <Badge variant="outline" className={cn("text-[10px] font-semibold tracking-wide px-2 py-0.5", health.color)}>
                {health.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-semibold tracking-wide text-navy/60 border-navy/15 px-2 py-0.5">
                {template.label}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Workspace Project</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Due {project.deadline}</span>
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{teamMembers.length} team members</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* BUG-023 FIXED: Removed broken link to non-existent /projects/{id}/settings */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-gray-200 text-xs"
              onClick={() => router.push("/settings")}
            >
              Configure
            </Button>
            <Button 
              size="sm" 
              onClick={() => { setDefaultStatus("todo"); setIsTaskOpen(true) }}
              className="h-8 bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm cursor-pointer hover:brightness-105"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Task
            </Button>
          </div>
        </div>

        <div className="inline-flex items-center rounded-lg bg-gray-100/80 p-1 shadow-sm">
          {(["kanban", "gantt", "spreadsheet"] as const).map((v) => {
            const Icon = viewIcons[v]
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-all duration-150",
                  view === v
                    ? "bg-white text-navy shadow-sm"
                    : "text-muted-foreground/70 hover:text-navy/80"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            )
          })}
        </div>

        {view === "kanban" && (
          <KanbanBoard 
            statuses={statuses} 
            tasks={tasksByStatus}
            projectId={projectId}
            updateTaskStatus={updateTaskStatus}
            onTaskClick={() => {
              // Optionally handle detail drawer
            }}
            onAddTask={handleAddTaskForStatus}
            isAdmin={isAdmin}
            userName={userName}
            addNotification={addNotification}
          />
        )}
        {/* BUG-008 FIXED: Pass projectId to GanttChart */}
        {view === "gantt" && <GanttChart projectId={projectId} />}
        {/* BUG-007 FIXED: Pass projectId to SpreadsheetView */}
        {view === "spreadsheet" && <SpreadsheetView projectId={projectId} />}
      </div>

      {/* Add Task Modal */}
      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden shadow-2xl rounded-2xl bg-white">
          <form onSubmit={handleCreateTaskSubmit}>
            <div className="p-6 pb-4">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-lg font-bold text-navy">Add Workspace Task</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/80">Task Title</Label>
                  <Input
                    placeholder="e.g. Implement user dashboard widgets"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                    // BUG-030 FIXED: Disable fields while submitting
                    disabled={isCreatingTask}
                    className="h-9 text-sm border-gray-200 focus-visible:ring-gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-navy/80">Priority</Label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as Priority)}
                      disabled={isCreatingTask}
                      className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:border-gold/50 focus:outline-none disabled:opacity-50"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-navy/80">Column</Label>
                    <select
                      value={defaultStatus}
                      onChange={(e) => setDefaultStatus(e.target.value)}
                      disabled={isCreatingTask}
                      className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:border-gold/50 focus:outline-none disabled:opacity-50"
                    >
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-navy/80">Assignee</Label>
                    <select
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      disabled={isCreatingTask}
                      className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:border-gold/50 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-navy/80">Due Date</Label>
                    <Input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      disabled={isCreatingTask}
                      min={new Date().toISOString().split("T")[0]}
                      className="h-9 text-sm border-gray-200 focus-visible:ring-gold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/80">Visual Signal / Impediment</Label>
                  <div className="flex items-center gap-2 h-9">
                    <input
                      type="checkbox"
                      id="blocked"
                      checked={taskBlocked}
                      onChange={(e) => setTaskBlocked(e.target.checked)}
                      disabled={isCreatingTask}
                      className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
                    />
                    <label htmlFor="blocked" className="text-xs font-medium text-navy/80 flex items-center gap-1 cursor-pointer">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      Mark as Blocked
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex sm:flex-row justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsTaskOpen(false)}
                disabled={isCreatingTask}
                className="text-xs hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingTask}
                className="bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm"
              >
                {isCreatingTask ? "Adding..." : "Add Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

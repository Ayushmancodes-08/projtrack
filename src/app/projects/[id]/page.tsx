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
import type { StatusConfig, Priority, HealthStatus } from "@/lib/types"
import {
  Calendar,
  DollarSign,
  Users,
  Plus,
  BarChart3,
  Columns3,
  Table2,
  AlertTriangle,
  FolderOpen,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check
} from "lucide-react"
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { GanttChart } from "@/components/gantt/gantt-chart"
import { SpreadsheetView } from "@/components/spreadsheet/spreadsheet-view"
import Link from "next/link"
import { useAppStore } from "@/store/app-store"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useSocketRealtime } from "@/lib/use-socket-realtime"

const viewIcons: Record<string, React.ElementType> = { kanban: Columns3, gantt: BarChart3, spreadsheet: Table2 }

import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const { projects, tasks: storeTasks, initializeStore, addTask, updateTaskStatus, isLoaded, addNotification, deleteProject, updateTask, deleteTask } = useAppStore()
  const { user } = useAuth()
  
  const isAdmin = user ? !user.isTeamMember : false
  const userName = user?.fullName || user?.email || "Team Member"

  // Socket.io real-time hook — keeps all open boards in sync
  const { emitTaskStatusUpdate, emitTaskCreated, emitTaskDeleted } = useSocketRealtime({
    projectId,
    userName,
  })

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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Task Editing Dialog State
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [editTaskTitle, setEditTaskTitle] = useState("")
  const [editTaskPriority, setEditTaskPriority] = useState<Priority>("MEDIUM")
  const [editTaskAssignee, setEditTaskAssignee] = useState("")
  const [editTaskDueDate, setEditTaskDueDate] = useState("")
  const [editTaskBlocked, setEditTaskBlocked] = useState(false)
  const [editTaskStatus, setEditTaskStatus] = useState("todo")
  const [isUpdatingTask, setIsUpdatingTask] = useState(false)
  const [isDeletingTask, setIsDeletingTask] = useState(false)

  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([])
  const [displayTeamCount, setDisplayTeamCount] = useState(1)

  // Project Configuration State
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [configName, setConfigName] = useState("")
  const [configDescription, setConfigDescription] = useState("")
  const [configDeadline, setConfigDeadline] = useState("")
  const [configHealth, setConfigHealth] = useState<HealthStatus>("ON_TRACK")
  const [configColumns, setConfigColumns] = useState<StatusConfig[]>([])
  const [isSavingConfig, setIsSavingConfig] = useState(false)

  // Project Members State
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const [projectMembers, setProjectMembers] = useState<any[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("DEVELOPER")
  const [isAddingMember, setIsAddingMember] = useState(false)

  const fetchProjectMembers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", projectId)
    if (!error && data) {
      setProjectMembers(data)
    }
  }

  useEffect(() => {
    if (user) {
      initializeStore(user)
      fetchProjectMembers()

      const fetchTeamMembers = async () => {
        const supabase = createClient()
        const membersList: { id: string; name: string }[] = []
        const seenEmails = new Set<string>()

        // 1. Always add the admin/owner (only when viewing as admin)
        if (!user.isTeamMember) {
          const adminEmail = user.email.trim().toLowerCase()
          membersList.push({ id: adminEmail, name: user.fullName || user.email.split("@")[0] })
          seenEmails.add(adminEmail)
        }

        // 2. Workspace members — people who have already logged in at least once
        if (!user.isTeamMember) {
          const { data: dbMembers } = await supabase
            .from("workspace_members")
            .select("*")
            .eq("workspace_id", user.organizationId)

          if (dbMembers) {
            dbMembers.forEach((m) => {
              const email = (m.email || "").trim().toLowerCase()
              if (email && !seenEmails.has(email)) {
                const name = m.custom_title
                  ? `${email.split("@")[0]} (${m.custom_title})`
                  : email.split("@")[0]
                membersList.push({ id: email, name })
                seenEmails.add(email)
              }
            })
          }
        }

        // 3. Project members for THIS project — people assigned to this project
        const { data: projMemberRows } = await supabase
          .from("project_members")
          .select("*")
          .eq("project_id", projectId)

        if (projMemberRows) {
          projMemberRows.forEach((m) => {
            const email = (m.email || "").trim().toLowerCase()
            if (email && !seenEmails.has(email)) {
              const name = m.email.split("@")[0]
              membersList.push({ id: email, name })
              seenEmails.add(email)
            }
          })
        }

        // 4. If the current user is a team member, also include themselves
        if (user.isTeamMember) {
          const selfEmail = user.email.trim().toLowerCase()
          if (!seenEmails.has(selfEmail)) {
            membersList.push({ id: selfEmail, name: user.fullName || selfEmail.split("@")[0] })
            seenEmails.add(selfEmail)
          }
        }

        // 5. Pending invitations count (for display only)
        const { data: dbInvites } = await supabase
          .from("team_invitations")
          .select("email")
          .eq("organization_id", user.organizationId)

        const pendingCount = (dbInvites || []).filter(
          (i) => !seenEmails.has(i.email?.trim().toLowerCase())
        ).length

        setDisplayTeamCount(membersList.length + pendingCount)
        setTeamMembers(membersList)
      }
      
      fetchTeamMembers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, projectId])

  // ── Per-project Supabase Realtime subscription ──────────────────────────────
  // Acts as a fallback layer: if Socket.io misses an event (e.g. admin wasn't
  // in the room yet), Supabase will still deliver the DB change and update the
  // store. This ensures the admin always sees the latest task positions.
  useEffect(() => {
    if (!projectId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`project-tasks-${projectId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` },
        (payload: any) => {
          const newRow = payload.new
          if (!newRow) return
          const state = useAppStore.getState()
          const currentTasks = state.tasks[projectId] || []
          const updatedTasksForProject = currentTasks.map((t) => {
            if (t.id === newRow.id) {
              return {
                ...t,
                status: newRow.status,
                title: newRow.title || t.title,
                priority: newRow.priority || t.priority,
                assignee_id: newRow.assignee_id ?? t.assignee_id,
                due_date: newRow.due_date
                  ? new Date(newRow.due_date).toLocaleDateString()
                  : t.due_date,
                updated_at: newRow.updated_at || new Date().toISOString(),
              }
            }
            return t
          })
          const updatedTasks = { ...state.tasks, [projectId]: updatedTasksForProject }
          useAppStore.setState({ tasks: updatedTasks })
          const workspaceId = state.user?.organizationId || "personal"
          localStorage.setItem(`projtrack_tasks_${workspaceId}`, JSON.stringify(updatedTasks))
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` },
        (payload: any) => {
          const newRow = payload.new
          if (!newRow) return
          const state = useAppStore.getState()
          const currentTasks = state.tasks[projectId] || []
          const alreadyExists = currentTasks.some((t) => t.id === newRow.id)
          if (alreadyExists) return
          const newTask = {
            id: newRow.id,
            milestone_id: null,
            project_id: newRow.project_id,
            title: newRow.title,
            description: newRow.description || "",
            status: newRow.status,
            priority: newRow.priority || "MEDIUM",
            assignee_id: newRow.assignee_id || null,
            due_date: newRow.due_date ? new Date(newRow.due_date).toLocaleDateString() : null,
            estimated_hours: null,
            actual_hours: null,
            blocked_reason: newRow.description?.startsWith("BLOCKED:") ? newRow.description : null,
            is_critical_path: false,
            sort_order: 0,
            created_at: newRow.created_at,
            updated_at: newRow.updated_at,
          }
          const updatedTasks = { ...state.tasks, [projectId]: [...currentTasks, newTask] }
          useAppStore.setState({ tasks: updatedTasks })
          const workspaceId = state.user?.organizationId || "personal"
          localStorage.setItem(`projtrack_tasks_${workspaceId}`, JSON.stringify(updatedTasks))
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` },
        (payload: any) => {
          const taskId = payload.old?.id
          if (!taskId) return
          const state = useAppStore.getState()
          const updatedTasks = {
            ...state.tasks,
            [projectId]: (state.tasks[projectId] || []).filter((t) => t.id !== taskId),
          }
          useAppStore.setState({ tasks: updatedTasks })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  useEffect(() => {
    // Disable main container vertical scroll to prevent nested scroll warnings on Kanban
    const mainEl = document.querySelector("main")
    if (mainEl) {
      mainEl.style.overflowY = "hidden"
    }
    return () => {
      if (mainEl) {
        mainEl.style.overflowY = "auto"
      }
    }
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

  // Wrap updateTaskStatus to also emit socket events for real-time sync
  const updateTaskStatusWithSocket = async (pid: string, taskId: string, newStatus: string) => {
    await updateTaskStatus(pid, taskId, newStatus)
    // Find the task title for a meaningful toast on the receiver's end
    const task = storeTasks[pid]?.find((t) => t.id === taskId)
    const taskTitle = task?.title || "Task"
    emitTaskStatusUpdate(taskId, newStatus, taskTitle)
  }

  const template = getTemplate(project.project_type)
  const health = HEALTH_STATUSES.find((h) => h.value === project.health_status) || HEALTH_STATUSES[0]
  const projectTasks = storeTasks[project.id] || []
  const statuses: StatusConfig[] = project.status_config.length > 0 ? project.status_config : template.defaultStatuses

  const totalTasks = projectTasks.length
  const completedTasks = projectTasks.filter((t) => {
    const taskStatus = statuses.find((s) => s.id === t.status)
    return taskStatus?.category === "done" || t.status === "done" || t.status === "completed"
  }).length
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

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
      const newTask = await addTask(
        project.id,
        taskTitle,
        taskPriority,
        taskAssignee,
        taskDueDate ? new Date(taskDueDate).toLocaleDateString() : "",
        taskBlocked,
        defaultStatus
      )
      // Notify other open boards about the new task via Socket.io
      emitTaskCreated(newTask)
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

  const handleUpdateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask) return
    if (!editTaskTitle.trim()) {
      toast.error("Please enter a task title")
      return
    }

    try {
      setIsUpdatingTask(true)
      await updateTask(project.id, editingTask.id, {
        title: editTaskTitle,
        priority: editTaskPriority,
        assignee_id: editTaskAssignee || null,
        due_date: editTaskDueDate ? new Date(editTaskDueDate).toLocaleDateString() : null,
        status: editTaskStatus,
        blocked_reason: editTaskBlocked ? "Blocked" : null,
        description: editTaskBlocked ? "BLOCKED: Requires review" : ""
      })
      toast.success("Task updated successfully!")
      setIsEditTaskOpen(false)
      setEditingTask(null)
    } catch {
      toast.error("Failed to update task")
    } finally {
      setIsUpdatingTask(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!editingTask) return
    try {
      setIsDeletingTask(true)
      await deleteTask(project.id, editingTask.id)
      // Notify other boards about deletion via Socket.io
      emitTaskDeleted(editingTask.id)
      toast.success("Task deleted successfully!")
      setIsEditTaskOpen(false)
      setEditingTask(null)
    } catch {
      toast.error("Failed to delete task")
    } finally {
      setIsDeletingTask(false)
    }
  }

  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true)
      await deleteProject(project.id)
      toast.success("Project deleted successfully")
      router.push("/projects")
    } catch {
      toast.error("Failed to delete project")
    } finally {
      setIsDeleting(false)
      setIsDeleteOpen(false)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-112px)] gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between flex-shrink-0">
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
              <button
                onClick={() => setIsMembersOpen(true)}
                className="flex items-center gap-1.5 hover:text-gold-dark font-medium transition-colors cursor-pointer"
              >
                <Users className="h-3.5 w-3.5" />
                {projectMembers.length + 1} project members
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!user?.isTeamMember && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-gray-200 text-xs cursor-pointer"
                  onClick={() => {
                    setConfigName(project.name)
                    setConfigDescription(project.description || "")
                    setConfigDeadline(project.deadline || "")
                    setConfigHealth(project.health_status)
                    setConfigColumns(project.status_config)
                    setIsConfigOpen(true)
                  }}
                >
                  Configure
                </Button>
                {isAdmin && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 border-0 cursor-pointer"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Project
                  </Button>
                )}
                <Button 
                  size="sm" 
                  onClick={() => { setDefaultStatus("todo"); setIsTaskOpen(true) }}
                  className="h-8 bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm cursor-pointer hover:brightness-105 border-0"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Task
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Project Completion Score Bar */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col gap-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-navy/70">Project Completion Status</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-navy">{completionPercentage}%</span>
                <span className="text-xs text-muted-foreground">({completedTasks} of {totalTasks} tasks completed)</span>
              </div>
            </div>
            
            {/* Admin Only: Mark Project as Completed */}
            {isAdmin && (
              <div>
                {project.is_completed ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80 border-0 flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-bold">
                    <Check className="h-3.5 w-3.5" />
                    Project Completed
                  </Badge>
                ) : (
                  completedTasks > 0 && completedTasks === totalTasks && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const { updateProjectDetails } = useAppStore.getState()
                          await updateProjectDetails(
                            project.id,
                            project.name,
                            project.description || "",
                            project.deadline || "",
                            project.health_status,
                            true // mark completed
                          )
                          toast.success("Project marked as completed successfully!")
                        } catch {
                          toast.error("Failed to mark project as completed")
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-sm border-0 cursor-pointer h-9 px-4 rounded-lg flex items-center gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      Mark Project as Completed
                    </Button>
                  )
                )}
              </div>
            )}
          </div>
          
          {/* Progress Bar Track */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                completionPercentage === 100 ? "bg-green-500" : "bg-gradient-to-r from-gold to-gold-dark"
              )}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="inline-flex items-center rounded-lg bg-gray-100/80 p-1 shadow-sm flex-shrink-0 w-fit">
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
          <div className="flex-1 min-h-0 flex flex-col">
            <KanbanBoard 
              statuses={statuses} 
              tasks={tasksByStatus}
              projectId={projectId}
              updateTaskStatus={updateTaskStatusWithSocket}
              onTaskClick={(taskId) => {
                if (isAdmin) {
                  const task = projectTasks.find(t => t.id === taskId)
                  if (task) {
                    setEditingTask(task)
                    setEditTaskTitle(task.title)
                    setEditTaskPriority(task.priority)
                    setEditTaskAssignee(task.assignee_id || "")
                    
                    let dateVal = ""
                    if (task.due_date) {
                      try {
                        const d = new Date(task.due_date)
                        dateVal = d.toISOString().split("T")[0]
                      } catch {}
                    }
                    setEditTaskDueDate(dateVal)
                    setEditTaskStatus(task.status || "todo")
                    setIsEditTaskOpen(true)
                  }
                } else {
                  toast.info("Only administrators (workspace owners) can edit or delete tasks.")
                }
              }}
              onAddTask={handleAddTaskForStatus}
              isAdmin={isAdmin}
              userName={userName}
              addNotification={addNotification}
              onUpdateColumns={useAppStore.getState().updateProjectColumns}
              userEmail={user?.email || ""}
              isTeamMember={user?.isTeamMember || false}
            />
          </div>
        )}
        {/* BUG-008 FIXED: Pass projectId to GanttChart */}
        {view === "gantt" && (
          <div className="flex-1 min-h-0 flex flex-col">
            <GanttChart projectId={projectId} />
          </div>
        )}
        {/* BUG-007 FIXED: Pass projectId to SpreadsheetView */}
        {view === "spreadsheet" && (
          <div className="flex-1 min-h-0 flex flex-col">
            <SpreadsheetView projectId={projectId} />
          </div>
        )}
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
                          {m.name}
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

      {/* Edit Task Modal */}
      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden shadow-2xl rounded-2xl bg-white">
          <form onSubmit={handleUpdateTaskSubmit}>
            <div className="p-6 pb-4">
              <DialogHeader className="mb-4 flex flex-row items-center justify-between">
                <DialogTitle className="text-lg font-bold text-navy">Edit Workspace Task</DialogTitle>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 cursor-pointer"
                  onClick={handleDeleteTask}
                  disabled={isDeletingTask}
                >
                  {isDeletingTask ? "Deleting..." : "Delete Task"}
                </Button>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/80">Task Title</Label>
                  <Input
                    placeholder="Task Title"
                    value={editTaskTitle}
                    onChange={(e) => setEditTaskTitle(e.target.value)}
                    required
                    disabled={isUpdatingTask || isDeletingTask}
                    className="h-9 text-sm border-gray-200 focus-visible:ring-gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-navy/80">Priority</Label>
                    <select
                      value={editTaskPriority}
                      onChange={(e) => setEditTaskPriority(e.target.value as Priority)}
                      disabled={isUpdatingTask || isDeletingTask}
                      className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:border-gold/50 focus:outline-none disabled:opacity-50"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-navy/80">Column / Status</Label>
                    <select
                      value={editTaskStatus}
                      onChange={(e) => setEditTaskStatus(e.target.value)}
                      disabled={isUpdatingTask || isDeletingTask}
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
                      value={editTaskAssignee}
                      onChange={(e) => setEditTaskAssignee(e.target.value)}
                      disabled={isUpdatingTask || isDeletingTask}
                      className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:border-gold/50 focus:outline-none disabled:opacity-50"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-navy/80">Due Date</Label>
                    <Input
                      type="date"
                      value={editTaskDueDate}
                      onChange={(e) => setEditTaskDueDate(e.target.value)}
                      disabled={isUpdatingTask || isDeletingTask}
                      className="h-9 text-sm border-gray-200 focus-visible:ring-gold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/80">Visual Signal / Impediment</Label>
                  <div className="flex items-center gap-2 h-9">
                    <input
                      type="checkbox"
                      id="edit-blocked"
                      checked={editTaskBlocked}
                      onChange={(e) => setEditTaskBlocked(e.target.checked)}
                      disabled={isUpdatingTask || isDeletingTask}
                      className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
                    />
                    <label htmlFor="edit-blocked" className="text-xs font-medium text-navy/80 flex items-center gap-1 cursor-pointer">
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
                onClick={() => setIsEditTaskOpen(false)}
                disabled={isUpdatingTask || isDeletingTask}
                className="text-xs hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingTask || isDeletingTask}
                className="bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm"
              >
                {isUpdatingTask ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden shadow-2xl rounded-2xl bg-white">
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-bold text-navy flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Delete Project
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete <strong className="text-navy">{project.name}</strong>? This action is permanent and will delete all tasks associated with this project.
            </p>
            <DialogFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteProject}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      {/* Project Configuration Modal */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-lg border-0 p-0 overflow-hidden shadow-2xl rounded-2xl bg-white max-h-[85vh] flex flex-col">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="text-lg font-bold text-navy">Project Configuration</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify details and columns for &ldquo;{project.name}&rdquo;.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
            {/* General Settings */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">General Settings</h4>
              
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-navy/80">Project Name</Label>
                <Input
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  className="h-9 text-sm border-gray-200 focus-visible:ring-gold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-navy/80">Description</Label>
                <Textarea
                  value={configDescription}
                  onChange={(e: any) => setConfigDescription(e.target.value)}
                  className="min-h-[60px] text-sm border-gray-200 focus-visible:ring-gold resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-navy/80">Deadline</Label>
                  <Input
                    type="date"
                    value={configDeadline}
                    onChange={(e) => setConfigDeadline(e.target.value)}
                    className="h-9 text-sm border-gray-200 focus-visible:ring-gold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-navy/80">Health Status</Label>
                  <select
                    value={configHealth}
                    onChange={(e) => setConfigHealth(e.target.value as HealthStatus)}
                    className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:border-gold/50 focus:outline-none"
                  >
                    <option value="ON_TRACK">On Track</option>
                    <option value="AT_RISK">At Risk</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Kanban Columns Manager */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kanban Columns</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newId = `col_${Math.random().toString(36).substring(2, 9)}`
                    const colors = ["blue", "amber", "green", "purple", "crimson", "teal", "indigo"]
                    const randomColor = colors[Math.floor(Math.random() * colors.length)]
                    setConfigColumns([
                      ...configColumns,
                      { id: newId, label: "New Stage", color: randomColor, order: configColumns.length + 1, category: "todo" }
                    ])
                  }}
                  className="h-7 text-xs border-gold text-gold-dark hover:bg-gold/5 cursor-pointer"
                >
                  + Add Column
                </Button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {configColumns.map((col, idx) => (
                  <div key={col.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className={cn("h-3 w-3 rounded-full shrink-0", 
                      col.color === "blue" ? "bg-blue-500" :
                      col.color === "amber" ? "bg-amber-500" :
                      col.color === "green" ? "bg-green-500" :
                      col.color === "purple" ? "bg-purple-500" :
                      col.color === "crimson" ? "bg-red-500" :
                      col.color === "teal" ? "bg-teal-500" :
                      col.color === "indigo" ? "bg-indigo-500" : "bg-slate-400"
                    )} />
                    <Input
                      value={col.label}
                      onChange={(e) => {
                        setConfigColumns(configColumns.map(c => c.id === col.id ? { ...c, label: e.target.value } : c))
                      }}
                      className="h-8 text-xs focus-visible:ring-gold bg-white flex-1"
                    />
                    <select
                      value={col.color}
                      onChange={(e) => {
                        setConfigColumns(configColumns.map(c => c.id === col.id ? { ...c, color: e.target.value } : c))
                      }}
                      className="h-8 text-[11px] rounded-md border border-gray-200 bg-white px-2 focus:outline-none"
                    >
                      <option value="blue">Blue</option>
                      <option value="amber">Amber</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                      <option value="crimson">Red</option>
                      <option value="teal">Teal</option>
                      <option value="indigo">Indigo</option>
                    </select>

                    <div className="flex gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          const nextIndex = idx - 1
                          if (nextIndex >= 0) {
                            const updated = [...configColumns]
                            const temp = updated[idx]
                            updated[idx] = updated[nextIndex]
                            updated[nextIndex] = temp
                            setConfigColumns(updated.map((c, i) => ({ ...c, order: i + 1 })))
                          }
                        }}
                        disabled={idx === 0}
                        className="h-8 w-8 text-slate-400 hover:text-navy rounded-md cursor-pointer flex items-center justify-center"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          const nextIndex = idx + 1
                          if (nextIndex < configColumns.length) {
                            const updated = [...configColumns]
                            const temp = updated[idx]
                            updated[idx] = updated[nextIndex]
                            updated[nextIndex] = temp
                            setConfigColumns(updated.map((c, i) => ({ ...c, order: i + 1 })))
                          }
                        }}
                        disabled={idx === configColumns.length - 1}
                        className="h-8 w-8 text-slate-400 hover:text-navy rounded-md cursor-pointer flex items-center justify-center"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setConfigColumns(configColumns.filter(c => c.id !== col.id))}
                      disabled={configColumns.length <= 1}
                      className="h-8 w-8 text-slate-400 hover:text-red-500 rounded-md cursor-pointer flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex sm:flex-row justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsConfigOpen(false)}
              className="text-xs hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!configName.trim()) {
                  toast.error("Project name cannot be empty")
                  return
                }
                try {
                  setIsSavingConfig(true)
                  const { updateProjectDetails, updateProjectColumns } = useAppStore.getState()
                  await updateProjectDetails(projectId, configName, configDescription, configDeadline, configHealth)
                  await updateProjectColumns(projectId, configColumns)
                  toast.success("Project configuration updated successfully!")
                  setIsConfigOpen(false)
                } catch {
                  toast.error("Failed to save project configuration")
                } finally {
                  setIsSavingConfig(false)
                }
              }}
              disabled={isSavingConfig}
              className="bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm border-0 cursor-pointer"
            >
              {isSavingConfig ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Members Modal */}
      <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden shadow-2xl rounded-2xl bg-white max-h-[80vh] flex flex-col">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="text-lg font-bold text-navy">Project Members</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Manage team members assigned to this specific project.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
            {/* Add Member Form (Admin Only) */}
            {!user?.isTeamMember && (
              <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Assign New Member</h4>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="member@company.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="h-9 text-xs border-gray-200 focus-visible:ring-gold bg-white flex-1"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="h-9 text-xs rounded-md border border-gray-200 bg-white px-2 focus:outline-none"
                  >
                    <option value="DEVELOPER">Developer</option>
                    <option value="CLIENT">Client</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <Button
                    onClick={async () => {
                      if (!user) return
                      if (!newMemberEmail.trim()) {
                        toast.error("Please enter an email address")
                        return
                      }
                      try {
                        setIsAddingMember(true)
                        const supabase = createClient()
                        const targetEmail = newMemberEmail.trim().toLowerCase()

                        // Check if already assigned — first from local state (fast),
                        // then confirm with a live DB query to guard against stale state
                        const isAlreadyAssignedLocally = projectMembers.some(
                          (m) => m.email.toLowerCase() === targetEmail
                        )
                        if (isAlreadyAssignedLocally) {
                          toast.info(`${newMemberEmail} is already assigned to this project.`)
                          setIsAddingMember(false)
                          return
                        }
                        // Live DB duplicate guard
                        const { data: existingProjectMember } = await supabase
                          .from("project_members")
                          .select("id")
                          .eq("project_id", projectId)
                          .eq("email", targetEmail)
                          .maybeSingle()
                        if (existingProjectMember) {
                          toast.info(`${newMemberEmail} is already assigned to this project.`)
                          await fetchProjectMembers() // refresh stale list
                          setIsAddingMember(false)
                          return
                        }

                        // Check if they are already in the workspace members table
                        const { data: memberData } = await supabase
                          .from("workspace_members")
                          .select("*")
                          .eq("workspace_id", user.organizationId)
                          .eq("email", targetEmail)
                          .maybeSingle()

                        // Check for ANY existing invite (accepted or pending) for this workspace
                        // This prevents generating a new code on every session
                        const { data: anyInvite } = await supabase
                          .from("team_invitations")
                          .select("*")
                          .eq("organization_id", user.organizationId)
                          .eq("email", targetEmail)
                          .maybeSingle()

                        if (!memberData && !anyInvite) {
                          // Truly first-time invite — generate ONE code
                          const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
                          const generatedCode = `PT-${randomCode}`

                          const { error: inviteError } = await supabase
                            .from("team_invitations")
                            .insert({
                              email: targetEmail,
                              code: generatedCode,
                              organization_id: user.organizationId,
                              role: newMemberRole,
                              custom_title:
                                newMemberRole === "DEVELOPER"
                                  ? "Developer"
                                  : newMemberRole === "CLIENT"
                                  ? "Client"
                                  : "Viewer",
                              created_at: new Date().toISOString(),
                              accepted: false
                            })

                          if (inviteError) throw inviteError

                          // Send email with the newly generated code
                          try {
                            const orgName =
                              localStorage.getItem(`projtrack_org_name_${user.organizationId}`) ||
                              `${user.fullName}'s Workspace`
                            await fetch("/api/send-invite", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                email: targetEmail,
                                code: generatedCode,
                                role: newMemberRole,
                                customTitle:
                                  newMemberRole === "DEVELOPER"
                                    ? "Developer"
                                    : newMemberRole === "CLIENT"
                                    ? "Client"
                                    : "Viewer",
                                organizationName: orgName,
                                invitedBy: user.fullName,
                              }),
                            })
                            toast.success(`Sent workspace invitation to ${targetEmail}! (Code: ${generatedCode})`, {
                              duration: 10000
                            })
                          } catch (emailErr) {
                            console.error("Failed to send invitation email:", emailErr)
                            toast.warning(
                              `Workspace invitation created, but failed to send email. (Code: ${generatedCode})`,
                              { duration: 10000 }
                            )
                          }
                        } else if (anyInvite) {
                          // Already has a code — just inform the admin (don't generate a new one)
                          toast.info(
                            `${targetEmail} already has invite code: ${anyInvite.code}. Assigning to project directly.`,
                            { duration: 8000 }
                          )
                        } else {
                          toast.info(`${targetEmail} is already a workspace member. Assigning to project directly.`)
                        }

                        // Add member to the project
                        const { addProjectMember } = useAppStore.getState()
                        await addProjectMember(projectId, targetEmail, newMemberRole)
                        toast.success(`Assigned ${newMemberEmail} to project!`)
                        setNewMemberEmail("")
                        await fetchProjectMembers()
                      } catch {
                        toast.error("Failed to assign member to project.")
                      } finally {
                        setIsAddingMember(false)
                      }
                    }}
                    disabled={isAddingMember}
                    className="bg-navy hover:bg-navy-lighter h-9 text-xs font-semibold cursor-pointer border-0"
                  >
                    Assign
                  </Button>
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Team</h4>
              
              {/* Owner */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[9px] font-bold bg-navy text-white">AD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-semibold text-navy">Project Owner (Admin)</p>
                    <p className="text-[10px] text-muted-foreground">Workspace Admin</p>
                  </div>
                </div>
                <Badge className="bg-gold/10 text-gold-dark border-gold/20 text-[9px]">Owner</Badge>
              </div>

              {/* Assigned Members */}
              {projectMembers.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No additional team members assigned to this project yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {projectMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[9px] font-bold bg-slate-200 text-slate-600">
                            {m.email.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-semibold text-navy">{m.email}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{m.role.toLowerCase()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] capitalize px-2">{m.role.toLowerCase()}</Badge>
                        {!user?.isTeamMember && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={async () => {
                              try {
                                const { removeProjectMember } = useAppStore.getState()
                                await removeProjectMember(projectId, m.id)
                                toast.success("Member removed from project")
                                await fetchProjectMembers()
                              } catch {
                                toast.error("Failed to remove member")
                              }
                            }}
                            className="h-7 w-7 text-slate-400 hover:text-red-500 rounded-md cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="bg-gray-50 px-6 py-4 border-t border-gray-100 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMembersOpen(false)}
              className="w-full text-xs hover:bg-gray-100 cursor-pointer border-slate-200"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

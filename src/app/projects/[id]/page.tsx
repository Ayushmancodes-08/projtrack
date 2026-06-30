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
  Trash2
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

const viewIcons: Record<string, React.ElementType> = { kanban: Columns3, gantt: BarChart3, spreadsheet: Table2 }

import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const { projects, tasks: storeTasks, initializeStore, addTask, updateTaskStatus, isLoaded, addNotification, deleteProject } = useAppStore()
  const { user } = useAuth()
  
  const isAdmin = user ? !user.isTeamMember : false
  const userName = user?.fullName || user?.email || "Team Member"

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
        
        // Add Admin/Owner
        const adminInitials = user.fullName 
          ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) 
          : "AD"
        membersList.push({ id: adminInitials, name: user.fullName })

        // Fetch other members
        const { data: dbMembers } = await supabase
          .from("workspace_members")
          .select("*")
          .eq("workspace_id", user.organizationId)
        
        if (dbMembers) {
          dbMembers.forEach((m) => {
            const name = m.email.split("@")[0]
            const initials = name.slice(0, 2).toUpperCase()
            membersList.push({ id: initials, name })
          })
        }
        
        // Fetch pending invites
        const { data: dbInvites } = await supabase
          .from("team_invitations")
          .select("*")
          .eq("organization_id", user.organizationId)
        
        const totalCount = membersList.length + (dbInvites?.length || 0)
        setDisplayTeamCount(totalCount)
        setTeamMembers(membersList)
      }
      
      fetchTeamMembers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, projectId])

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
                {configColumns.map((col) => (
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setConfigColumns(configColumns.filter(c => c.id !== col.id))}
                      disabled={configColumns.length <= 1}
                      className="h-8 w-8 text-slate-400 hover:text-red-500 rounded-md cursor-pointer flex items-center justify-center"
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
                      if (!newMemberEmail.trim()) {
                        toast.error("Please enter an email address")
                        return
                      }
                      try {
                        setIsAddingMember(true)
                        const { addProjectMember } = useAppStore.getState()
                        await addProjectMember(projectId, newMemberEmail, newMemberRole)
                        toast.success(`Assigned ${newMemberEmail} to project!`)
                        setNewMemberEmail("")
                        await fetchProjectMembers()
                      } catch {
                        toast.error("Failed to assign member to project. Ensure the project_members table exists.")
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

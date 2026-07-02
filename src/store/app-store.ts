import { create } from "zustand"
import type { Project, Task, ProjectType, StatusConfig, Priority, HealthStatus } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { io } from "socket.io-client"

export type AppNotification = {
  id: string
  title: string
  body: string
  type: "review_request" | "info"
  task_id: string
  project_id: string
  user_name: string
  timestamp: string
  resolved: boolean
}

const logActivity = async (projectId: string | null, taskId: string | null, action: string, details?: string, oldValue?: string, newValue?: string) => {
  try {
    const supabase = createClient()
    const currentUser = useAppStore.getState().user
    const actorEmail = currentUser?.email || "system@projtrack.com"
    const actorName = currentUser?.fullName || currentUser?.email || "System"

    await supabase.from("activity_logs").insert({
      project_id: projectId,
      task_id: taskId,
      actor_email: actorEmail,
      actor_name: actorName,
      action: action,
      details: details,
      old_value: oldValue,
      new_value: newValue,
      created_at: new Date().toISOString()
    })
  } catch (e) {
    console.warn("Failed to write activity log", e)
  }
}

type AppState = {
  projects: Project[]
  tasks: Record<string, Task[]> // project_id -> Task[]
  notifications: AppNotification[]
  sidebarCollapsed: boolean
  isLoaded: boolean
  user: any | null
  
  // Actions
  setUser: (user: any) => void
  toggleSidebar: () => void
  initializeStore: (user?: any) => Promise<void>
  addProject: (name: string, type: ProjectType, statuses: StatusConfig[], description?: string, deadline?: string) => Promise<Project>
  deleteProject: (projectId: string) => Promise<void>
  addTask: (projectId: string, title: string, priority: Priority, assignee: string, dueDate: string, blocked: boolean, status?: string) => Promise<Task>
  updateTaskStatus: (projectId: string, taskId: string, newStatus: string) => Promise<void>
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (projectId: string, taskId: string) => Promise<void>
  updateProjectDetails: (projectId: string, name: string, description: string, deadline: string, healthStatus: HealthStatus, isCompleted?: boolean) => Promise<void>
  updateProjectColumns: (projectId: string, columns: StatusConfig[]) => Promise<void>
  addProjectMember: (projectId: string, email: string, role: string) => Promise<void>
  removeProjectMember: (projectId: string, memberId: string) => Promise<void>
  syncWithSupabase: () => Promise<void>
  addNotification: (title: string, body: string, type: "review_request" | "info", task_id: string, project_id: string, user_name: string) => Promise<void>
  resolveNotification: (notificationId: string) => Promise<void>
}

// Helper to generate UUIDs in the browser
function generateUUID(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
}

// BUG-005 FIXED: Replace `any` with a proper typed record
type SupabaseTaskRow = Record<string, unknown>

// Helper functions to map DB results to frontend types
const mapDbTaskToTask = (t: any): Task => {
  return {
    id: t.id,
    milestone_id: null,
    project_id: t.project_id,
    title: t.title,
    description: t.description || "",
    status: t.status,
    priority: t.priority || "MEDIUM",
    assignee_id: t.assignee_id || null,
    due_date: t.due_date ? new Date(t.due_date).toLocaleDateString() : null,
    estimated_hours: t.estimate_minutes ? Math.round(t.estimate_minutes / 60) : null,
    actual_hours: null,
    blocked_reason: t.description && t.description.startsWith("BLOCKED:") ? t.description : null,
    is_critical_path: false,
    sort_order: 0,
    created_at: t.created_at,
    updated_at: t.updated_at
  }
}

const mapDbProjectToProject = (p: any): Project => {
  let dbStatuses: StatusConfig[] = []
  if (p.status_config) {
    try {
      dbStatuses = typeof p.status_config === "string"
        ? JSON.parse(p.status_config)
        : (p.status_config as StatusConfig[])
    } catch { /* ignore */ }
  }
  return {
    id: p.id,
    portfolio_id: null,
    organization_id: p.workspace_id || "personal",
    name: p.name,
    description: p.description || "",
    project_type: p.status || "SOFTWARE",
    budget: null,
    deadline: p.deadline || null,
    client_name: null,
    location: null,
    health_status: p.color || "ON_TRACK",
    is_completed: p.status === "COMPLETED",
    custom_fields: null,
    status_config: dbStatuses,
    created_at: p.created_at,
    updated_at: p.updated_at
  }
}

const mapDbNotificationToNotification = (n: any): AppNotification => {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.data?.type || "info",
    task_id: n.data?.task_id || "",
    project_id: n.data?.project_id || "",
    user_name: n.data?.user_name || "System",
    timestamp: n.data?.timestamp || new Date(n.created_at).toLocaleString(),
    resolved: n.read
  }
}

let activeRealtimeChannel: any = null
let activeRealtimeWorkspaceId: string | null = null
let activeSupabaseClient: any = null

const setupRealtimeSubscription = (supabase: any, workspaceId: string) => {
  if (activeRealtimeChannel && activeRealtimeWorkspaceId === workspaceId && activeSupabaseClient === supabase) {
    return
  }

  if (activeRealtimeChannel) {
    try {
      activeRealtimeChannel.unsubscribe()
      if (activeSupabaseClient) {
        activeSupabaseClient.removeChannel(activeRealtimeChannel)
      }
    } catch (e) {
      console.warn("Failed to unsubscribe/remove old realtime channel", e)
    }
  }

  activeRealtimeWorkspaceId = workspaceId
  activeSupabaseClient = supabase

  activeRealtimeChannel = supabase
    .channel(`db-changes-${workspaceId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      (payload: any) => {
        const { eventType, new: newRow, old: oldRow } = payload
        const { tasks } = useAppStore.getState()
        const updatedTasks = { ...tasks }

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          const task = mapDbTaskToTask(newRow)
          const pid = task.project_id
          if (!updatedTasks[pid]) {
            updatedTasks[pid] = []
          }
          const index = updatedTasks[pid].findIndex(t => t.id === task.id)
          if (index > -1) {
            const newPidTasks = [...updatedTasks[pid]]
            newPidTasks[index] = task
            updatedTasks[pid] = newPidTasks
          } else {
            updatedTasks[pid] = [...updatedTasks[pid], task]
          }
        } else if (eventType === 'DELETE') {
          const taskId = oldRow.id
          for (const pid of Object.keys(updatedTasks)) {
            updatedTasks[pid] = updatedTasks[pid].filter(t => t.id !== taskId)
          }
        }

        useAppStore.setState({ tasks: updatedTasks })
        localStorage.setItem(`projtrack_tasks_${workspaceId}`, JSON.stringify(updatedTasks))
        
        if (eventType === 'DELETE') {
          toast.info("A task was deleted from the board.")
        } else {
          toast.info(`Task Board updated: "${newRow?.title || 'a task'}" is now in ${newRow?.status || 'updated'}`)
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'projects' },
      (payload: any) => {
        const { eventType, new: newRow, old: oldRow } = payload
        const { projects, tasks } = useAppStore.getState()
        let updatedProjects = [...projects]
        let updatedTasks = { ...tasks }

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          const project = mapDbProjectToProject(newRow)
          const index = updatedProjects.findIndex(p => p.id === project.id)
          if (index > -1) {
            updatedProjects[index] = {
              ...updatedProjects[index],
              ...project
            }
          } else {
            updatedProjects.push(project)
            if (!updatedTasks[project.id]) {
              updatedTasks[project.id] = []
            }
          }
        } else if (eventType === 'DELETE') {
          const projectId = oldRow.id
          updatedProjects = updatedProjects.filter(p => p.id !== projectId)
          delete updatedTasks[projectId]
        }

        useAppStore.setState({ projects: updatedProjects, tasks: updatedTasks })
        localStorage.setItem(`projtrack_projects_${workspaceId}`, JSON.stringify(updatedProjects))
        localStorage.setItem(`projtrack_tasks_${workspaceId}`, JSON.stringify(updatedTasks))
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications_queue' },
      (payload: any) => {
        const { eventType, new: newRow, old: oldRow } = payload
        const { notifications } = useAppStore.getState()
        let updatedNotifications = [...notifications]

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          const notification = mapDbNotificationToNotification(newRow)
          const index = updatedNotifications.findIndex(n => n.id === notification.id)
          if (index > -1) {
            updatedNotifications[index] = notification
          } else {
            updatedNotifications = [notification, ...updatedNotifications]
          }
        } else if (eventType === 'DELETE') {
          const notificationId = oldRow.id
          updatedNotifications = updatedNotifications.filter(n => n.id !== notificationId)
        }

        useAppStore.setState({ notifications: updatedNotifications })
        localStorage.setItem(`projtrack_notifications_${workspaceId}`, JSON.stringify(updatedNotifications))
      }
    )
    .subscribe((status: any) => {
      console.log(`Realtime channel status: ${status}`)
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`[Supabase Realtime] Subscription issue (${status}). Real-time updates via Supabase may be unavailable. Socket.io is the primary sync channel.`)
      }
      if (status === 'SUBSCRIBED') {
        console.log(`[Supabase Realtime] Subscribed to workspace ${workspaceId} — listening for task/project changes.`)
      }
    })
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  tasks: {},
  notifications: [],
  sidebarCollapsed: false,
  isLoaded: false,
  user: null,

  setUser: (user) => set({ user }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  initializeStore: async (user?: any) => {
    if (typeof window === "undefined") return
    if (user) {
      set({ user })
    }
    const currentUser = user || get().user
    const workspaceId = currentUser?.organizationId || "personal"

    // 1. Load from LocalStorage for instant load / best UX
    const localProjects = localStorage.getItem(`projtrack_projects_${workspaceId}`)
    const localTasks = localStorage.getItem(`projtrack_tasks_${workspaceId}`)
    const localNotifications = localStorage.getItem(`projtrack_notifications_${workspaceId}`)

    const projects: Project[] = localProjects ? JSON.parse(localProjects) : []
    const tasks: Record<string, Task[]> = localTasks ? JSON.parse(localTasks) : {}
    const notifications: AppNotification[] = localNotifications ? JSON.parse(localNotifications) : []

    set({ projects, tasks, notifications, isLoaded: true })

    // 2. Load from Supabase in the background to sync latest data
    try {
      const supabase = createClient()
      
      // ── TEAM MEMBER: Always use project_members table and assigned tasks as primary source ──────────
      if (currentUser?.isTeamMember && currentUser.email) {
        const normalizedEmail = currentUser.email.trim().toLowerCase()
        
        // Fetch project IDs from project_members
        const { data: assignedRows } = await supabase
          .from("project_members")
          .select("project_id")
          .eq("email", normalizedEmail)

        // Also fetch project IDs from tasks assigned to the user
        const { data: taskRows } = await supabase
          .from("tasks")
          .select("project_id")
          .eq("assignee_id", normalizedEmail)

        const assignedProjectIdsFromMembers = (assignedRows || []).map((r: any) => r.project_id)
        const assignedProjectIdsFromTasks = (taskRows || []).map((r: any) => r.project_id)
        
        // Merge and deduplicate project IDs
        const uniqueProjectIds = Array.from(new Set([
          ...assignedProjectIdsFromMembers,
          ...assignedProjectIdsFromTasks
        ])).filter(Boolean)

        if (uniqueProjectIds.length > 0) {
          const { data: assignedProjects } = await supabase
            .from("projects")
            .select("*")
            .in("id", uniqueProjectIds)

          if (assignedProjects && assignedProjects.length > 0) {
            const mappedAssigned: Project[] = assignedProjects.map((p: Record<string, unknown>) => {
              let dbStatuses: StatusConfig[] = []
              if (p.status_config) {
                try {
                  dbStatuses = typeof p.status_config === "string"
                    ? JSON.parse(p.status_config)
                    : (p.status_config as StatusConfig[])
                } catch { /* ignore */ }
              }
              return {
                id: p.id as string,
                portfolio_id: null,
                organization_id: (p.workspace_id as string) || "personal",
                name: p.name as string,
                description: (p.description as string) || "",
                project_type: (p.status as ProjectType) || "SOFTWARE",
                budget: null,
                deadline: (p.deadline as string) || null,
                client_name: null,
                location: null,
                health_status: (p.color as HealthStatus) || "ON_TRACK",
                is_completed: p.status === "COMPLETED",
                custom_fields: null,
                status_config: dbStatuses,
                created_at: p.created_at as string,
                updated_at: p.updated_at as string
              }
            })

            const { data: assignedTasks } = await supabase
              .from("tasks")
              .select("*")
              .in("project_id", uniqueProjectIds)

            const assignedSyncedTasks: Record<string, Task[]> = {}
            ;(assignedTasks || []).forEach((t: SupabaseTaskRow) => {
              const pid = t.project_id as string
              if (!assignedSyncedTasks[pid]) assignedSyncedTasks[pid] = []
              assignedSyncedTasks[pid].push({
                id: t.id as string,
                milestone_id: null,
                project_id: pid,
                title: t.title as string,
                description: (t.description as string) || "",
                status: t.status as string,
                priority: (t.priority as Priority) || "MEDIUM",
                assignee_id: (t.assignee_id as string) || null,
                due_date: t.due_date ? new Date(t.due_date as string | number | Date).toLocaleDateString() : null,
                estimated_hours: null,
                actual_hours: null,
                blocked_reason: t.description && (t.description as string).startsWith("BLOCKED:") ? (t.description as string) : null,
                is_critical_path: false,
                sort_order: 0,
                created_at: t.created_at as string,
                updated_at: t.updated_at as string
              })
            })

            // Fetch notifications
            const { data: dbNotifications } = await supabase
              .from("notifications_queue")
              .select("*")
              .order("created_at", { ascending: false })
            const syncedNotifications: AppNotification[] = (dbNotifications || []).map((n: Record<string, any>) => ({
              id: n.id,
              title: n.title,
              body: n.body,
              type: n.data?.type || "info",
              task_id: n.data?.task_id || "",
              project_id: n.data?.project_id || "",
              user_name: n.data?.user_name || "System",
              timestamp: n.data?.timestamp || new Date(n.created_at).toLocaleString(),
              resolved: n.read
            }))

            set({ projects: mappedAssigned, tasks: assignedSyncedTasks, notifications: syncedNotifications })
            localStorage.setItem(`projtrack_projects_${workspaceId}`, JSON.stringify(mappedAssigned))
            localStorage.setItem(`projtrack_tasks_${workspaceId}`, JSON.stringify(assignedSyncedTasks))
            localStorage.setItem(`projtrack_notifications_${workspaceId}`, JSON.stringify(syncedNotifications))
            setupRealtimeSubscription(supabase, workspaceId)
            return
          }
        }

        // No assigned projects found for team member
        set({ projects: [], tasks: {}, isLoaded: true })
        return
      }
      // ─────────────────────────────────────────────────────────────────────────

      // Fetch projects - for admin/independent users
      const { data: dbProjects, error: projError } = await supabase
        .from("projects")
        .select("*")
        .or(`workspace_id.eq.${workspaceId},workspace_id.eq.personal`)
      
      if (!projError && dbProjects) {
        // Map DB projects to frontend Projects structure
        const syncedProjects: Project[] = dbProjects.map((p: Record<string, unknown>) => {
          const matchedLocal = projects.find((lp) => lp.id === p.id)
          
          // Parse status_config from DB if it exists, otherwise fallback to local or empty
          let dbStatuses: StatusConfig[] = []
          if (p.status_config) {
            try {
              dbStatuses = typeof p.status_config === "string" 
                ? JSON.parse(p.status_config) 
                : (p.status_config as StatusConfig[])
            } catch (e) {
              console.error("Failed to parse status_config", e)
            }
          }

          return {
            id: p.id as string,
            portfolio_id: null,
            organization_id: (p.workspace_id as string) || "personal",
            name: p.name as string,
            description: (p.description as string) || matchedLocal?.description || "",
            project_type: (p.status as ProjectType) || matchedLocal?.project_type || "SOFTWARE",
            budget: null,
            deadline: (p.deadline as string) || matchedLocal?.deadline || null,
            client_name: null,
            location: null,
            health_status: (p.color as HealthStatus) || "ON_TRACK",
            is_completed: p.status === "COMPLETED",
            custom_fields: null,
            status_config: dbStatuses.length > 0 ? dbStatuses : (matchedLocal?.status_config || []),
            created_at: p.created_at as string,
            updated_at: p.updated_at as string
          }
        })

        // Fetch tasks
        const projectIds = dbProjects.map((p) => p.id)
        let dbTasks: any[] = []
        if (projectIds.length > 0) {
          const { data, error: taskError } = await supabase
            .from("tasks")
            .select("*")
            .in("project_id", projectIds)
          if (!taskError && data) {
            dbTasks = data
          }
        }

        // Auto-sync recovery: If local tasks exist but DB tasks are empty, sync them to Supabase
        const hasLocalTasks = Object.values(tasks).some(t => t && t.length > 0)
        if (dbTasks.length === 0 && hasLocalTasks) {
          try {
            for (const projectId of Object.keys(tasks)) {
              for (const task of tasks[projectId]) {
                await supabase.from("tasks").upsert({
                  id: task.id,
                  project_id: task.project_id,
                  title: task.title,
                  description: task.description || "",
                  status: task.status,
                  priority: task.priority,
                  due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
                  assignee_id: task.assignee_id || null
                })
              }
            }
            // Re-fetch tasks after sync
            const { data: reFetchedTasks } = await supabase
              .from("tasks")
              .select("*")
              .in("project_id", projectIds)
            if (reFetchedTasks) {
              dbTasks = reFetchedTasks
            }
          } catch (syncErr) {
            console.error("Auto-sync local tasks to Supabase failed:", syncErr)
          }
        }

        const syncedTasks: Record<string, Task[]> = {}
        
        dbTasks.forEach((t: SupabaseTaskRow) => {
          const projectId = t.project_id as string
          const taskId = t.id as string
          
          if (!syncedTasks[projectId]) {
            syncedTasks[projectId] = []
          }
          
          const matchedLocal = (tasks[projectId] || []).find((lt) => lt.id === taskId)
          syncedTasks[projectId].push({
            id: taskId,
            milestone_id: null,
            project_id: projectId,
            title: t.title as string,
            description: (t.description as string) || "",
            status: t.status as string,
            priority: (t.priority as Priority) || "MEDIUM",
            assignee_id: (t.assignee_id as string) || matchedLocal?.assignee_id || null,
            due_date: t.due_date ? new Date(t.due_date as string | number | Date).toLocaleDateString() : matchedLocal?.due_date || null,
            estimated_hours: t.estimate_minutes ? Math.round((t.estimate_minutes as number) / 60) : null,
            actual_hours: null,
            blocked_reason: t.description && (t.description as string).startsWith("BLOCKED:") ? (t.description as string) : null,
            is_critical_path: false,
            sort_order: 0,
            created_at: t.created_at as string,
            updated_at: t.updated_at as string
          })
        })

        // Fetch notifications
        const { data: dbNotifications, error: notifError } = await supabase
          .from("notifications_queue")
          .select("*")
          .order("created_at", { ascending: false })

        let syncedNotifications = notifications
        if (!notifError && dbNotifications) {
          syncedNotifications = dbNotifications.map((n: Record<string, any>) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            type: n.data?.type || "info",
            task_id: n.data?.task_id || "",
            project_id: n.data?.project_id || "",
            user_name: n.data?.user_name || "System",
            timestamp: n.data?.timestamp || new Date(n.created_at).toLocaleString(),
            resolved: n.read
          }))
        }

        set({ projects: syncedProjects, tasks: syncedTasks, notifications: syncedNotifications })
        localStorage.setItem(`projtrack_projects_${workspaceId}`, JSON.stringify(syncedProjects))
        localStorage.setItem(`projtrack_tasks_${workspaceId}`, JSON.stringify(syncedTasks))
        localStorage.setItem(`projtrack_notifications_${workspaceId}`, JSON.stringify(syncedNotifications))
        setupRealtimeSubscription(supabase, workspaceId)
      }
    } catch (e) {
      console.warn("Supabase fetch failed, running in offline/LocalStorage mode", e)
    }
  },

  // BUG-025 FIXED: Accept description param and set it on newProject
  // BUG-026 FIXED: Accept deadline param so user can set a real deadline
  addProject: async (name: string, type: ProjectType, statuses: StatusConfig[], description?: string, deadline?: string) => {
    const currentUser = get().user
    if (currentUser?.isTeamMember) {
      throw new Error("Team members cannot create projects.")
    }
    const workspaceId = currentUser?.organizationId || "personal"

    const newProject: Project = {
      id: generateUUID(),
      portfolio_id: null,
      organization_id: workspaceId,
      name,
      description: description || "",
      project_type: type,
      budget: null,
      deadline: deadline || new Date(Date.now() + 30 * 86400000).toLocaleDateString(),
      client_name: null,
      location: null,
      health_status: "ON_TRACK",
      is_completed: false,
      custom_fields: null,
      status_config: statuses,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const updatedProjects = [...get().projects, newProject]
    const updatedTasks = { ...get().tasks, [newProject.id]: [] }

    // Instant local save
    set({ projects: updatedProjects, tasks: updatedTasks })
    localStorage.setItem(`projtrack_projects_${workspaceId}`, JSON.stringify(updatedProjects))
    localStorage.setItem(`projtrack_tasks_${workspaceId}`, JSON.stringify(updatedTasks))

    // Background Supabase upsert
    try {
      const supabase = createClient()
      // Ensure the workspace record exists (idempotent)
      await supabase.from("workspaces").upsert({
        id: workspaceId,
        owner_id: workspaceId,
        name: `${currentUser?.fullName || currentUser?.email || "My"}'s Workspace`,
        plan_tier: "free",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: "id", ignoreDuplicates: true })

      await supabase.from("projects").upsert({
        id: newProject.id,
        workspace_id: workspaceId,
        name: newProject.name,
        color: newProject.health_status,
        status: newProject.project_type,
        description: newProject.description,
        deadline: newProject.deadline,
        status_config: statuses // save columns in DB
      })
      await logActivity(newProject.id, null, "project_created", newProject.name)
    } catch (e) {
      console.warn("Supabase save failed, cached in LocalStorage", e)
    }

    return newProject
  },

  deleteProject: async (projectId: string) => {
    const currentUser = get().user
    if (currentUser?.isTeamMember) {
      throw new Error("Team members cannot delete projects.")
    }
    const workspaceId = currentUser?.organizationId || "personal"

    const projectToDelete = get().projects.find((p) => p.id === projectId)
    const updatedProjects = get().projects.filter((p) => p.id !== projectId)
    const updatedTasks = { ...get().tasks }
    delete updatedTasks[projectId]

    set({ projects: updatedProjects, tasks: updatedTasks })
    localStorage.setItem(`projtrack_projects_${workspaceId}`, JSON.stringify(updatedProjects))
    localStorage.setItem(`projtrack_tasks_${workspaceId}`, JSON.stringify(updatedTasks))

    try {
      const supabase = createClient()
      await supabase.from("tasks").delete().eq("project_id", projectId)
      await supabase.from("project_members").delete().eq("project_id", projectId)
      await supabase.from("projects").delete().eq("id", projectId)
    } catch (e) {
      console.warn("Supabase delete failed", e)
    }
  },

  // BUG-024: Accept optional status param so tasks created from column "+" go to the right column
  addTask: async (projectId: string, title: string, priority: Priority, assignee: string, dueDate: string, blocked: boolean, status = "todo") => {
    const currentUser = get().user
    if (currentUser?.isTeamMember) {
      throw new Error("Team members cannot create tasks.")
    }
    const workspaceId = currentUser?.organizationId || "personal"

    const newTask: Task = {
      id: generateUUID(),
      milestone_id: null,
      project_id: projectId,
      title,
      description: blocked ? "BLOCKED: Requires review" : "",
      status,
      priority,
      assignee_id: assignee || null,
      due_date: dueDate || null,
      estimated_hours: null,
      actual_hours: null,
      blocked_reason: blocked ? "Blocked" : null,
      is_critical_path: false,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const currentProjectTasks = get().tasks[projectId] || []
    const updatedTasks = {
      ...get().tasks,
      [projectId]: [...currentProjectTasks, newTask]
    }

    set({ tasks: updatedTasks })
    localStorage.setItem(`projtrack_tasks_${workspaceId}`, JSON.stringify(updatedTasks))

    try {
      const supabase = createClient()
      await supabase.from("tasks").upsert({
        id: newTask.id,
        project_id: newTask.project_id,
        title: newTask.title,
        description: newTask.description || "",
        status: newTask.status,
        priority: newTask.priority,
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
        assignee_id: newTask.assignee_id || null
      })
      await logActivity(projectId, newTask.id, "task_created", title)
    } catch (e) {
      console.warn("Supabase task save failed", e)
    }

    return newTask
  },

  updateTaskStatus: async (projectId: string, taskId: string, newStatus: string) => {
    const currentProjectTasks = get().tasks[projectId] || []
    const task = currentProjectTasks.find(t => t.id === taskId)
    const oldStatus = task?.status || ""
    const taskTitle = task?.title || ""

    const updatedTasksForProject = currentProjectTasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: newStatus, updated_at: new Date().toISOString() }
      }
      return t
    })

    const updatedTasks = {
      ...get().tasks,
      [projectId]: updatedTasksForProject
    }

    set({ tasks: updatedTasks })
    const currentUser = get().user
    const workspaceId = currentUser?.organizationId || "personal"
    localStorage.setItem(`projtrack_tasks_${workspaceId}`, JSON.stringify(updatedTasks))

    try {
      const supabase = createClient()
      await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId)
      await logActivity(projectId, taskId, "status_changed", taskTitle, oldStatus, newStatus)
    } catch (e) {
      console.warn("Supabase task status update failed", e)
    }
  },

  updateTask: async (projectId: string, taskId: string, updates: Partial<Task>) => {
    const currentProjectTasks = get().tasks[projectId] || []
    const task = currentProjectTasks.find(t => t.id === taskId)
    const taskTitle = task?.title || ""

    const updatedTasksForProject = currentProjectTasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, ...updates, updated_at: new Date().toISOString() }
      }
      return t
    })

    const updatedTasks = {
      ...get().tasks,
      [projectId]: updatedTasksForProject
    }

    set({ tasks: updatedTasks })
    const currentUser = get().user
    const workspaceId = currentUser?.organizationId || "personal"
    localStorage.setItem(`projtrack_tasks_${workspaceId}`, JSON.stringify(updatedTasks))

    try {
      const supabase = createClient()
      const updatedTask = updatedTasksForProject.find(t => t.id === taskId)
      if (updatedTask) {
        await supabase.from("tasks").upsert({
          id: updatedTask.id,
          project_id: updatedTask.project_id,
          title: updatedTask.title,
          description: updatedTask.description || "",
          status: updatedTask.status,
          priority: updatedTask.priority,
          due_date: updatedTask.due_date ? new Date(updatedTask.due_date).toISOString() : null,
          assignee_id: updatedTask.assignee_id || null
        })
        await logActivity(projectId, taskId, "task_updated", updatedTask.title)
      }
    } catch (e) {
      console.warn("Supabase task update failed", e)
    }
  },

  deleteTask: async (projectId: string, taskId: string) => {
    const currentProjectTasks = get().tasks[projectId] || []
    const taskToDelete = currentProjectTasks.find(t => t.id === taskId)
    const updatedTasksForProject = currentProjectTasks.filter(t => t.id !== taskId)

    const updatedTasks = {
      ...get().tasks,
      [projectId]: updatedTasksForProject
    }

    set({ tasks: updatedTasks })
    const currentUser = get().user
    const workspaceId = currentUser?.organizationId || "personal"
    localStorage.setItem(`projtrack_tasks_${workspaceId}`, JSON.stringify(updatedTasks))

    try {
      const supabase = createClient()
      await supabase.from("tasks").delete().eq("id", taskId)
      if (taskToDelete) {
        await logActivity(projectId, taskId, "task_deleted", taskToDelete.title)
      }
    } catch (e) {
      console.warn("Supabase task delete failed", e)
    }
  },

  updateProjectDetails: async (projectId: string, name: string, description: string, deadline: string, healthStatus: HealthStatus, isCompleted?: boolean) => {
    const updatedProjects = get().projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          name,
          description,
          deadline,
          health_status: healthStatus,
          is_completed: isCompleted !== undefined ? isCompleted : p.is_completed,
          updated_at: new Date().toISOString()
        }
      }
      return p
    })

    set({ projects: updatedProjects })
    const currentUser = get().user
    const workspaceId = currentUser?.organizationId || "personal"
    localStorage.setItem(`projtrack_projects_${workspaceId}`, JSON.stringify(updatedProjects))

    try {
      const supabase = createClient()
      await supabase.from("projects").update({
        name,
        description,
        deadline,
        color: healthStatus,
        status: isCompleted !== undefined ? (isCompleted ? "COMPLETED" : "SOFTWARE") : undefined,
        updated_at: new Date().toISOString()
      }).eq("id", projectId)
      await logActivity(projectId, null, "project_updated", name)
    } catch (e) {
      console.warn("Supabase project update failed", e)
    }
  },

  updateProjectColumns: async (projectId: string, columns: StatusConfig[]) => {
    const updatedProjects = get().projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          status_config: columns,
          updated_at: new Date().toISOString()
        }
      }
      return p
    })

    set({ projects: updatedProjects })
    const currentUser = get().user
    const workspaceId = currentUser?.organizationId || "personal"
    localStorage.setItem(`projtrack_projects_${workspaceId}`, JSON.stringify(updatedProjects))

    try {
      const supabase = createClient()
      await supabase.from("projects").update({
        status_config: columns,
        updated_at: new Date().toISOString()
      }).eq("id", projectId)
      const project = updatedProjects.find(p => p.id === projectId)
      await logActivity(projectId, null, "columns_updated", project?.name || "Project")
    } catch (e) {
      console.warn("Supabase project columns update failed", e)
    }
  },

  addProjectMember: async (projectId: string, email: string, role: string) => {
    try {
      const supabase = createClient()
      const normalizedEmail = email.trim().toLowerCase()

      // Prevent duplicate enrollment: check if this member is already in this project
      const { data: existing } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("email", normalizedEmail)
        .maybeSingle()

      if (existing) {
        // Already enrolled — do nothing (idempotent)
        return
      }

      await supabase.from("project_members").insert({
        project_id: projectId,
        email: normalizedEmail,
        role: role,
        created_at: new Date().toISOString()
      })

      // Also ensure they are in workspace_members so the assignee dropdown works
      const currentUser = get().user
      const workspaceId = currentUser?.organizationId || "personal"
      await supabase.from("workspace_members").upsert({
        workspace_id: workspaceId,
        user_id: crypto.randomUUID ? crypto.randomUUID() : generateUUID(),
        email: normalizedEmail,
        role: "member",
        custom_title: role === "DEVELOPER" ? "Developer" : role === "CLIENT" ? "Client" : "Viewer",
        created_at: new Date().toISOString()
      }, { onConflict: "workspace_id,email", ignoreDuplicates: true })
      await logActivity(projectId, null, "member_added", normalizedEmail)
    } catch (e) {
      console.warn("Supabase add project member failed", e)
      throw e
    }
  },

  removeProjectMember: async (projectId: string, memberId: string) => {
    try {
      const supabase = createClient()
      const { data: member } = await supabase
        .from("project_members")
        .select("email")
        .eq("id", memberId)
        .maybeSingle()

      await supabase.from("project_members").delete().eq("id", memberId)
      if (member) {
        await logActivity(projectId, null, "member_removed", member.email)
      }
    } catch (e) {
      console.warn("Supabase remove project member failed", e)
      throw e
    }
  },

  syncWithSupabase: async () => {
    try {
      const supabase = createClient()
      const projects = get().projects
      const tasks = get().tasks

      for (const project of projects) {
        await supabase.from("projects").upsert({
          id: project.id,
          name: project.name,
          color: project.health_status,
          status: project.project_type
        })
      }

      for (const projectId of Object.keys(tasks)) {
        for (const task of tasks[projectId]) {
          await supabase.from("tasks").upsert({
            id: task.id,
            project_id: task.project_id,
            title: task.title,
            description: task.description || "",
            status: task.status,
            priority: task.priority,
            due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
            assignee_id: task.assignee_id || null
          })
        }
      }
    } catch (e) {
      console.error("Full Supabase sync failed", e)
    }
  },

  addNotification: async (title, body, type, task_id, project_id, user_name) => {
    const newNotification: AppNotification = {
      id: generateUUID(),
      title,
      body,
      type,
      task_id,
      project_id,
      user_name,
      timestamp: new Date().toLocaleString(),
      resolved: false
    }

    const currentUser = get().user
    const workspaceId = currentUser?.organizationId || "personal"
    const project = get().projects.find(p => p.id === project_id)
    const recipientUserId = project?.organization_id || currentUser?.organizationId || currentUser?.id || null

    const updatedNotifications = [newNotification, ...get().notifications]
    set({ notifications: updatedNotifications })
    localStorage.setItem(`projtrack_notifications_${workspaceId}`, JSON.stringify(updatedNotifications))

    try {
      const supabase = createClient()
      await supabase.from("notifications_queue").insert({
        id: newNotification.id,
        user_id: recipientUserId,
        title: newNotification.title,
        body: newNotification.body,
        read: false,
        data: {
          type: newNotification.type,
          task_id: newNotification.task_id,
          project_id: newNotification.project_id,
          user_name: newNotification.user_name,
          timestamp: newNotification.timestamp
        }
      })
    } catch (e) {
      console.warn("Supabase notification save failed", e)
    }
  },

  resolveNotification: async (notificationId) => {
    const updatedNotifications = get().notifications.map((n) => 
      n.id === notificationId ? { ...n, resolved: true } : n
    )
    set({ notifications: updatedNotifications })
    const currentUser = get().user
    const workspaceId = currentUser?.organizationId || "personal"
    localStorage.setItem(`projtrack_notifications_${workspaceId}`, JSON.stringify(updatedNotifications))

    try {
      const supabase = createClient()
      await supabase.from("notifications_queue").update({ read: true }).eq("id", notificationId)
    } catch (e) {
      console.warn("Supabase notification resolve failed", e)
    }
  }
}))

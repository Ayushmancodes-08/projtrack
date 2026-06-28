import { create } from "zustand"
import type { Project, Task, ProjectType, StatusConfig, Priority, HealthStatus } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

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

type AppState = {
  projects: Project[]
  tasks: Record<string, Task[]> // project_id -> Task[]
  notifications: AppNotification[]
  sidebarCollapsed: boolean
  isLoaded: boolean
  
  // Actions
  toggleSidebar: () => void
  initializeStore: () => Promise<void>
  addProject: (name: string, type: ProjectType, statuses: StatusConfig[], description?: string, deadline?: string) => Promise<Project>
  deleteProject: (projectId: string) => Promise<void>
  addTask: (projectId: string, title: string, priority: Priority, assignee: string, dueDate: string, blocked: boolean, status?: string) => Promise<Task>
  updateTaskStatus: (projectId: string, taskId: string, newStatus: string) => Promise<void>
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

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  tasks: {},
  notifications: [],
  sidebarCollapsed: false,
  isLoaded: false,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  initializeStore: async () => {
    if (typeof window === "undefined") return

    // 1. Load from LocalStorage for instant load / best UX
    const localProjects = localStorage.getItem("projtrack_projects")
    const localTasks = localStorage.getItem("projtrack_tasks")
    const localNotifications = localStorage.getItem("projtrack_notifications")

    const projects: Project[] = localProjects ? JSON.parse(localProjects) : []
    const tasks: Record<string, Task[]> = localTasks ? JSON.parse(localTasks) : {}
    const notifications: AppNotification[] = localNotifications ? JSON.parse(localNotifications) : []

    set({ projects, tasks, notifications, isLoaded: true })

    // 2. Load from Supabase in the background to sync latest data
    try {
      const supabase = createClient()
      
      // Fetch projects
      const { data: dbProjects, error: projError } = await supabase
        .from("projects")
        .select("*")
      
      if (!projError && dbProjects) {
        // Map DB projects to frontend Projects structure
        const syncedProjects: Project[] = dbProjects.map((p: Record<string, unknown>) => {
          const matchedLocal = projects.find((lp) => lp.id === p.id)
          return {
            id: p.id as string,
            portfolio_id: null,
            organization_id: (p.workspace_id as string) || "personal",
            name: p.name as string,
            description: "",
            project_type: (p.status as ProjectType) || matchedLocal?.project_type || "SOFTWARE",
            budget: null,
            deadline: matchedLocal?.deadline || null,
            client_name: null,
            location: null,
            health_status: (p.color as HealthStatus) || "ON_TRACK",
            is_completed: false,
            custom_fields: null,
            status_config: matchedLocal?.status_config || [],
            created_at: p.created_at as string,
            updated_at: p.updated_at as string
          }
        })

        // Fetch tasks
        const { data: dbTasks, error: taskError } = await supabase
          .from("tasks")
          .select("*")

        if (!taskError && dbTasks) {
          const syncedTasks: Record<string, Task[]> = {}
          
          // BUG-005 FIXED: Replace `any` with SupabaseTaskRow
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
          localStorage.setItem("projtrack_projects", JSON.stringify(syncedProjects))
          localStorage.setItem("projtrack_tasks", JSON.stringify(syncedTasks))
          localStorage.setItem("projtrack_notifications", JSON.stringify(syncedNotifications))
        }
      }
    } catch (e) {
      console.warn("Supabase fetch failed, running in offline/LocalStorage mode", e)
    }
  },

  // BUG-025 FIXED: Accept description param and set it on newProject
  // BUG-026 FIXED: Accept deadline param so user can set a real deadline
  addProject: async (name: string, type: ProjectType, statuses: StatusConfig[], description?: string, deadline?: string) => {
    const newProject: Project = {
      id: generateUUID(),
      portfolio_id: null,
      organization_id: "personal",
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
    localStorage.setItem("projtrack_projects", JSON.stringify(updatedProjects))
    localStorage.setItem("projtrack_tasks", JSON.stringify(updatedTasks))

    // Background Supabase upsert
    try {
      const supabase = createClient()
      await supabase.from("projects").upsert({
        id: newProject.id,
        name: newProject.name,
        color: newProject.health_status,
        status: newProject.project_type
      })
    } catch (e) {
      console.warn("Supabase save failed, cached in LocalStorage", e)
    }

    return newProject
  },

  deleteProject: async (projectId: string) => {
    const updatedProjects = get().projects.filter((p) => p.id !== projectId)
    const updatedTasks = { ...get().tasks }
    delete updatedTasks[projectId]

    set({ projects: updatedProjects, tasks: updatedTasks })
    localStorage.setItem("projtrack_projects", JSON.stringify(updatedProjects))
    localStorage.setItem("projtrack_tasks", JSON.stringify(updatedTasks))

    try {
      const supabase = createClient()
      await supabase.from("projects").delete().eq("id", projectId)
      await supabase.from("tasks").delete().eq("project_id", projectId)
    } catch (e) {
      console.warn("Supabase delete failed", e)
    }
  },

  // BUG-024: Accept optional status param so tasks created from column "+" go to the right column
  addTask: async (projectId: string, title: string, priority: Priority, assignee: string, dueDate: string, blocked: boolean, status = "todo") => {
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
    localStorage.setItem("projtrack_tasks", JSON.stringify(updatedTasks))

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
        assignee_id: null // optional UI lookup
      })
    } catch (e) {
      console.warn("Supabase task save failed", e)
    }

    return newTask
  },

  updateTaskStatus: async (projectId: string, taskId: string, newStatus: string) => {
    const currentProjectTasks = get().tasks[projectId] || []
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
    localStorage.setItem("projtrack_tasks", JSON.stringify(updatedTasks))

    try {
      const supabase = createClient()
      await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId)
    } catch (e) {
      console.warn("Supabase task status update failed", e)
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
            due_date: task.due_date ? new Date(task.due_date).toISOString() : null
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

    const updatedNotifications = [newNotification, ...get().notifications]
    set({ notifications: updatedNotifications })
    localStorage.setItem("projtrack_notifications", JSON.stringify(updatedNotifications))

    try {
      const supabase = createClient()
      await supabase.from("notifications_queue").insert({
        id: newNotification.id,
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
    localStorage.setItem("projtrack_notifications", JSON.stringify(updatedNotifications))

    try {
      const supabase = createClient()
      await supabase.from("notifications_queue").update({ read: true }).eq("id", notificationId)
    } catch (e) {
      console.warn("Supabase notification resolve failed", e)
    }
  }
}))

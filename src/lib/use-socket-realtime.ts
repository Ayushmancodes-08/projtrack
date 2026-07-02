/**
 * useSocketRealtime — Client-side Socket.io hook for real-time Kanban board updates.
 * 
 * Connects to the Socket.io server running on the custom Next.js server,
 * joins the project room, and listens for task status change events.
 * When a remote user moves a task, this hook updates the Zustand store immediately
 * so all connected clients (admin + team members) see the change live.
 */
"use client"

import { useEffect, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { useAppStore } from "@/store/app-store"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// Singleton socket instance shared across the app
let globalSocket: Socket | null = null
// Track all project rooms this socket has joined so we can re-join after reconnect
const joinedProjectRooms = new Set<string>()

function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io({
      path: "/api/socket",
      addTrailingSlash: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    // Re-join all tracked rooms after a reconnect
    globalSocket.on("connect", () => {
      joinedProjectRooms.forEach((roomId) => {
        globalSocket?.emit("join-project", roomId)
      })
    })
  }
  return globalSocket
}

/**
 * Pull the latest task list for a project directly from Supabase and
 * merge it into the Zustand store. Used as a fallback when the socket
 * event might have been missed (e.g. admin wasn't in the room yet).
 */
async function refreshProjectTasksFromDB(projectId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
    if (error || !data) return

    const currentState = useAppStore.getState()
    const workspaceId = currentState.user?.organizationId || "personal"
    const updatedTasks = {
      ...currentState.tasks,
      [projectId]: data.map((t: any) => ({
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
        blocked_reason:
          t.description && t.description.startsWith("BLOCKED:") ? t.description : null,
        is_critical_path: false,
        sort_order: 0,
        created_at: t.created_at,
        updated_at: t.updated_at,
      })),
    }
    useAppStore.setState({ tasks: updatedTasks })
    localStorage.setItem(
      `projtrack_tasks_${workspaceId}`,
      JSON.stringify(updatedTasks)
    )
  } catch (e) {
    console.warn("[useSocketRealtime] refreshProjectTasksFromDB failed", e)
  }
}

export type TaskStatusChangedPayload = {
  projectId: string
  taskId: string
  newStatus: string
  taskTitle: string
  updatedBy: string
  timestamp: string
}

type UseSocketRealtimeOptions = {
  projectId: string
  userName?: string
}

export function useSocketRealtime({ projectId, userName = "Someone" }: UseSocketRealtimeOptions) {
  const socketRef = useRef<Socket | null>(null)
  // Keep a ref to userName so callbacks always read the latest value without
  // needing to be re-registered (avoids stale closure on userName)
  const userNameRef = useRef(userName)
  useEffect(() => { userNameRef.current = userName }, [userName])

  // Emit a task status update to the socket server (called after local updateTaskStatus)
  const emitTaskStatusUpdate = useCallback(
    (taskId: string, newStatus: string, taskTitle: string) => {
      const socket = socketRef.current
      if (!socket) return
      const payload = {
        projectId,
        taskId,
        newStatus,
        taskTitle,
        updatedBy: userNameRef.current,
        timestamp: new Date().toISOString(),
      }
      if (socket.connected) {
        socket.emit("task-status-updated", payload)
      } else {
        // Socket not connected — wait for reconnect then emit
        socket.once("connect", () => socket.emit("task-status-updated", payload))
      }
    },
    [projectId]
  )

  // Emit a task created event
  const emitTaskCreated = useCallback(
    (task: any) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("task-created", { projectId, task })
      }
    },
    [projectId]
  )

  // Emit a task deleted event
  const emitTaskDeleted = useCallback(
    (taskId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("task-deleted", { projectId, taskId })
      }
    },
    [projectId]
  )

  useEffect(() => {
    const socket = getSocket()
    socketRef.current = socket

    // Track and join this project's room
    const joinRoom = () => {
      joinedProjectRooms.add(projectId)
      socket.emit("join-project", projectId)
      console.log(`[Socket.io] Joined project room: ${projectId}`)
    }

    if (socket.connected) {
      joinRoom()
    } else {
      // Will be joined via the global "connect" handler in getSocket()
      // but we still need to track it so the reconnect handler picks it up
      joinedProjectRooms.add(projectId)
    }

    const handleConnect = () => {
      console.log(`[Socket.io] Connected: ${socket.id}`)
      // joinRoom is already handled by the global reconnect handler in getSocket()
      // but call again here to be safe on the first connection
      joinRoom()
    }

    const handleDisconnect = (reason: string) => {
      console.log(`[Socket.io] Disconnected: ${reason}`)
    }

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)

    // Handle incoming task status change from another user
    const handleTaskStatusChanged = (payload: TaskStatusChangedPayload) => {
      const { taskId, newStatus, taskTitle, updatedBy } = payload

      // Only handle events for this project
      if (payload.projectId && payload.projectId !== projectId) return

      const state = useAppStore.getState()
      const currentTasks = state.tasks[projectId] || []

      // Check if the task actually exists in our store
      const taskExists = currentTasks.some((t) => t.id === taskId)

      if (!taskExists) {
        // Task not in store yet — pull fresh from DB to be safe
        refreshProjectTasksFromDB(projectId).then(() => {
          toast.info(`"${taskTitle}" moved to ${newStatus} by ${updatedBy}`, {
            duration: 4000,
            description: "Kanban board updated in real-time",
          })
        })
        return
      }

      const updatedTasksForProject = currentTasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, status: newStatus, updated_at: new Date().toISOString() }
        }
        return t
      })

      const updatedTasks = {
        ...useAppStore.getState().tasks,
        [projectId]: updatedTasksForProject,
      }

      // Update the Zustand store directly — propagates to all subscribed components
      useAppStore.setState({ tasks: updatedTasks })
      const workspaceId = state.user?.organizationId || "personal"
      localStorage.setItem(`projtrack_tasks_${workspaceId}`, JSON.stringify(updatedTasks))

      toast.info(`"${taskTitle}" moved to ${newStatus} by ${updatedBy}`, {
        duration: 4000,
        description: "Kanban board updated in real-time",
      })
    }

    // Handle incoming task addition from another user
    const handleTaskAdded = (payload: { projectId: string; task: any }) => {
      if (payload.projectId !== projectId) return
      // Pull fresh tasks from DB rather than re-running full initializeStore
      refreshProjectTasksFromDB(projectId)
    }

    // Handle incoming task removal from another user
    const handleTaskRemoved = (payload: { projectId: string; taskId: string }) => {
      if (payload.projectId !== projectId) return
      const currentTasks = useAppStore.getState().tasks[projectId] || []
      const taskToRemove = currentTasks.find((t) => t.id === payload.taskId)
      if (taskToRemove) {
        toast.info(`Task "${taskToRemove.title}" was removed from the board.`)
      }
      const updatedTasks = { ...useAppStore.getState().tasks }
      updatedTasks[projectId] = (updatedTasks[projectId] || []).filter(
        (t) => t.id !== payload.taskId
      )
      useAppStore.setState({ tasks: updatedTasks })
    }

    socket.on("task-status-changed", handleTaskStatusChanged)
    socket.on("task-added", handleTaskAdded)
    socket.on("task-removed", handleTaskRemoved)

    return () => {
      joinedProjectRooms.delete(projectId)
      socket.emit("leave-project", projectId)
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("task-status-changed", handleTaskStatusChanged)
      socket.off("task-added", handleTaskAdded)
      socket.off("task-removed", handleTaskRemoved)
    }
  }, [projectId])

  return { emitTaskStatusUpdate, emitTaskCreated, emitTaskDeleted }
}

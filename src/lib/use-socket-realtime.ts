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
import { toast } from "sonner"

// Singleton socket instance shared across the app
let globalSocket: Socket | null = null

function getSocket(): Socket {
  if (!globalSocket || !globalSocket.connected) {
    globalSocket = io({
      path: "/api/socket",
      addTrailingSlash: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
  }
  return globalSocket
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
  const { tasks, updateTaskStatus } = useAppStore()

  // Emit a task status update to the socket server (called after local updateTaskStatus)
  const emitTaskStatusUpdate = useCallback(
    (taskId: string, newStatus: string, taskTitle: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("task-status-updated", {
          projectId,
          taskId,
          newStatus,
          taskTitle,
          updatedBy: userName,
        })
      }
    },
    [projectId, userName]
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

    // Join this project's room
    const joinRoom = () => {
      socket.emit("join-project", projectId)
    }

    if (socket.connected) {
      joinRoom()
    }

    socket.on("connect", () => {
      console.log(`[Socket.io] Connected: ${socket.id}`)
      joinRoom()
    })

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.io] Disconnected: ${reason}`)
    })

    // Handle incoming task status change from another user
    const handleTaskStatusChanged = (payload: TaskStatusChangedPayload) => {
      const { taskId, newStatus, taskTitle, updatedBy } = payload

      const currentTasks = useAppStore.getState().tasks[projectId] || []
      const updatedTasksForProject = currentTasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, status: newStatus, updated_at: new Date().toISOString() }
        }
        return t
      })

      const updatedTasks = {
        ...useAppStore.getState().tasks,
        [projectId]: updatedTasksForProject
      }

      // Update the Zustand store directly — this propagates to all components without calling Supabase again
      useAppStore.setState({ tasks: updatedTasks })
      const workspaceId = useAppStore.getState().user?.organizationId || "personal"
      localStorage.setItem(`projtrack_tasks_${workspaceId}`, JSON.stringify(updatedTasks))

      toast.info(`"${taskTitle}" moved to ${newStatus} by ${updatedBy}`, {
        duration: 4000,
        description: "Kanban board updated in real-time",
      })
    }

    // Handle incoming task addition from another user
    const handleTaskAdded = (payload: { projectId: string; task: any }) => {
      if (payload.projectId !== projectId) return
      // Re-initialize store to pick up new task from DB
      const user = useAppStore.getState().user
      if (user) {
        useAppStore.getState().initializeStore(user)
      }
    }

    // Handle incoming task removal from another user
    const handleTaskRemoved = (payload: { projectId: string; taskId: string }) => {
      if (payload.projectId !== projectId) return
      const currentTasks = useAppStore.getState().tasks[projectId] || []
      const taskToRemove = currentTasks.find((t) => t.id === payload.taskId)
      if (taskToRemove) {
        toast.info(`Task "${taskToRemove.title}" was removed from the board.`)
      }
      // Update store to remove the task locally
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
      socket.emit("leave-project", projectId)
      socket.off("connect", joinRoom)
      socket.off("task-status-changed", handleTaskStatusChanged)
      socket.off("task-added", handleTaskAdded)
      socket.off("task-removed", handleTaskRemoved)
    }
  }, [projectId])

  return { emitTaskStatusUpdate, emitTaskCreated, emitTaskDeleted }
}

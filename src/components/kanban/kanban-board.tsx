"use client"

import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import type { StatusConfig } from "@/lib/types"
import { PRIORITIES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Plus, MessageSquare, Paperclip, Eye, HelpCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2, ArrowUp, ArrowDown, Check } from "lucide-react"

type KanbanTask = {
  id: string
  title: string
  priority?: string
  assignee?: string
  dueDate?: string
  comments?: number
  attachments?: number
  blocked?: boolean
}

type KanbanBoardProps = {
  statuses: StatusConfig[]
  tasks: Record<string, KanbanTask[]>
  projectId: string
  updateTaskStatus: (projectId: string, taskId: string, newStatus: string) => Promise<void>
  onTaskClick?: (taskId: string) => void
  onAddTask?: (statusId: string) => void
  isAdmin: boolean
  userName: string
  addNotification: (title: string, body: string, type: "review_request" | "info", task_id: string, project_id: string, user_name: string) => Promise<void>
  onUpdateColumns?: (projectId: string, columns: StatusConfig[]) => Promise<void>
  userEmail?: string
  isTeamMember?: boolean
}

const bgColorMap: Record<string, string> = {
  slate: "bg-slate-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  crimson: "bg-red-500",
  teal: "bg-teal-500",
  indigo: "bg-indigo-500",
}

const borderColorMap: Record<string, string> = {
  slate: "border-slate-300 focus-within:border-slate-400",
  blue: "border-blue-400 focus-within:border-blue-500",
  amber: "border-amber-400 focus-within:border-amber-500",
  green: "border-green-400 focus-within:border-green-500",
  purple: "border-purple-400 focus-within:border-purple-500",
  crimson: "border-red-400 focus-within:border-red-500",
  teal: "border-teal-400 focus-within:border-teal-500",
  indigo: "border-indigo-400 focus-within:border-indigo-500",
}

const columnColorAccentMap: Record<string, string> = {
  slate: "bg-slate-55 border-slate-200",
  blue: "bg-blue-50/20 border-blue-200",
  amber: "bg-amber-50/20 border-amber-200",
  green: "bg-green-50/30 border-green-200",
  purple: "bg-purple-50/20 border-purple-200",
  crimson: "bg-red-50/20 border-red-200",
  teal: "bg-teal-50/20 border-teal-200",
  indigo: "bg-indigo-50/20 border-indigo-200",
}

// Default WIP Limits for standard software columns
const DEFAULT_WIP_LIMITS: Record<string, number> = {
  backlog: 5,
  todo: 3,         // Planned
  in_progress: 2,  // In Progress (Simulate limit warning as we have 2 tasks)
  review: 2,       // Review
  done: 8,         // Complete
}

export function KanbanBoard({ statuses, tasks, projectId, updateTaskStatus, onTaskClick, onAddTask, isAdmin, userName, addNotification, onUpdateColumns, userEmail = "", isTeamMember = false }: KanbanBoardProps) {
  // BUG-002 FIXED: No longer using local useState(initialTasks). Tasks come directly from the prop,
  // which is derived from the global store in the parent page. Local state only for UI overlays.

  const [localTasks, setLocalTasks] = useState(tasks)

  // Keep local state in sync when prop changes (e.g. new task added from dialog or updated via realtime)
  const tasksStr = JSON.stringify(tasks)
  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasksStr])

  // Interactive Kanban visual overlays states matching the diagram legend
  const [showVisualSignals, setShowVisualSignals] = useState(true)
  const [showColumns, setShowColumns] = useState(true)
  const [showWipLimits, setShowWipLimits] = useState(true)
  const [showCommitment, setShowCommitment] = useState(true)
  const [showDelivery, setShowDelivery] = useState(true)

  // Customizable WIP limits
  const [wipLimits, setWipLimits] = useState<Record<string, number>>(DEFAULT_WIP_LIMITS)

  // Column management state
  const [isManageColsOpen, setIsManageColsOpen] = useState(false)
  const [tempCols, setTempCols] = useState<StatusConfig[]>([])
  const [isSavingCols, setIsSavingCols] = useState(false)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { source, destination } = result
    const sourceCol = source.droppableId
    const destCol = destination.droppableId

    // Restrict task dragging so only the assigned user of a task can move it (admins/others cannot drag it) unless they are admin
    const taskToMove = (localTasks[sourceCol] || [])[source.index]
    if (!isAdmin) {
      if (!taskToMove || !taskToMove.assignee || taskToMove.assignee.trim().toLowerCase() !== userEmail.trim().toLowerCase()) {
        toast.error("Only the assigned user can move this task.")
        return
      }
    }

    if (sourceCol === destCol) {
      const column = [...(localTasks[sourceCol] || [])]
      const [removed] = column.splice(source.index, 1)
      column.splice(destination.index, 0, removed)
      setLocalTasks({ ...localTasks, [sourceCol]: column })
    } else {
      const destStatus = statuses.find((s) => s.id === destCol)
      const isDestComplete = destStatus?.category === "done" || destCol === "completed" || destCol === "done" || destCol === "complete" || destCol === "wrapped" || destCol === "live" || destCol === "published"

      if (isDestComplete && !isAdmin) {
        // Find if there is a "review" column
        const reviewStatus = statuses.find((s) => s.category === "review" || s.id === "review" || s.id === "finishing" || s.id === "finalizing")
        
        if (reviewStatus) {
          toast.warning(`Only Project Managers (Admins) can complete tasks. Moving task to "${reviewStatus.label}" for approval.`, {
            duration: 5000
          })
          
          if (sourceCol === reviewStatus.id) return

          const sourceColumn = [...(localTasks[sourceCol] || [])]
          const reviewColumn = [...(localTasks[reviewStatus.id] || [])]
          const [removed] = sourceColumn.splice(source.index, 1)
          
          reviewColumn.splice(0, 0, removed)
          setLocalTasks({ ...localTasks, [sourceCol]: sourceColumn, [reviewStatus.id]: reviewColumn })

          updateTaskStatus(projectId, removed.id, reviewStatus.id).catch((e) => {
            console.error("Failed to update task status", e)
          })

          // Add notification for the admin
          addNotification(
            "Review Confirmation Required",
            `Team member "${userName}" requested approval to complete task "${removed.title}".`,
            "review_request",
            removed.id,
            projectId,
            userName
          )
        } else {
          toast.error("Only Project Managers (Admins) can mark tasks as complete.", {
            duration: 4000
          })
        }
        return
      }

      const isDestReview = destStatus?.category === "review" || destCol === "review" || destCol === "finishing" || destCol === "finalizing"
      const sourceColumn = [...(localTasks[sourceCol] || [])]
      const destColumn = [...(localTasks[destCol] || [])]
      const [removed] = sourceColumn.splice(source.index, 1)
      destColumn.splice(destination.index, 0, removed)
      setLocalTasks({ ...localTasks, [sourceCol]: sourceColumn, [destCol]: destColumn })

      // BUG-001 FIXED: Persist the status change to global store + Supabase
      updateTaskStatus(projectId, removed.id, destCol).catch((e) => {
        console.error("Failed to update task status", e)
      })

      if (isDestReview && !isAdmin) {
        addNotification(
          "Task Submitted for Review",
          `Team member "${userName}" moved task "${removed.title}" to Review.`,
          "review_request",
          removed.id,
          projectId,
          userName
        )
        toast.info(`Task submitted for review. Admin has been notified.`)
      }
    }
  }

  const updateWipLimit = (statusId: string, limit: number) => {
    setWipLimits(prev => ({
      ...prev,
      [statusId]: Math.max(1, limit)
    }))
  }

  // Tooltip/hover state for Kanban overlay controls and signals
  const [hoveredOverlay, setHoveredOverlay] = useState<string | null>(null)
  const [hoveredTaskSignal, setHoveredTaskSignal] = useState<string | null>(null)

  return (
    <div className="space-y-5 flex flex-col h-full min-h-0">
      {/* Kanban Interactive Principles Panel / Legend */}
      <div className="flex flex-col gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-navy" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Kanban Framework Overlay Controls</h3>
          </div>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <HelpCircle className="h-3 w-3 text-gold-dark" /> Click or hover to inspect framework indicators
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 relative">
          <div
            className="relative"
            onMouseEnter={() => setHoveredOverlay("visual_signals")}
            onMouseLeave={() => setHoveredOverlay(null)}
          >
            <button
              onClick={() => setShowVisualSignals(!showVisualSignals)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs cursor-pointer",
                showVisualSignals 
                  ? "border-red-200 bg-red-50 text-red-700 ring-1 ring-red-300/50" 
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              )}
            >
              <span className={cn("h-3 w-3 rounded-full border-2", showVisualSignals ? "bg-red-500 border-red-200 animate-pulse" : "bg-slate-300 border-white")} />
              Visual signals
            </button>
            {hoveredOverlay === "visual_signals" && (
              <div className="absolute top-full left-0 mt-2 w-64 z-50 rounded-xl bg-navy p-3 text-white shadow-xl text-[11px] animate-in fade-in-0 zoom-in-95">
                <p className="font-bold text-gold">🔴 Visual Signals</p>
                <p className="text-slate-200 mt-1 leading-snug">
                  Highlights blocked tasks or critical bottlenecks with prominent red visual badges so team members immediately notice stuck work.
                </p>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setHoveredOverlay("columns")}
            onMouseLeave={() => setHoveredOverlay(null)}
          >
            <button
              onClick={() => setShowColumns(!showColumns)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs cursor-pointer",
                showColumns 
                  ? "border-amber-200 bg-amber-50 text-amber-700" 
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              )}
            >
              <span className={cn("h-3 w-3 rounded-full border-2", showColumns ? "bg-amber-500 border-amber-200" : "bg-slate-300 border-white")} />
              Columns
            </button>
            {hoveredOverlay === "columns" && (
              <div className="absolute top-full left-0 mt-2 w-64 z-50 rounded-xl bg-navy p-3 text-white shadow-xl text-[11px] animate-in fade-in-0 zoom-in-95">
                <p className="font-bold text-amber-300">📋 Workflow Columns</p>
                <p className="text-slate-200 mt-1 leading-snug">
                  Visualizes each distinct state of work (e.g. Planning, In Progress, Review, Done) representing value stream flow.
                </p>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setHoveredOverlay("wip_limits")}
            onMouseLeave={() => setHoveredOverlay(null)}
          >
            <button
              onClick={() => setShowWipLimits(!showWipLimits)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs cursor-pointer",
                showWipLimits 
                  ? "border-purple-200 bg-purple-50 text-purple-700" 
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              )}
            >
              <span className={cn("h-3 w-3 rounded-full border-2", showWipLimits ? "bg-purple-500 border-purple-200" : "bg-slate-300 border-white")} />
              Work-in-progress limit
            </button>
            {hoveredOverlay === "wip_limits" && (
              <div className="absolute top-full left-0 mt-2 w-64 z-50 rounded-xl bg-navy p-3 text-white shadow-xl text-[11px] animate-in fade-in-0 zoom-in-95">
                <p className="font-bold text-purple-300">⚡ WIP (Work-In-Progress) Limits</p>
                <p className="text-slate-200 mt-1 leading-snug">
                  Restricts maximum active tasks per stage to prevent multitasking and eliminate workflow traffic jams.
                </p>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setHoveredOverlay("commitment")}
            onMouseLeave={() => setHoveredOverlay(null)}
          >
            <button
              onClick={() => setShowCommitment(!showCommitment)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs cursor-pointer",
                showCommitment 
                  ? "border-teal-200 bg-teal-50 text-teal-700" 
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              )}
            >
              <span className={cn("h-3 w-3 rounded-full border-2", showCommitment ? "bg-teal-500 border-teal-200" : "bg-slate-300 border-white")} />
              Commitment point
            </button>
            {hoveredOverlay === "commitment" && (
              <div className="absolute top-full left-0 mt-2 w-64 z-50 rounded-xl bg-navy p-3 text-white shadow-xl text-[11px] animate-in fade-in-0 zoom-in-95">
                <p className="font-bold text-teal-300">🎯 Commitment Point</p>
                <p className="text-slate-200 mt-1 leading-snug">
                  The boundary where an idea or backlog item is formally committed by the team for development.
                </p>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setHoveredOverlay("delivery")}
            onMouseLeave={() => setHoveredOverlay(null)}
          >
            <button
              onClick={() => setShowDelivery(!showDelivery)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs cursor-pointer",
                showDelivery 
                  ? "border-green-200 bg-green-50 text-green-700" 
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              )}
            >
              <span className={cn("h-3 w-3 rounded-full border-2", showDelivery ? "bg-green-500 border-green-200" : "bg-slate-300 border-white")} />
              Delivery point
            </button>
            {hoveredOverlay === "delivery" && (
              <div className="absolute top-full left-0 mt-2 w-64 z-50 rounded-xl bg-navy p-3 text-white shadow-xl text-[11px] animate-in fade-in-0 zoom-in-95">
                <p className="font-bold text-green-300">🚀 Delivery Point</p>
                <p className="text-slate-200 mt-1 leading-snug">
                  The final completed stage where completed work is delivered, released, and closed.
                </p>
              </div>
            )}
          </div>

          {isAdmin && onUpdateColumns && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTempCols(statuses)
                setIsManageColsOpen(true)
              }}
              className="h-8 border-gold text-gold-dark hover:bg-gold/5 text-xs font-semibold cursor-pointer ml-auto"
            >
              Manage Columns
            </Button>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-5 overflow-x-auto scrollbar-clean pb-8 flex-1 min-h-0 items-stretch">
          {statuses.map((status) => {
            const isBacklog = status.id === "backlog" || status.id === "planning" || status.id === "brief" || status.id === "question" || status.id === "not_started" || status.id === "idea"
            const isPlanned = status.id === "todo"
            const isComplete = status.id === "done" || status.id === "complete" || status.id === "wrapped" || status.id === "live" || status.id === "published"
            const colTasks = localTasks[status.id] || []
            const currentWipLimit = wipLimits[status.id] || 5
            const isWipExceeded = !isBacklog && colTasks.length > currentWipLimit

            return (
              <div 
                key={status.id} 
                className={cn(
                  "flex w-84 min-w-[320px] max-w-[360px] h-full shrink-0 flex-col rounded-2xl border transition-all duration-300 relative shadow-sm",
                  showColumns 
                    ? cn("border-2", borderColorMap[status.color] || "border-slate-200") 
                    : "border-slate-100 shadow-none",
                  showColumns 
                    ? columnColorAccentMap[status.color] || "bg-slate-50/50" 
                    : "bg-slate-50/70",
                  // Red background warning on column if WIP exceeded
                  showWipLimits && isWipExceeded && "bg-red-50/40 border-red-300 shadow-red-100/30",
                  // Soft green overlay for completed delivery column
                  showDelivery && isComplete && "bg-green-50/40 border-green-400"
                )}
              >
                {/* Commitment Point Boundary on Backlog Column */}
                {showCommitment && isBacklog && (
                  <div className="absolute -right-[12px] top-4 bottom-4 w-[2px] border-r-2 border-dashed border-teal-500 z-20 flex items-center justify-center">
                    <span className="bg-teal-500 text-[8px] text-white font-extrabold px-1.5 py-0.5 rounded shadow-sm tracking-wider uppercase whitespace-nowrap rotate-90 origin-center">
                      Commitment Point
                    </span>
                  </div>
                )}

                {/* Visual Signals / Commitment / Delivery indicator points on column header */}
                {showCommitment && isPlanned && (
                  <div className="absolute -top-2.5 -right-2.5 z-10 flex h-6 w-6 animate-pulse items-center justify-center rounded-full bg-teal-500 text-white shadow-md ring-4 ring-teal-100">
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
                {showDelivery && isComplete && (
                  <div className="absolute -top-2.5 -right-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-md ring-4 ring-green-100">
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}

                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-white/60 backdrop-blur-xs rounded-t-2xl">
                  <div className="flex items-center gap-2.5 w-full">
                    {/* Status Color Badge/Dot */}
                    <div className={cn("h-3 w-3 rounded-full ring-2 ring-white", bgColorMap[status.color] || "bg-slate-400")} />
                    
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-navy/90">
                          {status.label}
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">
                          {colTasks.length} {colTasks.length === 1 ? "task" : "tasks"}
                        </span>
                      </div>
                      
                      {/* WIP Limit Display and Configurator */}
                      {showWipLimits && (
                        <div className="flex items-center gap-1 mt-1">
                          {isBacklog ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 shadow-xs">
                              WIP: {colTasks.length} (Infinite)
                            </span>
                          ) : (
                            <>
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold shadow-xs",
                                isWipExceeded
                                  ? "bg-red-100 text-red-700 animate-bounce"
                                  : "bg-purple-100 text-purple-800"
                              )}>
                                WIP Limit: {colTasks.length}/{currentWipLimit}
                              </span>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={currentWipLimit}
                                onChange={(e) => updateWipLimit(status.id, parseInt(e.target.value) || 1)}
                                className="w-9 h-4 text-[9px] border rounded bg-white text-center focus:outline-none text-slate-600 font-semibold cursor-pointer"
                                title="Edit WIP Limit"
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Droppable Area for tasks */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-b-2xl">
                  <Droppable droppableId={status.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "flex flex-col gap-3.5 p-3.5 flex-1 overflow-y-auto scrollbar-clean transition-all duration-200 min-h-[350px]",
                          snapshot.isDraggingOver && "bg-navy/[0.03]"
                        )}
                      >
                      {colTasks.map((task, index) => {
                        const priority = PRIORITIES.find((p) => p.value === task.priority)
                        const hasVisualSignal = showVisualSignals && (task.blocked || task.priority === "CRITICAL")
                        
                        // Restrict dragging so only the assigned user of a task can move it (admins/others cannot drag it)
                        const isAssignedToMe = !!(task.assignee && task.assignee.trim().toLowerCase() === userEmail.trim().toLowerCase())
                        const isDragDisabled = !isAssignedToMe

                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style as React.CSSProperties}
                                onClick={() => onTaskClick?.(task.id)}
                                className={cn(
                                  "group relative rounded-xl border bg-white p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5",
                                  snapshot.isDragging
                                    ? "shadow-elevated rotate-1 scale-[1.02] ring-2 ring-gold"
                                    : "border-slate-200/80 hover:border-slate-300",
                                  // Visual Signal: Red border and highlight indicator if active and task is blocked/critical
                                  hasVisualSignal && "border-red-400 ring-2 ring-red-100 bg-red-50/10",
                                  // Dull mode for other members' tasks
                                  isDragDisabled && "opacity-60 hover:opacity-80"
                                )}
                              >
                                {/* Red visual signal circle in card corner with hover reason */}
                                {hasVisualSignal && (
                                  <div
                                    className="absolute -top-1.5 -right-1.5"
                                    onMouseEnter={(e) => {
                                      e.stopPropagation()
                                      setHoveredTaskSignal(task.id)
                                    }}
                                    onMouseLeave={(e) => {
                                      e.stopPropagation()
                                      setHoveredTaskSignal(null)
                                    }}
                                  >
                                    <span className="relative flex h-4 w-4">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white shadow-xs" />
                                    </span>

                                    {hoveredTaskSignal === task.id && (
                                      <div className="absolute right-0 top-full mt-1.5 w-60 z-50 rounded-xl bg-navy p-3 text-white shadow-2xl text-[10px] animate-in fade-in-0 zoom-in-95">
                                        <p className="font-bold text-red-400 flex items-center gap-1">
                                          <AlertCircle className="h-3 w-3" />
                                          Visual Signal / Blocker
                                        </p>
                                        <p className="mt-1 text-slate-200 leading-snug">
                                          {task.blocked
                                            ? "This task is blocked by external dependencies or blockers. PM intervention is required."
                                            : "Marked as CRITICAL priority. Needs immediate attention to avoid project delays."}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-start justify-between gap-2">
                                  {priority && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[9px] font-semibold tracking-wide px-2 py-0.5 h-4.5",
                                        priority.color
                                      )}
                                    >
                                      {task.priority}
                                    </Badge>
                                  )}
                                  {task.blocked && (
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                                      <AlertCircle className="h-3 w-3 text-red-600" />
                                      Blocked
                                    </span>
                                  )}
                                </div>
                                
                                <p className="mt-2.5 text-xs font-semibold leading-normal text-navy line-clamp-3">
                                  {task.title}
                                </p>

                                {isAdmin && (status.category === "review" || status.id === "review" || status.id === "finishing" || status.id === "finalizing") && (
                                  <div className="mt-3 pt-2.5 border-t border-dashed border-slate-100 flex justify-end">
                                    <Button
                                      size="xs"
                                      onClick={async (e) => {
                                        e.stopPropagation()
                                        const doneStatusId = statuses.find((s) => s.category === "done")?.id || "done"
                                        try {
                                          await updateTaskStatus(projectId, task.id, doneStatusId)
                                          toast.success(`Task "${task.title}" verified & completed!`)
                                        } catch (err) {
                                          toast.error("Failed to complete task")
                                        }
                                      }}
                                      className="bg-green-600 hover:bg-green-700 text-white text-[10px] h-6 px-2 font-medium flex items-center gap-1 rounded border-0 cursor-pointer"
                                    >
                                      <Check className="h-3 w-3" />
                                      Verified & Mark as Complete
                                    </Button>
                                  </div>
                                )}
                                
                                <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                                  <div className="flex items-center gap-2">
                                    {task.assignee ? (
                                      <div className="flex items-center gap-1.5">
                                        <Avatar className="h-5 w-5 ring-1 ring-slate-200">
                                          <AvatarFallback className="text-[7px] font-semibold bg-navy/10 text-navy">
                                            {task.assignee.substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[110px]">
                                          {task.assignee}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground/60 italic">Unassigned</span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    {task.dueDate && (
                                      <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {task.dueDate}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
              </div>
            )
          })}
        </div>
      </DragDropContext>
      {/* Column Management Modal */}
      <Dialog open={isManageColsOpen} onOpenChange={setIsManageColsOpen}>
        <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden shadow-2xl rounded-2xl bg-white max-h-[80vh] flex flex-col">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="text-lg font-bold text-navy">Manage Kanban Columns</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Customize your workflow stages</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newId = `col_${Math.random().toString(36).substring(2, 9)}`
                  const colors = ["blue", "amber", "green", "purple", "crimson", "teal", "indigo"]
                  const randomColor = colors[Math.floor(Math.random() * colors.length)]
                  setTempCols([
                    ...tempCols,
                    { id: newId, label: "New Column", color: randomColor, order: tempCols.length + 1, category: "todo" }
                  ])
                }}
                className="h-7 text-xs border-gold text-gold-dark hover:bg-gold/5 cursor-pointer"
              >
                + Add Column
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {tempCols.map((col, idx) => (
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
                      setTempCols(tempCols.map(c => c.id === col.id ? { ...c, label: e.target.value } : c))
                    }}
                    className="h-8 text-xs focus-visible:ring-gold bg-white flex-1"
                  />
                  <select
                    value={col.color}
                    onChange={(e) => {
                      setTempCols(tempCols.map(c => c.id === col.id ? { ...c, color: e.target.value } : c))
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
                          const updated = [...tempCols]
                          const temp = updated[idx]
                          updated[idx] = updated[nextIndex]
                          updated[nextIndex] = temp
                          setTempCols(updated.map((c, i) => ({ ...c, order: i + 1 })))
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
                        if (nextIndex < tempCols.length) {
                          const updated = [...tempCols]
                          const temp = updated[idx]
                          updated[idx] = updated[nextIndex]
                          updated[nextIndex] = temp
                          setTempCols(updated.map((c, i) => ({ ...c, order: i + 1 })))
                        }
                      }}
                      disabled={idx === tempCols.length - 1}
                      className="h-8 w-8 text-slate-400 hover:text-navy rounded-md cursor-pointer flex items-center justify-center"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setTempCols(tempCols.filter(c => c.id !== col.id))}
                    disabled={tempCols.length <= 1}
                    className="h-8 w-8 text-slate-400 hover:text-red-500 rounded-md cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex sm:flex-row justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsManageColsOpen(false)}
              className="text-xs hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  setIsSavingCols(true)
                  if (onUpdateColumns) {
                    await onUpdateColumns(projectId, tempCols)
                  }
                  toast.success("Kanban columns updated successfully!")
                  setIsManageColsOpen(false)
                } catch {
                  toast.error("Failed to update columns")
                } finally {
                  setIsSavingCols(false)
                }
              }}
              disabled={isSavingCols}
              className="bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm border-0 cursor-pointer"
            >
              {isSavingCols ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

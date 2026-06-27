"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { STATUS_COLORS } from "@/lib/constants"
import { getTemplate } from "@/lib/templates"
import type { StatusConfig } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { ArrowLeft, GripVertical, Plus, Trash2, RotateCcw } from "lucide-react"
import Link from "next/link"


function SortableStatusItem({
  status,
  onUpdate,
  onRemove,
}: {
  status: StatusConfig
  onUpdate: (updates: Partial<StatusConfig>) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: status.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5",
        isDragging && "shadow-lg opacity-80"
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-navy">
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        value={status.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
        className="h-7 w-40 text-xs"
      />
      <Select
        value={status.color}
        onValueChange={(value) => onUpdate({ color: value || "slate" })}
      >
        <SelectTrigger className="h-7 w-28 text-[10px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_COLORS.map((c) => (
            <SelectItem key={c.value} value={c.value} className="text-xs">
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Badge
        variant="outline"
        className={cn(
          "text-[10px]",
          STATUS_COLORS.find((c) => c.value === status.color)?.class
        )}
      >
        {status.label}
      </Badge>
      <button
        onClick={onRemove}
        className="ml-auto text-muted-foreground hover:text-gold-dark"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function ProjectSettingsPage() {
  const template = getTemplate("EVENT")
  const [statuses, setStatuses] = useState<StatusConfig[]>(template.defaultStatuses)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = statuses.findIndex((s) => s.id === active.id)
    const newIndex = statuses.findIndex((s) => s.id === over.id)
    setStatuses(arrayMove(statuses, oldIndex, newIndex))
  }

  const updateStatus = (id: string, updates: Partial<StatusConfig>) => {
    setStatuses(statuses.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const removeStatus = (id: string) => {
    setStatuses(statuses.filter((s) => s.id !== id))
  }

  const addStatus = () => {
    const newId = `custom_${Date.now()}`
    setStatuses([
      ...statuses,
      {
        id: newId,
        label: "New Stage",
        color: "slate",
        order: statuses.length,
        category: "in_progress",
      },
    ])
  }

  const resetToTemplate = () => {
    setStatuses(template.defaultStatuses)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/projects/3"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-navy"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to project
        </Link>

        <div>
          <h1 className="text-xl font-bold text-navy">Project Configuration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Q3 Product Launch Event — customize stages and workflow
          </p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Project Stages / Columns
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToTemplate}
                  className="h-7 text-xs text-muted-foreground"
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={addStatus}
                  className="h-7 text-xs bg-navy hover:bg-navy/90"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Stage
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Drag to reorder, edit names, or change colors. These define the columns in your Kanban board.
            </p>

            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={statuses.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {statuses.map((status) => (
                    <SortableStatusItem
                      key={status.id}
                      status={status}
                      onUpdate={(updates) => updateStatus(status.id, updates)}
                      onRemove={() => removeStatus(status.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              General Settings
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Project name</Label>
                <Input defaultValue="Q3 Product Launch Event" className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Project type</Label>
                <Select defaultValue="EVENT">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOFTWARE">Software</SelectItem>
                    <SelectItem value="CONSTRUCTION">Construction</SelectItem>
                    <SelectItem value="EVENT">Event Planning</SelectItem>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="RESEARCH">Research</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="bg-gradient-to-r from-gold to-gold-dark text-navy text-xs hover:brightness-110">
              Save Configuration
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

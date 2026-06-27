"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PRIORITIES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ArrowUpDown, Search } from "lucide-react"
import { useAppStore } from "@/store/app-store"

type SpreadsheetViewProps = {
  // BUG-007 FIXED: Accept projectId to load real tasks from store
  projectId: string
}

export function SpreadsheetView({ projectId }: SpreadsheetViewProps) {
  const { tasks: storeTasks, projects } = useAppStore()

  // BUG-007 FIXED: Use actual project tasks instead of mockRows
  const projectTasks = storeTasks[projectId] || []
  const project = projects.find((p) => p.id === projectId)

  // Map tasks to spreadsheet rows
  const rows = projectTasks.map((t) => ({
    id: t.id,
    task: t.title,
    assignee: t.assignee_id || "Unassigned",
    status: t.status,
    priority: t.priority,
    dueDate: t.due_date || "—",
    milestone: "—",
  }))

  const [selected, setSelected] = useState<Set<string>>(new Set())
  // BUG-028 FIXED: Search input with state
  const [searchQuery, setSearchQuery] = useState("")

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    if (selected.size === filteredRows.length) setSelected(new Set())
    else setSelected(new Set(filteredRows.map((r) => r.id)))
  }

  // BUG-028 FIXED: Filter rows by search query
  const filteredRows = searchQuery.trim()
    ? rows.filter((r) =>
        r.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.assignee.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rows

  if (rows.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-gray-200/80 bg-white shadow-card text-center space-y-2">
        <p className="text-sm font-semibold text-navy">No tasks yet</p>
        <p className="text-xs text-muted-foreground">
          Add tasks using the &ldquo;Add Task&rdquo; button, then switch to Spreadsheet view.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm animate-in fade-in slide-in-from-top-1">
          <span className="text-xs font-semibold text-muted-foreground">{selected.size} selected</span>
          <div className="h-4 w-px bg-border" />
          {["Change Status", "Change Assignee", "Change Priority"].map((label) => (
            <Button key={label} variant="ghost" size="sm" className="h-7 rounded-md text-xs font-medium text-muted-foreground hover:text-navy">
              {label}
            </Button>
          ))}
          <div className="flex-1" />
          <Button variant="ghost" size="sm" className="h-7 text-xs text-gold-dark hover:text-gold" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* BUG-028 FIXED: Search with onChange and value */}
      <div className="relative w-56 mb-3">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 pl-8 text-xs rounded-lg border-gray-200"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="w-10">
                <Checkbox checked={filteredRows.length > 0 && selected.size === filteredRows.length} onCheckedChange={toggleAll} />
              </TableHead>
              {["Task", "Assignee", "Status", "Priority", "Due Date", "Milestone"].map((col) => (
                <TableHead key={col} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  <span className="inline-flex items-center gap-1 cursor-pointer hover:text-navy transition-colors">
                    {col} <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                  No tasks match &ldquo;{searchQuery}&rdquo;
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => {
                const priority = PRIORITIES.find((p) => p.value === row.priority)
                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "transition-colors hover:bg-gray-50/50",
                      selected.has(row.id) && "bg-gold/5"
                    )}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggleSelect(row.id)} />
                    </TableCell>
                    <TableCell className="text-xs font-medium text-navy">{row.task}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.assignee}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-semibold text-navy/60 border-navy/15 uppercase tracking-wider">
                        {row.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {priority ? (
                        <Badge variant="outline" className={cn("text-[10px] font-semibold tracking-wide", priority.color)}>
                          {row.priority}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{row.dueDate}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.milestone}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {project && (
        <p className="text-[10px] text-muted-foreground/60 text-right">
          Showing {filteredRows.length} of {rows.length} tasks for <span className="font-semibold">{project.name}</span>
        </p>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Lock, ArrowRight, AlertCircle, FolderOpen } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

type AuditEntry = {
  timestamp: string
  actor: string
  action: string
  target: string
  field: string
  oldVal: string
  newVal: string
}

const actionColors: Record<string, string> = {
  "Project Created": "bg-blue-50 text-blue-700 border-blue-200",
  "Project Updated": "bg-sky-50 text-sky-700 border-sky-200",
  "Columns Updated": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Member Added": "bg-teal-50 text-teal-700 border-teal-200",
  "Member Removed": "bg-rose-50 text-rose-700 border-rose-200",
  "Task Created": "bg-green-50 text-green-700 border-green-200",
  "Task Moved": "bg-purple-50 text-purple-700 border-purple-200",
  "Task Updated": "bg-amber-50 text-amber-700 border-amber-200",
  "Task Deleted": "bg-red-50 text-red-700 border-red-200",
  "Impediment Flagged": "bg-red-50 text-red-700 border-red-200",
}

const mapDbLogToAuditEntry = (log: any, currentUserEmail?: string): AuditEntry => {
  const isSelf = log.actor_email === currentUserEmail
  const actorName = isSelf ? `${log.actor_name} (You)` : log.actor_name

  let actionText = "Task Moved"
  let fieldChanged = "status"
  let oldVal = log.old_value || "—"
  let newVal = log.new_value || "—"

  if (log.action === "project_created") {
    actionText = "Project Created"
    fieldChanged = "name"
    newVal = log.details || "—"
  } else if (log.action === "project_updated") {
    actionText = "Project Updated"
    fieldChanged = "details"
    newVal = log.details || "—"
  } else if (log.action === "columns_updated") {
    actionText = "Columns Updated"
    fieldChanged = "status_config"
  } else if (log.action === "member_added") {
    actionText = "Member Added"
    fieldChanged = "member"
    newVal = log.details || "—"
  } else if (log.action === "member_removed") {
    actionText = "Member Removed"
    fieldChanged = "member"
    newVal = log.details || "—"
  } else if (log.action === "task_created") {
    actionText = "Task Created"
    fieldChanged = "title"
    newVal = log.details || "—"
  } else if (log.action === "task_updated") {
    actionText = "Task Updated"
    fieldChanged = "title"
    newVal = log.details || "—"
  } else if (log.action === "task_deleted") {
    actionText = "Task Deleted"
    fieldChanged = "title"
    newVal = log.details || "—"
  } else if (log.action === "status_changed") {
    actionText = "Task Moved"
    fieldChanged = "status"
  } else {
    actionText = log.action || "Action Logged"
    fieldChanged = "details"
    newVal = log.details || "—"
  }

  return {
    timestamp: new Date(log.created_at).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    actor: actorName,
    action: actionText,
    target: log.details || "—",
    field: fieldChanged,
    oldVal: oldVal,
    newVal: newVal,
  }
}

export default function AuditLedgerPage() {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })

        if (!error && data) {
          const mapped: AuditEntry[] = data.map((log) => mapDbLogToAuditEntry(log, user?.email))
          setAuditEntries(mapped)
        }
      } catch (e) {
        console.error("Failed to fetch audit logs", e)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchAuditLogs()

      const supabase = createClient()
      const channel = supabase
        .channel("audit-logs-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "activity_logs" },
          (payload) => {
            const newEntry = mapDbLogToAuditEntry(payload.new, user?.email)
            setAuditEntries((prev) => [newEntry, ...prev])
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Audit Ledger</h1>
            <p className="mt-1 text-sm text-muted-foreground">Immutable record of all structural changes across projects</p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground/60 border-muted-foreground/20 px-2 py-1">
            <Lock className="h-3 w-3" />
            Immutable
          </Badge>
        </div>

        {auditEntries.length === 0 ? (
          <Card className="border-0 shadow-card bg-slate-50/50">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy/5">
                <FolderOpen className="h-6 w-6 text-navy/60" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-sm font-bold text-navy">No Audit Logs</h3>
                <p className="text-xs text-muted-foreground">
                  Audit events will appear here in real-time as you create projects and manage tasks.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  {["Timestamp", "Actor", "Action", "Field Changed", "Change"].map((col) => (
                    <TableHead key={col} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEntries.map((entry, i) => (
                  <TableRow key={i} className="transition-colors hover:bg-gray-50/50">
                    <TableCell className="text-xs font-medium text-muted-foreground">{entry.timestamp}</TableCell>
                    <TableCell className="text-xs font-semibold text-navy">{entry.actor}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <Badge variant="outline" className={cn("text-[10px] font-semibold tracking-wide w-fit", actionColors[entry.action] || "bg-gray-50 text-gray-700 border-gray-200")}>
                          {entry.action}
                        </Badge>
                        {entry.target && entry.target !== "—" && (
                          <span className="text-[10px] text-muted-foreground/80 font-medium italic mt-0.5 max-w-[180px] truncate">
                            {entry.target}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{entry.field}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground/60 line-through truncate max-w-[120px]">{entry.oldVal}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-gold shrink-0" />
                        <span className="font-semibold text-navy truncate max-w-[120px]">{entry.newVal}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  )
}

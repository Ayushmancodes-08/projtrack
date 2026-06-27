"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Lock, ArrowRight, AlertCircle } from "lucide-react"

const auditEntries = [
  { timestamp: "Jun 24, 2026 14:32", actor: "Maria Lopez", action: "Budget Updated", field: "budget", oldVal: "$35,000", newVal: "$45,000" },
  { timestamp: "Jun 24, 2026 11:15", actor: "Alex Kim", action: "Deadline Changed", field: "deadline", oldVal: "Jul 15", newVal: "Jul 8" },
  { timestamp: "Jun 23, 2026 16:42", actor: "Maria Lopez", action: "Priority Changed", field: "priority", oldVal: "MEDIUM", newVal: "HIGH" },
  { timestamp: "Jun 23, 2026 10:00", actor: "James Rodriguez", action: "Task Created", field: "status", oldVal: "\u2014", newVal: "BACKLOG" },
  { timestamp: "Jun 22, 2026 09:30", actor: "System", action: "Health Updated", field: "health_status", oldVal: "ON_TRACK", newVal: "AT_RISK" },
]

const actionColors: Record<string, string> = {
  "Budget Updated": "bg-amber-50 text-amber-700 border-amber-200",
  "Deadline Changed": "bg-blue-50 text-blue-700 border-blue-200",
  "Priority Changed": "bg-purple-50 text-purple-700 border-purple-200",
  "Task Created": "bg-green-50 text-green-700 border-green-200",
  "Health Updated": "bg-red-50 text-red-700 border-red-200",
}

export default function AuditLedgerPage() {
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

        {/* BUG-012: Demo data notice */}
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Audit entries below are sample data. Real field-level change tracking requires Supabase triggers and is planned for the next release.
        </div>

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
                    <Badge variant="outline" className={cn("text-[10px] font-semibold tracking-wide", actionColors[entry.action] || "bg-gray-50 text-gray-700 border-gray-200")}>
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{entry.field}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground/60 line-through">{entry.oldVal}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-gold" />
                      <span className="font-semibold text-navy">{entry.newVal}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  )
}

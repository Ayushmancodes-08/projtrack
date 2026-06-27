"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Download, CheckCircle, AlertTriangle, DollarSign } from "lucide-react"

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Badge className="bg-green-500 text-white text-[10px] font-semibold px-2 py-0.5">Completed</Badge>
              <h1 className="text-2xl font-bold tracking-tight text-navy">Mobile App Redesign</h1>
            </div>
            <p className="text-sm text-muted-foreground">Post-mortem analysis and outcome report</p>
          </div>
          <Button
            className="bg-gradient-to-r from-navy to-navy-lighter text-xs font-semibold shadow-sm hover:shadow-md"
            onClick={() => window.print()}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export PDF
          </Button>
        </div>

        {/* BUG-011: Demo data notice */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 font-medium">
          ⚠️ This report displays demo data. Real project reporting connected to your store is coming in the next release.
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CheckCircle, iconBg: "bg-green-100", iconColor: "text-green-600", value: "2", label: "Days Early" },
            { icon: DollarSign, iconBg: "bg-amber-100", iconColor: "text-amber-600", value: "+12%", label: "Budget Variance" },
            { icon: CheckCircle, iconBg: "bg-blue-100", iconColor: "text-blue-600", value: "42", label: "Tasks Completed" },
            { icon: AlertTriangle, iconBg: "bg-gold/10", iconColor: "text-gold-dark", value: "5", label: "Blockers Resolved" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-card transition-all hover:shadow-card-hover">
              <CardContent className="p-5 text-center">
                <div className={cn("mx-auto flex h-9 w-9 items-center justify-center rounded-xl", stat.iconBg)}>
                  <stat.icon className={cn("h-4.5 w-4.5", stat.iconColor)} />
                </div>
                <p className="mt-2.5 text-2xl font-bold tracking-tight text-navy">{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-5">
              Estimated vs Actual Hours
            </h3>
            <div className="space-y-4">
              {[
                { phase: "Phase 1: Foundation", estimated: 120, actual: 108 },
                { phase: "Phase 2: Core Features", estimated: 200, actual: 230 },
                { phase: "Phase 3: Polish", estimated: 80, actual: 72 },
              ].map((phase) => (
                <div key={phase.phase}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-navy">{phase.phase}</span>
                    <span className="text-muted-foreground/70">
                      Est: {phase.estimated}h &middot; Act: {phase.actual}h
                      <span className={cn(
                        "ml-2 font-semibold",
                        phase.actual <= phase.estimated ? "text-green-600" : "text-gold-dark"
                      )}>
                        ({phase.actual > phase.estimated ? "+" : ""}{phase.actual - phase.estimated}h)
                      </span>
                    </span>
                  </div>
                  <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-l-full bg-navy/20 transition-all" style={{ width: `${(phase.estimated / 250) * 100}%` }} />
                    <div className={cn(
                      "h-full rounded-r-full transition-all",
                      phase.actual <= phase.estimated ? "bg-green-500" : "bg-gold-dark"
                    )} style={{ width: `${(phase.actual / 250) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="border-l-4 border-gold pl-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-3">
                AI-Generated Summary
              </h3>
              <p className="text-sm leading-relaxed text-navy/80">
                The Mobile App Redesign completed 2 days ahead of schedule with a 12% budget overrun,
                primarily driven by scope creep in Phase 2 (Core Features). Five blockers were resolved
                during the project, with the longest delay occurring during the API integration phase
                (3 days). The critical path was maintained throughout, and no milestones were missed.
                Team velocity was consistent at 8.4 story points per sprint. Recommend tighter scope
                control and earlier stakeholder reviews for future projects.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

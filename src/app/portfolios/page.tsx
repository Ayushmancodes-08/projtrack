"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Plus, Building2, FolderKanban, ArrowUpRight, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const mockPortfolios = [
  { id: "p1", name: "Engineering", description: "Software, infrastructure, and platform projects", color: "blue", projectCount: 5, atRisk: 2, budgetUtilization: 72 },
  { id: "p2", name: "Marketing", description: "Campaigns, brand, content, and events", color: "purple", projectCount: 3, atRisk: 0, budgetUtilization: 45 },
  { id: "p3", name: "Construction", description: "Buildings, renovations, site work", color: "amber", projectCount: 4, atRisk: 1, budgetUtilization: 88 },
  { id: "p4", name: "Operations", description: "Process improvement, vendor management, logistics", color: "teal", projectCount: 2, atRisk: 0, budgetUtilization: 34 },
]

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  amber: "bg-amber-50 text-amber-700",
  teal: "bg-teal-50 text-teal-700",
}

const iconColorMap: Record<string, string> = {
  blue: "text-blue-600",
  purple: "text-purple-600",
  amber: "text-amber-600",
  teal: "text-teal-600",
}

export default function PortfoliosPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Portfolios</h1>
            <p className="mt-1 text-sm text-muted-foreground">Group and track projects by department or initiative</p>
          </div>
          {/* BUG-009 FIXED: onClick handler on New Portfolio button */}
          <Button
            onClick={() => toast.info("Portfolio management coming soon! Connect Supabase to enable full CRUD.")}
            className="bg-gradient-to-r from-navy to-navy-lighter text-xs font-semibold shadow-sm hover:shadow-md"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Portfolio
          </Button>
        </div>

        {/* BUG-009: Demo data notice */}
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Portfolio data shown below is for demonstration purposes. Full portfolio CRUD requires Supabase integration.
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {mockPortfolios.map((portfolio) => (
            <Card key={portfolio.id} className="group border-0 shadow-card transition-all duration-200 hover:shadow-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", colorMap[portfolio.color] || "bg-gray-50")}>
                      <Building2 className={cn("h-5 w-5", iconColorMap[portfolio.color] || "text-gray-600")} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-navy">{portfolio.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{portfolio.description}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  {[
                    { label: "Projects", value: portfolio.projectCount, color: "text-navy" },
                    { label: "At Risk", value: portfolio.atRisk, color: "text-gold-dark" },
                    { label: "Budget", value: `${portfolio.budgetUtilization}%`, color: "text-navy" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      portfolio.budgetUtilization > 80 ? "bg-gold" : portfolio.budgetUtilization > 50 ? "bg-gold-dark" : "bg-green-500"
                    )}
                    style={{ width: `${portfolio.budgetUtilization}%` }}
                  />
                </div>

                <Link
                  href={`/projects?portfolio=${portfolio.id}`}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-gray-50 hover:text-navy"
                >
                  <FolderKanban className="h-3.5 w-3.5" />
                  View Projects
                  <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

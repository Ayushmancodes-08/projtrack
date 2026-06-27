"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download } from "lucide-react"
import Link from "next/link"

const milestones = [
  { name: "Project Kickoff", status: "completed", date: "May 1, 2026" },
  { name: "Design Phase Complete", status: "completed", date: "May 22, 2026" },
  { name: "Core Development", status: "current", date: "Jun 15, 2026" },
  { name: "Testing & QA", status: "upcoming", date: "Jul 6, 2026" },
  { name: "Final Delivery", status: "upcoming", date: "Jul 20, 2026" },
]

export default function ClientViewPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="flex h-14 items-center border-b bg-white px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-navy">
            <span className="text-xs font-bold text-gold">P</span>
          </div>
          <span className="text-sm font-semibold text-navy">ProjTrack</span>
        </Link>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="text-xs">
          <Download className="mr-1.5 h-3 w-3" />
          Export Report
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700">Active Project</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-navy">Customer Portal v2</h1>
            <div className="mt-4 flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-navy">68%</p>
                <p className="text-xs text-muted-foreground">Overall Progress</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-green-500">On Track</p>
                <p className="text-xs text-muted-foreground">Health Status</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-navy">Due Jul 20</p>
                <p className="text-xs text-muted-foreground">Deadline</p>
              </div>
            </div>
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-[68%] rounded-full bg-green-500 transition-all" />
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Key Milestones
              </h2>
              <div className="space-y-0">
                {milestones.map((ms, i) => (
                  <div key={ms.name} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                          ms.status === "completed"
                            ? "border-green-500 bg-green-500 text-white"
                            : ms.status === "current"
                            ? "border-gold bg-gold text-white"
                            : "border-gray-200 bg-white text-gray-300"
                        }`}
                      >
                        {ms.status === "completed" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      {i < milestones.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 ${
                            ms.status === "completed" ? "bg-green-500" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className={`pb-8 ${i === milestones.length - 1 ? "pb-0" : ""}`}>
                      <p
                        className={`text-sm font-medium ${
                          ms.status === "completed"
                            ? "text-green-700"
                            : ms.status === "current"
                            ? "text-gold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {ms.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ms.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Final Deliverables
              </h2>
              <div className="space-y-2">
                {["Project Report (PDF)", "Design Specifications", "Deployment Checklist"].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <span className="text-sm text-navy">{item}</span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

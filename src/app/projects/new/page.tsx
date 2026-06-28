"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PROJECT_TEMPLATES } from "@/lib/templates"
import { cn } from "@/lib/utils"
import {
  Code2,
  HardHat,
  CalendarCheck,
  Megaphone,
  FlaskConical,
  FolderKanban,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import type { ProjectType } from "@/lib/types"
import { toast } from "sonner"

const iconMap: Record<string, React.ElementType> = {
  Code2,
  HardHat,
  CalendarCheck,
  Megaphone,
  FlaskConical,
  FolderKanban,
}

export default function NewProjectPage() {
  const router = useRouter()
  const { addProject } = useAppStore()
  const [step, setStep] = useState<"type" | "details">("type")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [projectName, setProjectName] = useState("")
  // BUG-025 FIXED: description is now passed to addProject
  const [description, setDescription] = useState("")
  // BUG-026 FIXED: deadline is now a real editable date field
  const [deadline, setDeadline] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const template = selectedType
    ? PROJECT_TEMPLATES.find((t) => t.type === selectedType)
    : null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) {
      toast.error("Please enter a project name")
      return
    }
    if (!selectedType || !template) return

    try {
      setIsCreating(true)
      // BUG-025 + BUG-026 FIXED: Pass description and deadline to addProject
      const newProj = await addProject(
        projectName,
        selectedType as ProjectType,
        template.defaultStatuses,
        description.trim() || undefined,
        deadline || undefined
      )
      toast.success(`Project "${newProj.name}" created successfully!`)
      router.push(`/projects/${newProj.id}`)
    } catch {
      toast.error("Failed to create project")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/projects"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-navy"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to projects
        </Link>

        <div>
          <h1 className="text-xl font-bold text-navy">Create New Project</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "type"
              ? "Choose a project type to get started with pre-configured stages"
              : "Fill in the details for your new project"}
          </p>
        </div>

        {step === "type" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {PROJECT_TEMPLATES.map((t) => {
              const Icon = iconMap[t.icon] || FolderKanban
              const isSelected = selectedType === t.type
              return (
                <button
                  key={t.type}
                  onClick={() => setSelectedType(t.type)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
                    isSelected
                      ? "border-gold bg-gold/5 shadow-sm"
                      : "border-transparent bg-white shadow-sm hover:border-navy/20"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/5">
                    <Icon className="h-5 w-5 text-navy" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.defaultStatuses.slice(0, 4).map((s) => (
                        <Badge
                          key={s.id}
                          variant="outline"
                          className="text-[9px] font-normal text-muted-foreground"
                        >
                          {s.label}
                        </Badge>
                      ))}
                      {t.defaultStatuses.length > 4 && (
                        <span className="text-[9px] text-muted-foreground">
                          +{t.defaultStatuses.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}

            <div className="sm:col-span-2">
              <Button
                disabled={!selectedType}
                onClick={() => setStep("details")}
                className="w-full bg-gradient-to-r from-gold to-gold-dark text-navy hover:brightness-110"
              >
                Continue with {template?.label || "selected"} template
              </Button>
            </div>
          </div>
        )}

        {step === "details" && template && (
          <form
            onSubmit={handleCreate}
            className="space-y-5"
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label>Project name</Label>
                  <Input
                    placeholder={`e.g. Q3 ${template.label} Campaign`}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    required
                    disabled={isCreating}
                    className="focus-visible:ring-gold"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="Brief description of the project goals"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isCreating}
                    className="min-h-[72px] resize-none focus-visible:ring-gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project template</Label>
                    <Input value={template.label} disabled className="bg-gray-50 text-slate-500 font-medium" />
                  </div>
                  <div className="space-y-2">
                    {/* BUG-026 FIXED: Real date input for deadline */}
                    <Label>Deadline</Label>
                    <Input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      disabled={isCreating}
                      min={new Date().toISOString().split("T")[0]}
                      className="focus-visible:ring-gold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Will auto-generate columns:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {template.defaultStatuses.map((s) => (
                    <Badge
                      key={s.id}
                      variant="outline"
                      className="text-[10px] font-medium text-navy border-navy/20"
                    >
                      {s.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("type")}
                disabled={isCreating}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1 bg-gradient-to-r from-gold to-gold-dark text-navy hover:brightness-110"
              >
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  )
}

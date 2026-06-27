import type { HealthStatus, Task, Milestone, Project } from "@/lib/types"

type HealthInput = {
  tasks: (Task & { milestone?: Milestone | null })[]
  milestones: Milestone[]
  project: Pick<Project, "deadline" | "budget">
  actualCost?: number
}

const WEIGHTS = {
  SCHEDULE_VARIANCE: 0.35,
  BLOCKERS: 0.25,
  SCOPE_CREEP: 0.15,
  MILESTONE_HEALTH: 0.15,
  BUDGET_HEALTH: 0.10,
}

export function calculateProjectHealth(input: HealthInput): {
  status: HealthStatus
  score: number
  factors: Record<string, number>
} {
  const { tasks, milestones, project, actualCost } = input

  const scheduleVariance = calculateScheduleVariance(tasks, project.deadline)
  const blockerScore = calculateBlockerScore(tasks)
  const scopeCreep = calculateScopeCreep(tasks, milestones)
  const milestoneHealth = calculateMilestoneHealth(milestones)
  const budgetHealth = calculateBudgetHealth(project.budget, actualCost)

  const totalScore =
    scheduleVariance * WEIGHTS.SCHEDULE_VARIANCE +
    blockerScore * WEIGHTS.BLOCKERS +
    scopeCreep * WEIGHTS.SCOPE_CREEP +
    milestoneHealth * WEIGHTS.MILESTONE_HEALTH +
    budgetHealth * WEIGHTS.BUDGET_HEALTH

  const status: HealthStatus =
    totalScore >= 0.7 ? "ON_TRACK" : totalScore >= 0.4 ? "AT_RISK" : "CRITICAL"

  return {
    status,
    score: Math.round(totalScore * 100) / 100,
    factors: {
      scheduleVariance,
      blockerScore,
      scopeCreep,
      milestoneHealth,
      budgetHealth,
    },
  }
}

function calculateScheduleVariance(
  tasks: { due_date?: string | null; status: string }[],
  projectDeadline?: string | null
): number {
  if (!projectDeadline) return 0.5
  const deadline = new Date(projectDeadline).getTime()
  const now = Date.now()
  const totalDays = (deadline - now) / (1000 * 60 * 60 * 24)

  const overdueTasks = tasks.filter(
    (t) => t.due_date && new Date(t.due_date).getTime() < now && t.status !== "DONE"
  )

  if (overdueTasks.length === 0) return 1.0
  if (totalDays < 0) return 0.0

  const overdueRatio = overdueTasks.length / Math.max(tasks.length, 1)
  const timeBuffer = Math.min(totalDays / 14, 1)

  return Math.max(0, 1 - overdueRatio * 0.7) * (0.3 + timeBuffer * 0.7)
}

function calculateBlockerScore(tasks: { blocked_reason?: string | null }[]): number {
  const blockedCount = tasks.filter((t) => t.blocked_reason).length
  if (blockedCount === 0) return 1.0
  const ratio = blockedCount / Math.max(tasks.length, 1)
  return Math.max(0, 1 - ratio * 2)
}

function calculateScopeCreep(
  tasks: { created_at: string }[],
  milestones: { start_date?: string | null; end_date?: string | null }[]
): number {
  if (tasks.length === 0) return 0.5
  if (milestones.length === 0) return 0.5

  const projectStart = milestones.reduce(
    (earliest, m) =>
      m.start_date && (!earliest || new Date(m.start_date) < new Date(earliest))
        ? m.start_date
        : earliest,
    "" as string
  )

  if (!projectStart) return 0.5

  const midPoint = new Date(projectStart).getTime() + (Date.now() - new Date(projectStart).getTime()) / 2
  const recentTasks = tasks.filter((t) => new Date(t.created_at).getTime() > midPoint)
  const ratio = recentTasks.length / Math.max(tasks.length, 1)

  return Math.max(0, 1 - ratio * 1.5)
}

function calculateMilestoneHealth(
  milestones: { end_date?: string | null }[]
): number {
  if (milestones.length === 0) return 0.5
  const now = Date.now()
  const overdueMilestones = milestones.filter(
    (m) => m.end_date && new Date(m.end_date).getTime() < now
  )
  const ratio = overdueMilestones.length / milestones.length
  return Math.max(0, 1 - ratio)
}

function calculateBudgetHealth(
  budget?: number | null,
  actualCost?: number | null
): number {
  if (!budget || budget === 0) return 0.5
  if (!actualCost) return 0.7
  const variance = actualCost / budget
  if (variance <= 1) return 1.0
  if (variance >= 1.5) return 0.0
  return 1 - (variance - 1) * 2
}

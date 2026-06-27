
export const NAVY = "#0A1F3D"
export const GOLD = "#C9A24B"
export const GOLD_DARK = "#B8922E"
export const SURFACE = "#F7F8FA"
export const WHITE = "#FFFFFF"
export const GREEN = "#22C55E"

export const PRIORITIES = [
  { value: "LOW" as const, label: "Low", color: "bg-gray-100 text-gray-600" },
  { value: "MEDIUM" as const, label: "Medium", color: "bg-blue-100 text-blue-600" },
  { value: "HIGH" as const, label: "High", color: "bg-amber-100 text-amber-600" },
  { value: "CRITICAL" as const, label: "Critical", color: "bg-red-100 text-red-600" },
]

export const HEALTH_STATUSES = [
  { value: "ON_TRACK" as const, label: "On Track", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "AT_RISK" as const, label: "At Risk", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "CRITICAL" as const, label: "Critical", color: "bg-red-100 text-red-700 border-red-200" },
]

export const ROLES = [
  { value: "OWNER" as const, label: "Owner" },
  { value: "PM" as const, label: "Project Manager" },
  { value: "DEVELOPER" as const, label: "Team Member" },
  { value: "CLIENT" as const, label: "Client" },
  { value: "VIEWER" as const, label: "Viewer" },
]

export const ROLE_HIERARCHY: Record<string, number> = {
  OWNER: 100,
  PM: 80,
  DEVELOPER: 60,
  CLIENT: 40,
  VIEWER: 20,
}

export const SIDEBAR_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/projects", label: "Projects", icon: "FolderKanban" },
  { href: "/portfolios", label: "Portfolios", icon: "Building2" },
  { href: "/activity", label: "Activity", icon: "Activity" },
  { href: "/reports", label: "Reports", icon: "BarChart3" },
  { href: "/audit", label: "Audit Ledger", icon: "ScrollText" },
  { href: "/settings", label: "Settings", icon: "Settings" },
]

export const STATUS_COLORS = [
  { value: "slate", label: "Slate", class: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "blue", label: "Blue", class: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "amber", label: "Amber", class: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "green", label: "Green", class: "bg-green-100 text-green-700 border-green-200" },
  { value: "purple", label: "Purple", class: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "crimson", label: "Crimson", class: "bg-gold/10 text-gold-dark border-gold/20" },
  { value: "teal", label: "Teal", class: "bg-teal-100 text-teal-700 border-teal-200" },
  { value: "indigo", label: "Indigo", class: "bg-indigo-100 text-indigo-700 border-indigo-200" },
]

export const STATUS_CATEGORIES = [
  { value: "todo" as const, label: "To Do" },
  { value: "in_progress" as const, label: "In Progress" },
  { value: "review" as const, label: "Review" },
  { value: "done" as const, label: "Done" },
]

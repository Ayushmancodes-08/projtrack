export const NAVY = "#181513"
export const GOLD = "#C2410C"
export const GOLD_DARK = "#9A3412"
export const SURFACE = "#FAF8F5"
export const WHITE = "#FFFFFF"
export const GREEN = "#15803D"

export const PRIORITIES = [
  { value: "LOW" as const, label: "Low", color: "bg-stone-100 text-stone-700 border-stone-200" },
  { value: "MEDIUM" as const, label: "Medium", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { value: "HIGH" as const, label: "High", color: "bg-orange-50 text-orange-800 border-orange-200" },
  { value: "CRITICAL" as const, label: "Critical", color: "bg-rose-50 text-rose-800 border-rose-200" },
]

export const HEALTH_STATUSES = [
  { value: "ON_TRACK" as const, label: "On Track", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { value: "AT_RISK" as const, label: "At Risk", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { value: "CRITICAL" as const, label: "Critical", color: "bg-rose-50 text-rose-800 border-rose-200" },
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
  { value: "slate", label: "Warm Stone", class: "bg-stone-100 text-stone-700 border-stone-200" },
  { value: "blue", label: "Ocean Slate", class: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "amber", label: "Spiced Honey", class: "bg-amber-50 text-amber-800 border-amber-200" },
  { value: "green", label: "Forest Moss", class: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { value: "purple", label: "Mulberry", class: "bg-purple-50 text-purple-800 border-purple-200" },
  { value: "crimson", label: "Terracotta", class: "bg-orange-50 text-orange-800 border-orange-200" },
  { value: "teal", label: "Deep Sage", class: "bg-teal-50 text-teal-800 border-teal-200" },
  { value: "indigo", label: "Midnight Dusk", class: "bg-stone-200 text-stone-800 border-stone-300" },
]

export const STATUS_CATEGORIES = [
  { value: "todo" as const, label: "To Do" },
  { value: "in_progress" as const, label: "In Progress" },
  { value: "review" as const, label: "Review" },
  { value: "done" as const, label: "Done" },
]

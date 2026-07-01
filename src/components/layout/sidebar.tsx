"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { SIDEBAR_ITEMS } from "@/lib/constants"
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Activity,
  BarChart3,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Activity,
  BarChart3,
  ScrollText,
  Settings,
}

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { user } = useAuth()
  const isAdmin = user ? !user.isTeamMember : false

  const visibleItems = SIDEBAR_ITEMS.filter((item) => {
    if (isAdmin) return true
    // Non-admin users (Team Members / Clients) only see Dashboard, Projects, and Activity
    return !["/portfolios", "/reports", "/audit", "/settings"].includes(item.href)
  })

  return (
    <aside
      className={cn(
        "flex flex-col bg-navy text-white transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      <div className={cn(
        "flex h-16 items-center border-b border-white/5 transition-all",
        sidebarCollapsed ? "justify-center px-0" : "gap-3 px-5"
      )}>
        <Link href="/dashboard" className={cn(
          "flex items-center transition-all",
          sidebarCollapsed ? "justify-center" : "gap-3"
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-dark shadow-sm shadow-gold/20">
            <Shield className="h-4 w-4 text-navy" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">projectBeacon</span>
              <span className="text-[9px] font-medium text-gold/60 uppercase tracking-[0.15em]">v2.0</span>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className={cn(
          "mb-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20",
          sidebarCollapsed && "sr-only"
        )}>
          Main
        </p>
        {visibleItems.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-all duration-150",
                sidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-white/10 text-gold shadow-sm"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              )}
            >
              <Icon className={cn(
                "shrink-0 transition-all",
                sidebarCollapsed ? "h-5 w-5" : "h-4 w-4",
                isActive && "text-gold"
              )} />
              {!sidebarCollapsed && (
                <span className={isActive ? "font-semibold" : ""}>{item.label}</span>
              )}
              {!sidebarCollapsed && isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/5 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center text-white/20 transition-all hover:bg-white/5 hover:text-white/50"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  )
}

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

interface SidebarProps {
  onItemClick?: () => void
  isMobileDrawer?: boolean
}

export function Sidebar({ onItemClick, isMobileDrawer = false }: SidebarProps) {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { user } = useAuth()
  const isAdmin = user ? !user.isTeamMember : false

  const visibleItems = SIDEBAR_ITEMS.filter((item) => {
    if (isAdmin) return true
    // Non-admin users (Team Members / Clients) only see Dashboard, Projects, and Activity
    return !["/portfolios", "/reports", "/audit", "/settings"].includes(item.href)
  })

  // When inside a mobile drawer sheet, always render expanded and full width
  const collapsed = isMobileDrawer ? false : sidebarCollapsed

  return (
    <aside
      className={cn(
        "flex flex-col bg-navy text-white transition-all duration-300 ease-in-out h-full",
        isMobileDrawer ? "w-full" : cn("hidden lg:flex", collapsed ? "w-16" : "w-60")
      )}
    >
      <div className={cn(
        "flex h-16 items-center border-b border-white/5 transition-all",
        collapsed ? "justify-center px-0" : "gap-3 px-5"
      )}>
        <Link 
          href="/dashboard" 
          onClick={onItemClick}
          className={cn(
            "flex items-center transition-all",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-dark shadow-sm shadow-gold/20">
            <Shield className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white">projectBeacon</span>
              <span className="text-[9px] font-medium text-gold/80 uppercase tracking-[0.15em]">v2.0</span>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
        <p className={cn(
          "mb-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/30 px-3",
          collapsed && "sr-only"
        )}>
          Main Navigation
        </p>
        {visibleItems.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/dashboard")

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98]",
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-white/15 text-gold shadow-sm font-semibold"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90"
              )}
            >
              <Icon className={cn(
                "shrink-0 transition-all",
                collapsed ? "h-5 w-5" : "h-4 w-4",
                isActive && "text-gold"
              )} />
              {!collapsed && (
                <span>{item.label}</span>
              )}
              {!collapsed && isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-gold shadow-xs shadow-gold/50" />
              )}
            </Link>
          )
        })}
      </nav>

      {!isMobileDrawer && (
        <div className="border-t border-white/5 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full justify-center text-white/30 transition-all hover:bg-white/5 hover:text-white/70 cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </aside>
  )
}

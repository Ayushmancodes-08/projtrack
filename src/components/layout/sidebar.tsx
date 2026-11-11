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
    return !["/portfolios", "/reports", "/audit", "/settings"].includes(item.href)
  })

  const collapsed = isMobileDrawer ? false : sidebarCollapsed

  return (
    <aside
      className={cn(
        "flex flex-col bg-[#171412] text-[#FAF8F5] border-r border-[#2B2521] transition-all duration-300 ease-in-out h-full select-none",
        isMobileDrawer ? "w-full" : cn("hidden lg:flex", collapsed ? "w-18" : "w-64")
      )}
    >
      <div className={cn(
        "flex h-16 items-center border-b border-[#2B2521] transition-all",
        collapsed ? "justify-center px-0" : "gap-3 px-5"
      )}>
        <Link 
          href="/dashboard" 
          onClick={onItemClick}
          className={cn(
            "flex items-center transition-all group",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 via-orange-600 to-amber-600 shadow-md shadow-orange-950/40 group-hover:scale-105 transition-transform">
            <Shield className="h-4.5 w-4.5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-[#FAF8F5]">projectBeacon</span>
              <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-widest">Workspace</span>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-clean">
        <p className={cn(
          "mb-2.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-stone-500 px-3",
          collapsed && "sr-only"
        )}>
          Navigation
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
                "flex items-center rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.98]",
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5",
                isActive
                  ? "bg-gradient-to-r from-orange-600/15 to-amber-600/10 text-orange-400 border border-orange-500/25 font-semibold shadow-xs"
                  : "text-stone-400 hover:bg-stone-900/60 hover:text-stone-200"
              )}
            >
              <Icon className={cn(
                "shrink-0 transition-colors",
                collapsed ? "h-5 w-5" : "h-4 w-4",
                isActive ? "text-orange-400" : "text-stone-400 group-hover:text-stone-300"
              )} />
              {!collapsed && (
                <span>{item.label}</span>
              )}
              {!collapsed && isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-400 shadow-sm shadow-orange-500/50" />
              )}
            </Link>
          )
        })}
      </nav>

      {!isMobileDrawer && (
        <div className="border-t border-[#2B2521] p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full justify-center text-stone-500 transition-all hover:bg-stone-900/60 hover:text-stone-300 cursor-pointer rounded-xl h-9"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium">
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </div>
            )}
          </Button>
        </div>
      )}
    </aside>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  FolderKanban, 
  Activity, 
  BarChart3, 
  Plus, 
  Settings
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const isAdmin = user ? !user.isTeamMember : false

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/projects",
      label: "Projects",
      icon: FolderKanban,
      active: pathname === "/projects" || (pathname.startsWith("/projects/") && pathname !== "/projects/new"),
    },
    ...(isAdmin ? [
      {
        href: "/projects/new",
        label: "Create",
        icon: Plus,
        isAction: true,
        active: pathname === "/projects/new",
      }
    ] : []),
    {
      href: "/activity",
      label: "Activity",
      icon: Activity,
      active: pathname === "/activity",
    },
    ...(isAdmin ? [
      {
        href: "/reports",
        label: "Reports",
        icon: BarChart3,
        active: pathname === "/reports",
      }
    ] : [
      {
        href: "/settings",
        label: "Settings",
        icon: Settings,
        active: pathname === "/settings",
      }
    ]),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block border-t border-gray-200/80 bg-white/95 backdrop-blur-md lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.active

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative -top-3 flex flex-col items-center justify-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-gold to-gold-dark text-white shadow-lg shadow-gold/30 ring-4 ring-white transition-transform duration-200 active:scale-95 group-hover:scale-105">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="mt-0.5 text-[10px] font-semibold text-navy">
                  New
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-1.5 transition-all duration-150 relative",
                isActive ? "text-gold font-semibold" : "text-slate-400 hover:text-slate-700"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5 transition-transform duration-150", isActive && "scale-110")} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold" />
                )}
              </div>
              <span className="mt-1 text-[10px] tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

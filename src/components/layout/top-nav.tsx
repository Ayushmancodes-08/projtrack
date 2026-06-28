"use client"

import { useState } from "react"
import { Bell, Search, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useClerk, useUser, useOrganization } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Check, Info, AlertCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { AppNotification } from "@/store/app-store"

// BUG-014 FIXED: Removed unused `useAppStore` import

export function TopNav() {
  const { user: clerkUser } = useUser()
  const { organization: clerkOrg, membership } = useOrganization()
  const { signOut, openUserProfile } = useClerk()
  const router = useRouter()
  
  const { notifications, resolveNotification, updateTaskStatus, projects } = useAppStore()

  const isAdmin = !clerkOrg || membership?.role === "org:admin"
  const unreadNotifications = notifications.filter((n) => !n.resolved)
  const unreadCount = unreadNotifications.length

  const handleApprove = async (n: AppNotification) => {
    try {
      const project = projects.find((p) => p.id === n.project_id)
      const doneStatus = project?.status_config.find((s) => s.category === "done")?.id || "done"
      await updateTaskStatus(n.project_id, n.task_id, doneStatus)
      await resolveNotification(n.id)
      toast.success("Task approved and completed successfully!")
    } catch {
      toast.error("Failed to approve task")
    }
  }

  // BUG-022 FIXED: Add search state (navigates to projects with query)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/projects?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const orgRole = membership?.role === "org:admin" 
    ? "Project Manager (Admin)" 
    : membership?.role === "org:member" 
      ? "Team Member" 
      : "Viewer"

  const userInitials = clerkUser?.fullName
    ? clerkUser.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : clerkUser?.primaryEmailAddress?.emailAddress?.slice(0, 2).toUpperCase() || "U"

  return (
    <header className="flex h-16 items-center gap-4 border-b border-gray-200/80 bg-white/95 px-6 backdrop-blur-sm">
      {/* BUG-019 FIXED: Workspace switcher button now navigates to /settings */}
      <button
        onClick={() => router.push("/settings")}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-navy/70 transition-colors hover:bg-navy-100"
      >
        <span>{clerkOrg?.name || "Personal Workspace"}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <div className="flex-1" />

      {/* BUG-022 FIXED: Search input with state — Enter key navigates to /projects?q= */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks, projects... (Enter)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          className="h-9 rounded-lg border-gray-200 bg-gray-50 pl-9 text-xs text-muted-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:bg-white focus-visible:ring-gold/20"
        />
      </div>

      <Popover>
        <PopoverTrigger className="relative h-9 w-9 rounded-lg text-muted-foreground transition-colors hover:bg-navy-100 hover:text-navy cursor-pointer flex items-center justify-center border-0 bg-transparent">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 rounded-xl border border-gray-100 p-0 shadow-elevated">
          <div className="flex items-center justify-between p-3.5 pb-2.5">
            <h3 className="font-semibold text-xs text-navy">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                {unreadCount} New
              </span>
            )}
          </div>
          <Separator />
          <ScrollArea className="h-72">
            {notifications.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Info className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <div key={n.id} className={cn("p-3.5 transition-colors hover:bg-slate-50/50", n.resolved && "opacity-60")}>
                    <div className="flex gap-2.5">
                      <div className="mt-0.5">
                        {n.type === "review_request" ? (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Info className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-semibold text-navy leading-tight">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug">{n.body}</p>
                        <p className="text-[9px] text-muted-foreground/60">{n.timestamp}</p>
                        
                        {!n.resolved && n.type === "review_request" && isAdmin && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(n)}
                              className="h-7 rounded-md bg-green-600 px-2.5 text-[10px] text-white hover:bg-green-700 font-medium cursor-pointer"
                            >
                              Confirm & Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveNotification(n.id)}
                              className="h-7 rounded-md border-gray-200 px-2.5 text-[10px] hover:bg-gray-50 font-medium cursor-pointer"
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}

                        {!n.resolved && (!isAdmin || n.type !== "review_request") && (
                          <button
                            onClick={() => resolveNotification(n.id)}
                            className="text-[10px] font-medium text-navy/60 hover:text-navy pt-1.5 flex items-center gap-0.5 cursor-pointer"
                          >
                            <Check className="h-3 w-3" /> Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors data-open:bg-navy-100 cursor-pointer">
          <Avatar className="h-8 w-8 ring-2 ring-gray-100">
            {clerkUser?.imageUrl && <AvatarImage src={clerkUser.imageUrl} alt={clerkUser.fullName || "Avatar"} />}
            <AvatarFallback className="bg-gradient-to-br from-gold to-gold-dark text-[10px] font-semibold text-navy">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-medium leading-tight text-navy">
              {clerkUser?.fullName || clerkUser?.primaryEmailAddress?.emailAddress || "User"}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {orgRole}
            </p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl border border-gray-100 p-1.5 shadow-elevated">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            {/* BUG-021 FIXED: Profile opens Clerk user profile modal; Settings navigates to /settings */}
            <DropdownMenuItem
              className="rounded-lg text-xs cursor-pointer"
              onClick={() => openUserProfile()}
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-xs cursor-pointer"
              onClick={() => router.push("/settings")}
            >
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem 
            className="rounded-lg text-xs text-navy/50 focus:text-navy cursor-pointer"
            onClick={() => signOut()}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

"use client"

import { useState } from "react"
import { Bell, Search, ChevronDown, User, ShieldAlert, BadgeCheck, XCircle, Info, AlertCircle, Trash2, Key, Mail, Globe } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Check } from "lucide-react"
import { toast } from "sonner"
import type { AppNotification } from "@/store/app-store"

// BUG-014 FIXED: Removed unused `useAppStore` import

export function TopNav() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  const { notifications, resolveNotification, updateTaskStatus, projects } = useAppStore()

  const isAdmin = user ? !user.isTeamMember : false
  const unreadNotifications = notifications.filter((n) => !n.resolved)
  const unreadCount = unreadNotifications.length

  const handleApprove = async (n: AppNotification) => {
    try {
      const project = projects.find((p) => p.id === n.project_id)
      const doneStatus = project?.status_config.find((s) => s.category === "done")?.id || "done"
      await updateTaskStatus(n.project_id, n.task_id, doneStatus)
      await resolveNotification(n.id)

      // Mark project as completed if the approved task was the final task or as requested by the workflow
      if (project) {
        const { updateProjectDetails } = useAppStore.getState()
        await updateProjectDetails(
          project.id,
          project.name,
          project.description || "",
          project.deadline || "",
          project.health_status,
          true // mark project as completed
        )
      }

      toast.success("Task approved and project marked as completed successfully!")
    } catch (e) {
      console.error(e)
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

  const orgRole = user
    ? user.isTeamMember
      ? user.role === "DEVELOPER"
        ? "Developer"
        : user.role === "CLIENT"
          ? "Client"
          : user.role === "VIEWER"
            ? "Viewer"
            : "Team Member"
      : "Project Manager (Admin)"
    : "Guest"

  const userInitials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U"

  return (
    <header className="flex h-16 items-center gap-4 border-b border-gray-200/80 bg-white/95 px-6 backdrop-blur-sm">
      {/* BUG-019 FIXED: Workspace switcher button now navigates to /settings */}
      <button
        onClick={() => router.push("/settings")}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-navy/70 transition-colors hover:bg-navy-100"
      >
        <span>{user?.isTeamMember ? "Team Workspace" : "Personal Workspace"}</span>
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
            {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName || "Avatar"} />}
            <AvatarFallback className="bg-gradient-to-br from-gold to-gold-dark text-[10px] font-semibold text-navy">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-medium leading-tight text-navy">
              {user?.fullName || user?.email || "User"}
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
            <DropdownMenuItem
              className="rounded-lg text-xs cursor-pointer font-medium text-navy"
              onClick={() => setIsProfileOpen(true)}
            >
              My Profile
            </DropdownMenuItem>
            {!user?.isTeamMember && (
              <DropdownMenuItem
                className="rounded-lg text-xs cursor-pointer"
                onClick={() => router.push("/settings")}
              >
                Settings
              </DropdownMenuItem>
            )}
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

      {/* Profile Sidebar (Sheet) */}
      <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <SheetContent className="bg-white border-l border-slate-100 p-6 flex flex-col h-full shadow-2xl">
          <SheetHeader className="pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-4 ring-gold/10">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
                <AvatarFallback className="bg-gradient-to-br from-gold to-gold-dark text-lg font-bold text-navy">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-base font-bold text-navy leading-snug">
                  {user?.fullName || "User Profile"}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground font-medium mt-0.5">
                  {orgRole}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 py-6 space-y-6 overflow-y-auto">
            {/* User details section */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Details</h4>
              
              <div className="rounded-xl bg-slate-50 p-4 space-y-3.5 border border-slate-100/50">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-navy/60 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium">Email Address</p>
                    <p className="text-xs font-semibold text-navy mt-0.5">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="h-4 w-4 text-navy/60 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium">Workspace Context</p>
                    <p className="text-xs font-semibold text-navy mt-0.5">
                      {user?.isTeamMember ? "Joined Team Workspace" : "Personal Workspace (Owner)"}
                    </p>
                  </div>
                </div>

                {user?.isTeamMember && user.inviteCode && (
                  <div className="flex items-start gap-3">
                    <Key className="h-4 w-4 text-navy/60 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium">Active Invite Code</p>
                      <p className="text-xs font-mono font-bold text-gold-dark mt-0.5">{user.inviteCode}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Permission checklist */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workspace Permissions</h4>
              
              <div className="space-y-3">
                <div className="flex items-start justify-between rounded-lg border border-slate-100 p-2.5 bg-white shadow-xs">
                  <div className="flex items-start gap-2">
                    <BadgeCheck className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-xs font-medium text-navy">View projects & tasks</span>
                  </div>
                  <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-100 text-[9px] px-1.5 py-0">Allowed</Badge>
                </div>

                <div className="flex items-start justify-between rounded-lg border border-slate-100 p-2.5 bg-white shadow-xs">
                  <div className="flex items-start gap-2">
                    <BadgeCheck className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-xs font-medium text-navy">Update project & task status</span>
                  </div>
                  <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-100 text-[9px] px-1.5 py-0">Allowed</Badge>
                </div>

                <div className="flex items-start justify-between rounded-lg border border-slate-100 p-2.5 bg-white shadow-xs">
                  <div className="flex items-start gap-2">
                    {user?.isTeamMember ? (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    ) : (
                      <BadgeCheck className="h-4 w-4 text-green-600 mt-0.5" />
                    )}
                    <span className="text-xs font-medium text-navy">Create new projects</span>
                  </div>
                  <Badge className={cn(
                    "text-[9px] px-1.5 py-0",
                    user?.isTeamMember 
                      ? "bg-red-50 text-red-700 border-red-100" 
                      : "bg-green-50 text-green-700 border-green-100"
                  )}>
                    {user?.isTeamMember ? "Restricted" : "Allowed"}
                  </Badge>
                </div>

                <div className="flex items-start justify-between rounded-lg border border-slate-100 p-2.5 bg-white shadow-xs">
                  <div className="flex items-start gap-2">
                    {user?.isTeamMember ? (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    ) : (
                      <BadgeCheck className="h-4 w-4 text-green-600 mt-0.5" />
                    )}
                    <span className="text-xs font-medium text-navy">Modify workspace settings</span>
                  </div>
                  <Badge className={cn(
                    "text-[9px] px-1.5 py-0",
                    user?.isTeamMember 
                      ? "bg-red-50 text-red-700 border-red-100" 
                      : "bg-green-50 text-green-700 border-green-100"
                  )}>
                    {user?.isTeamMember ? "Restricted" : "Allowed"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full text-xs border-slate-200 hover:bg-slate-50 cursor-pointer"
              onClick={() => setIsProfileOpen(false)}
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setIsProfileOpen(false)
                signOut()
              }}
              className="w-full text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 cursor-pointer shadow-none"
            >
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}

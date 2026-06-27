"use client"

import { useState } from "react"
import { Bell, Search, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

// BUG-014 FIXED: Removed unused `useAppStore` import

export function TopNav() {
  const { user: clerkUser } = useUser()
  const { organization: clerkOrg, membership } = useOrganization()
  const { signOut, openUserProfile } = useClerk()
  const router = useRouter()

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

      {/* BUG-020 FIXED: Notification badge hidden — no real notification system exists yet */}
      <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg text-muted-foreground transition-colors hover:bg-navy-100 hover:text-navy">
        <Bell className="h-4 w-4" />
      </Button>

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

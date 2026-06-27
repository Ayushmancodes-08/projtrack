"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UserPlus, Shield, AlertCircle, Trash2 } from "lucide-react"
import { useOrganization, useUser, OrganizationSwitcher, CreateOrganization } from "@clerk/nextjs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const { isLoaded: userLoaded, user } = useUser()
  const { 
    isLoaded: orgLoaded, 
    organization, 
    memberships, 
    invitations 
  } = useOrganization({
    memberships: {
      pageSize: 20,
      keepPreviousData: true
    },
    invitations: {
      pageSize: 20,
      keepPreviousData: true
    }
  })

  const [orgName, setOrgName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("org:member")
  const [customTitle, setCustomTitle] = useState("")
  const [isSavingOrg, setIsSavingOrg] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [memberTitles, setMemberTitles] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("projtrack_member_titles") || "{}")
      } catch {
        return {}
      }
    }
    return {}
  })

  useEffect(() => {
    if (organization) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrgName(organization.name)
    }
  }, [organization])

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization) return
    if (!orgName.trim()) {
      toast.error("Organization name cannot be empty")
      return
    }

    try {
      setIsSavingOrg(true)
      await organization.update({ name: orgName })
      toast.success("Organization name updated successfully!")
    } catch {
      toast.error("Failed to update organization name")
    } finally {
      setIsSavingOrg(false)
    }
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization) return
    if (!email) {
      toast.error("Please enter an email address")
      return
    }

    try {
      setIsInviting(true)
      await organization.inviteMember({
        emailAddress: email,
        role: role as "org:member" | "org:admin"
      })

      // Save custom title locally
      const updatedTitles = { ...memberTitles, [email]: customTitle.trim() || "Team Member" }
      setMemberTitles(updatedTitles)
      localStorage.setItem("projtrack_member_titles", JSON.stringify(updatedTitles))

      toast.success(`Successfully sent invitation to ${email}!`)
      setIsDialogOpen(false)
      setEmail("")
      setCustomTitle("")
      // Refresh invitation list
      invitations?.revalidate?.()
    } catch {
      toast.error("Failed to send invitation")
    } finally {
      setIsInviting(false)
    }
  }

  const handleRevokeInvitation = async (invite: { id: string; revoke: () => Promise<unknown> }) => {
    if (!invite) return
    try {
      await invite.revoke()
      toast.success("Invitation revoked successfully")
      invitations?.revalidate?.()
    } catch {
      toast.error("Failed to revoke invitation")
    }
  }

  if (!userLoaded || !orgLoaded) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
            <Skeleton className="h-8 w-44 rounded-lg" />
          </div>

          <Card className="border-0 shadow-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3.5 w-40" />
                </div>
                <Skeleton className="h-9 w-32 rounded-lg" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your organization and team</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Switch Org:</span>
            <OrganizationSwitcher 
              afterCreateOrganizationUrl="/settings"
              afterSelectOrganizationUrl="/settings"
              appearance={{
                elements: {
                  rootBox: "border border-slate-200 rounded-lg p-0.5 bg-white shadow-xs",
                  organizationSwitcherTrigger: "text-xs font-semibold py-1 px-2.5"
                }
              }}
            />
          </div>
        </div>

        {!organization ? (
          /* Create organization fallback UI */
          <Card className="border-0 shadow-card bg-slate-50/50">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-bold text-navy">No Active Organization</h3>
                <p className="text-xs text-muted-foreground">
                  Create or select an organization to invite teammates, manage roles, and collaborate on projects in real-time.
                </p>
              </div>
              <div className="pt-2">
                <CreateOrganization afterCreateOrganizationUrl="/settings" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Organization details card */}
            <Card className="border-0 shadow-card">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/5">
                    <Shield className="h-5 w-5 text-navy/60" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-navy">Organization Details</h3>
                    <p className="text-xs text-muted-foreground">Update your team&apos;s workspace settings</p>
                  </div>
                </div>
                <form onSubmit={handleUpdateOrganization} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-navy/80">Organization Name</Label>
                      <Input 
                        value={orgName} 
                        onChange={(e) => setOrgName(e.target.value)} 
                        className="h-9 text-sm border-gray-200 focus-visible:ring-gold/30" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-navy/80">Active ID (Clerk)</Label>
                      <Input 
                        value={organization.id} 
                        disabled 
                        className="h-9 text-sm border-gray-100 bg-slate-50 text-slate-500 font-mono" 
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSavingOrg} 
                    className="bg-navy hover:bg-navy-lighter text-xs font-semibold"
                  >
                    {isSavingOrg ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Team members card */}
            <Card className="border-0 shadow-card">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-bold text-navy">Team Members</h3>
                    <p className="text-xs text-muted-foreground">
                      {memberships?.data?.length || 0} active members across your organization
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setIsDialogOpen(true)} 
                    className="bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm cursor-pointer hover:opacity-90"
                  >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    Invite Member
                  </Button>
                </div>

                {/* Live Active Members List */}
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Members</h4>
                  {memberships?.data?.map((m) => {
                    const pd = m.publicUserData
                    const initials = pd?.firstName 
                      ? `${pd.firstName[0]}${pd.lastName?.[0] || ""}`.toUpperCase()
                      : pd?.identifier?.slice(0, 2).toUpperCase() || ""
                    const isCurrentUser = pd?.userId === user?.id

                    return (
                      <div key={m.id} className="group flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 transition-all hover:border-gray-200 hover:shadow-sm">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 ring-2 ring-gray-100">
                            {pd?.imageUrl && <AvatarImage src={pd.imageUrl} />}
                            <AvatarFallback className="text-[10px] font-bold text-white bg-gradient-to-br from-navy to-navy-lighter">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-navy">
                              {pd?.firstName ? `${pd.firstName} ${pd.lastName || ""}`.trim() : "Pending Name"}
                              {isCurrentUser && <span className="ml-1.5 text-[9px] font-semibold text-gold-dark bg-gold/10 px-1.5 py-0.5 rounded-full border border-gold/20">You</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">{pd?.identifier}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-[10px] font-semibold tracking-wide px-2.5 py-0.5 capitalize",
                          m.role === "org:admin" ? "text-gold-dark border-gold/30 bg-gold/5" : "text-navy/60 border-navy/15"
                        )}>
                          <Shield className="mr-1 h-2.5 w-2.5" />
                          {(pd?.identifier && memberTitles[pd.identifier]) || (m.role === "org:admin" ? "Project Manager (Admin)" : "Team Member")}
                        </Badge>
                      </div>
                    )
                  })}
                </div>

                {/* Live Pending Invitations List */}
                {invitations?.data && invitations.data.length > 0 && (
                  <div className="space-y-2.5 pt-4 border-t border-slate-100">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Invitations</h4>
                    {invitations.data.map((invite) => (
                      <div key={invite.id} className="group flex items-center justify-between rounded-xl border border-dashed border-gray-200 px-4 py-3 transition-all hover:bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-400">
                            ✉
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-navy">{invite.emailAddress}</p>
                            <p className="text-xs text-slate-400">Sent and awaiting acceptance</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-[10px] text-purple-700 border-purple-200 bg-purple-50 px-2 py-0.5">
                            Invited as {memberTitles[invite.emailAddress] || (invite.role === "org:admin" ? "Admin" : "Member")}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRevokeInvitation(invite)}
                            className="h-7 w-7 text-slate-400 hover:text-red-500 rounded-md"
                            title="Revoke Invitation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Invite Member dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden shadow-2xl rounded-2xl bg-white">
          <form onSubmit={handleInviteSubmit}>
            <div className="p-6 pb-4">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-lg font-bold text-navy">Invite Team Member</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Send an official Clerk organization invite to join your workspace.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/80">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="teammate@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-9 text-sm border-gray-200 focus-visible:ring-gold/35"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/80">Workspace Role</Label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:border-gold/50 focus:outline-none"
                  >
                    <option value="org:member">Team Member</option>
                    <option value="org:admin">Project Manager (Admin)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-navy/80">Custom Title / Designation (optional)</Label>
                  <Input
                    placeholder="e.g. Lead Designer"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="h-9 text-sm border-gray-200 focus-visible:ring-gold/35"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex sm:flex-row justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isInviting}
                className="bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm"
              >
                {isInviting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

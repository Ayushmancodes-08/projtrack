"use client"

import React, { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UserPlus, Shield, AlertCircle, Trash2, Copy, Check, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
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

type Invitation = {
  id: string
  email: string
  code: string
  organization_id: string
  role: string
  custom_title: string
  created_at: string
  accepted: boolean
}

type WorkspaceMember = {
  id: string
  workspace_id: string
  user_id: string
  email: string
  role: string
  custom_title: string
  created_at: string
}

export default function SettingsPage() {
  const { user, isLoaded } = useAuth()
  const supabase = createClient()

  const [orgName, setOrgName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("DEVELOPER")
  const [customTitle, setCustomTitle] = useState("")
  const [isSavingOrg, setIsSavingOrg] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [visibleInviteIds, setVisibleInviteIds] = useState<Record<string, boolean>>({})
  
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const fetchSettingsData = async () => {
    if (!user) return
    setIsLoadingData(true)
    try {
      // 1. Fetch Invitations
      const { data: invitesData, error: invitesError } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("organization_id", user.organizationId)
        .order("created_at", { ascending: false })

      if (!invitesError && invitesData) {
        setInvitations(invitesData)
      }

      // 2. Fetch Workspace Members (or fallback to showing just the Admin)
      const { data: membersData, error: membersError } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", user.organizationId)

      if (!membersError && membersData) {
        setMembers(membersData)
      }
    } catch (e) {
      console.warn("Failed to fetch settings data from Supabase", e)
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      setOrgName(user.isTeamMember ? "Team Workspace" : `${user.fullName}'s Workspace`)
      fetchSettingsData()
    }
  }, [isLoaded, user])

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!orgName.trim()) {
      toast.error("Workspace name cannot be empty")
      return
    }

    try {
      setIsSavingOrg(true)
      // Since we are using user ID as workspace_id, we can just save the name locally or in a workspace table
      localStorage.setItem(`projtrack_org_name_${user.organizationId}`, orgName)
      toast.success("Workspace name updated successfully!")
    } catch {
      toast.error("Failed to update workspace name")
    } finally {
      setIsSavingOrg(false)
    }
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!email) {
      toast.error("Please enter an email address")
      return
    }

    try {
      setIsInviting(true)
      
      const targetEmail = email.trim().toLowerCase()

      // Check if an invitation already exists for this email IN THIS workspace only
      // (filter by organization_id to avoid picking up codes from other workspaces)
      const { data: existingInvite } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("email", targetEmail)
        .eq("organization_id", user.organizationId)
        .maybeSingle()

      let generatedCode = ""
      if (existingInvite) {
        // Reuse the SAME code — never generate a new one for an existing member/invitee
        generatedCode = existingInvite.code
        // Update role/title and mark as pending again if re-inviting
        const { error } = await supabase
          .from("team_invitations")
          .update({
            role: role,
            custom_title: customTitle.trim() || (role === "DEVELOPER" ? "Developer" : role === "CLIENT" ? "Client" : "Viewer"),
            accepted: false,
            created_at: new Date().toISOString()
          })
          .eq("id", existingInvite.id)
        if (error) throw error
      } else {
        // First-time invite for this email in this workspace — generate ONE code
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        generatedCode = `PT-${randomCode}`

        const { error } = await supabase
          .from("team_invitations")
          .insert({
            email: targetEmail,
            code: generatedCode,
            organization_id: user.organizationId,
            role: role,
            custom_title: customTitle.trim() || (role === "DEVELOPER" ? "Developer" : role === "CLIENT" ? "Client" : "Viewer"),
            created_at: new Date().toISOString(),
            accepted: false
          })

        if (error) throw error
      }

      // Send the invitation details to the person's email
      try {
        const mailResponse = await fetch("/api/send-invite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            code: generatedCode,
            role: role,
            customTitle: customTitle.trim() || (role === "DEVELOPER" ? "Developer" : role === "CLIENT" ? "Client" : "Viewer"),
            organizationName: orgName || `${user.fullName}'s Workspace`,
            invitedBy: user.fullName,
          }),
        })
        const mailData = await mailResponse.json()
        if (mailData.success) {
          toast.success(`Successfully created invitation and sent details to ${email}! (Code: ${generatedCode})`, {
            duration: 10000
          })
        } else {
          toast.warning(`Invitation created, but failed to send email: ${mailData.error || "Unknown error"} (Code: ${generatedCode})`, {
            duration: 10000
          })
        }
      } catch (emailErr) {
        console.error("Failed to send invitation email via API:", emailErr)
        toast.warning(`Invitation created, but failed to dispatch invitation email. (Code: ${generatedCode})`, {
          duration: 10000
        })
      }

      setIsDialogOpen(false)
      setEmail("")
      setCustomTitle("")
      
      // Refresh invitation list
      await fetchSettingsData()
    } catch (err) {
      console.error(err)
      toast.error("Failed to send invitation. Make sure the team_invitations table exists.")
    } finally {
      setIsInviting(false)
    }
  }

  const handleRevokeInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("team_invitations")
        .delete()
        .eq("id", id)

      if (error) throw error
      
      toast.success("Invitation revoked successfully")
      await fetchSettingsData()
    } catch {
      toast.error("Failed to revoke invitation")
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success("Invite code copied to clipboard!")
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!isLoaded || isLoadingData) {
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
        </div>
      </AppShell>
    )
  }

  if (user?.isTeamMember) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-navy">Settings</h1>
              <p className="mt-1 text-sm text-muted-foreground">View your organization settings</p>
            </div>
          </div>

          <Card className="border-0 shadow-card bg-slate-50/50">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-bold text-navy">Access Restricted</h3>
                <p className="text-xs text-muted-foreground">
                  As a Team Member, you do not have permission to modify organization settings or invite other members.
                </p>
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
            <p className="mt-1 text-sm text-muted-foreground">Manage your workspace and team members</p>
          </div>
        </div>

        {/* Organization details card */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/5">
                <Shield className="h-5 w-5 text-navy/60" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-navy">Workspace Details</h3>
                <p className="text-xs text-muted-foreground">Update your team&apos;s workspace settings</p>
              </div>
            </div>
            <form onSubmit={handleUpdateOrganization} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-navy/80">Workspace Name</Label>
                  <Input 
                    value={orgName} 
                    onChange={(e) => setOrgName(e.target.value)} 
                    className="h-9 text-sm border-gray-200 focus-visible:ring-gold/30" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-navy/80">Workspace ID (Supabase)</Label>
                  <Input 
                    value={user?.organizationId || ""} 
                    disabled 
                    className="h-9 text-sm border-gray-100 bg-slate-50 text-slate-500 font-mono" 
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isSavingOrg} 
                className="bg-navy hover:bg-navy-lighter text-xs font-semibold cursor-pointer"
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
                  {members.length + 1} active members in this workspace
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={() => setIsDialogOpen(true)} 
                className="bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm cursor-pointer hover:opacity-90 border-0"
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Invite Member
              </Button>
            </div>

            {/* Active Members List */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Members</h4>
              
              {/* Admin (Current User) */}
              <div className="group flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 transition-all hover:border-gray-200 hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 ring-2 ring-gray-100">
                    <AvatarFallback className="text-[10px] font-bold text-white bg-gradient-to-br from-navy to-navy-lighter">
                      {user?.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "AD"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-navy">
                      {user?.fullName}
                      <span className="ml-1.5 text-[9px] font-semibold text-gold-dark bg-gold/10 px-1.5 py-0.5 rounded-full border border-gold/20">Owner</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold tracking-wide px-2.5 py-0.5 capitalize text-gold-dark border-gold/30 bg-gold/5">
                  <Shield className="mr-1 h-2.5 w-2.5" />
                  Project Manager (Admin)
                </Badge>
              </div>

              {/* Joined Members */}
              {members.map((m) => (
                <div key={m.id} className="group flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 transition-all hover:border-gray-200 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 ring-2 ring-gray-100">
                      <AvatarFallback className="text-[10px] font-bold text-white bg-gradient-to-br from-navy to-navy-lighter">
                        {m.email.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-navy">{m.email.split("@")[0]}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold tracking-wide px-2.5 py-0.5 capitalize text-navy/60 border-navy/15">
                    <Shield className="mr-1 h-2.5 w-2.5" />
                    {m.custom_title || m.role}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Invitations List */}
            {invitations.length > 0 && (
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Invitations</h4>
                {invitations.map((invite) => {
                  const isVisible = !!visibleInviteIds[invite.id]
                  const maskedCode = invite.code.replace(/^(PT-)?(.*)$/, (_, prefix, suffix) => {
                    const pref = prefix || ""
                    return pref + "•".repeat(suffix.length)
                  })
                  return (
                    <div key={invite.id} className="group flex items-center justify-between rounded-xl border border-dashed border-gray-200 px-4 py-3 transition-all hover:bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-400">
                          ✉
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-navy">{invite.email}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            Code: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-navy font-bold text-[10px]">{isVisible ? invite.code : maskedCode}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setVisibleInviteIds(prev => ({ ...prev, [invite.id]: !prev[invite.id] }))
                              }}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors cursor-pointer"
                              title={isVisible ? "Hide code" : "Show code"}
                            >
                              {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(invite.code, invite.id)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors cursor-pointer"
                              title="Copy code"
                            >
                              {copiedId === invite.id ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {invite.accepted ? (
                          <Badge variant="outline" className="text-[10px] text-green-700 border-green-200 bg-green-50 px-2 py-0.5 font-semibold">
                            Accepted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold">
                            Pending
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] text-purple-700 border-purple-200 bg-purple-50 px-2 py-0.5">
                          Invited as {invite.custom_title || invite.role}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRevokeInvitation(invite.id)}
                          className="h-7 w-7 text-slate-400 hover:text-red-500 rounded-md cursor-pointer"
                          title="Revoke Invitation"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invite Member dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden shadow-2xl rounded-2xl bg-white">
          <form onSubmit={handleInviteSubmit}>
            <div className="p-6 pb-4">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-lg font-bold text-navy">Invite Team Member</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Invite a team member to join this workspace. They will log in using their email and the generated invite code.
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
                    <option value="DEVELOPER">Developer (Can view & update status)</option>
                    <option value="CLIENT">Client (Can view & update status)</option>
                    <option value="VIEWER">Viewer (Can only view)</option>
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
                className="text-xs hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isInviting}
                className="bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm border-0 cursor-pointer"
              >
                {isInviting ? "Generating Code..." : "Create Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

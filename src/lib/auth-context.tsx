"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Role } from "@/lib/types"

export type AuthUser = {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  role: Role
  isTeamMember: boolean
  organizationId: string
  inviteCode?: string
}

type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  isLoaded: boolean
  loginAsIndependent: (email: string, password: string, redirectTo?: string) => Promise<void>
  signUpAsIndependent: (email: string, password: string, fullName: string, redirectTo?: string) => Promise<void>
  loginAsTeamMember: (email: string, code: string, redirectTo?: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Cookie Helpers
function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const matches = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"
    )
  )
  return matches ? decodeURIComponent(matches[1]) : null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`
}

function resolveRedirectTarget(explicit?: string): string {
  if (explicit && explicit.startsWith("/") && !explicit.startsWith("//")) {
    return explicit
  }
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search)
    const urlRedirect = params.get("redirectTo")
    if (urlRedirect && urlRedirect.startsWith("/") && !urlRedirect.startsWith("//")) {
      return urlRedirect
    }
  }
  return "/dashboard"
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const checkSession = async () => {
    try {
      // 1. Check Team Member cookie session first
      const teamSessionStr = getCookie("projtrack_team_session")
      if (teamSessionStr) {
        try {
          const teamSession = JSON.parse(teamSessionStr)
          setUser({
            id: `team-${teamSession.email}-${teamSession.organizationId}`,
            email: teamSession.email,
            fullName: teamSession.email.split("@")[0],
            avatarUrl: null,
            role: teamSession.role as Role,
            isTeamMember: true,
            organizationId: teamSession.organizationId,
            inviteCode: teamSession.code,
          })
          setLoading(false)
          setIsLoaded(true)
          return
        } catch (e) {
          console.warn("Failed to parse team session cookie", e)
          deleteCookie("projtrack_team_session")
        }
      }

      // 2. Check Supabase Auth Session for Independent User
      // First inspect local session storage to avoid unnecessary/failed network calls when unauthenticated
      let authUser: any = null
      try {
        const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession()
        if (!sessionErr && sessionRes?.session?.user) {
          authUser = sessionRes.session.user
          // Optionally verify with server in the background
          try {
            const userRes = await supabase.auth.getUser()
            if (userRes?.data?.user) {
              authUser = userRes.data.user
            }
          } catch {
            // Keep local session user if remote fetch times out or fails
          }
        }
      } catch (authFetchErr) {
        console.warn("Could not retrieve Supabase auth session:", authFetchErr)
        authUser = null
      }

      if (authUser) {
        // Fetch profile
        let profile = null
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle()
          if (!error && data) {
            profile = data
          }
        } catch (profErr) {
          console.warn("Could not fetch user profile:", profErr)
        }

        // Auto-provision profile if it doesn't exist
        if (!profile) {
          try {
            const fullName =
              authUser.user_metadata?.full_name ||
              authUser.email?.split("@")[0] ||
              "Independent User"
            const { data: newProfile, error: insertError } = await supabase
              .from("profiles")
              .upsert({
                id: authUser.id,
                email: authUser.email || "",
                full_name: fullName,
                created_at: new Date().toISOString(),
              })
              .select()
              .maybeSingle()

            if (!insertError && newProfile) {
              profile = newProfile
            }
          } catch (insertErr) {
            console.warn("Failed to automatically create profile:", insertErr)
          }
        }

        // Fetch user's workspace
        let resolvedWorkspaceId = authUser.id
        try {
          const { data: userWs } = await supabase
            .from("workspaces")
            .select("id")
            .eq("owner_id", authUser.id)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle()

          if (userWs?.id) {
            resolvedWorkspaceId = userWs.id
          } else {
            const { data: memberWs } = await supabase
              .from("workspace_members")
              .select("workspace_id")
              .eq("user_id", authUser.id)
              .order("created_at", { ascending: true })
              .limit(1)
              .maybeSingle()

            if (memberWs?.workspace_id) {
              resolvedWorkspaceId = memberWs.workspace_id
            }
          }
        } catch (wsErr) {
          console.warn("Could not query user workspace, using user.id:", wsErr)
        }

        setUser({
          id: authUser.id,
          email: authUser.email || "",
          fullName:
            profile?.full_name ||
            authUser.user_metadata?.full_name ||
            authUser.email?.split("@")[0] ||
            "Independent User",
          avatarUrl: profile?.avatar_url || null,
          role: "OWNER",
          isTeamMember: false,
          organizationId: resolvedWorkspaceId,
        })
      } else {
        setUser(null)
      }
    } catch (error) {
      console.warn("Error checking auth session:", error)
      setUser(null)
    } finally {
      setLoading(false)
      setIsLoaded(true)
    }
  }

  useEffect(() => {
    checkSession()

    // Listen for Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null)
      } else if (session?.user) {
        const teamSessionStr = getCookie("projtrack_team_session")
        if (!teamSessionStr) {
          await checkSession()
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loginAsIndependent = async (
    email: string,
    password: string,
    redirectTo?: string
  ) => {
    setLoading(true)
    deleteCookie("projtrack_team_session")

    const normalizedEmail = email.trim().toLowerCase()
    let { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) {
      setLoading(false)
      throw error
    }

    await checkSession()
    window.location.href = resolveRedirectTarget(redirectTo)
  }

  const signUpAsIndependent = async (
    email: string,
    password: string,
    fullName: string,
    redirectTo?: string
  ) => {
    setLoading(true)
    deleteCookie("projtrack_team_session")

    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            resolveRedirectTarget(redirectTo)
          )}`
        : undefined

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        emailRedirectTo,
      },
    })

    if (error) {
      setLoading(false)
      throw error
    }

    if (data.user) {
      try {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          created_at: new Date().toISOString(),
        })
      } catch (upsertErr) {
        console.warn("Could not upsert profile after signup:", upsertErr)
      }
    }

    await checkSession()
    window.location.href = resolveRedirectTarget(redirectTo)
  }

  const loginAsTeamMember = async (
    email: string,
    code: string,
    redirectTo?: string
  ) => {
    setLoading(true)

    const normalizedEmail = email.trim().toLowerCase()
    const trimmedCode = code.trim()

    const { data: invitation, error } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", trimmedCode)
      .single()

    if (error || !invitation) {
      setLoading(false)
      throw new Error("Invalid email or invitation code. Please check and try again.")
    }

    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore signOut errors if not signed in
    }

    try {
      const { data: existingMember } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", invitation.organization_id)
        .eq("email", normalizedEmail)
        .maybeSingle()

      if (!existingMember) {
        await supabase.from("workspace_members").insert({
          workspace_id: invitation.organization_id,
          email: normalizedEmail,
          role: invitation.role,
          custom_title: invitation.custom_title,
          created_at: new Date().toISOString(),
        })

        await supabase
          .from("team_invitations")
          .update({ accepted: true })
          .eq("id", invitation.id)
      }
    } catch (dbErr) {
      console.warn("Failed to check/insert workspace member in database:", dbErr)
    }

    const sessionData = {
      email: invitation.email,
      role: invitation.role,
      organizationId: invitation.organization_id,
      code: invitation.code,
    }

    setCookie("projtrack_team_session", JSON.stringify(sessionData), 7)

    setUser({
      id: `team-${invitation.email}-${invitation.organization_id}`,
      email: invitation.email,
      fullName: invitation.email.split("@")[0],
      avatarUrl: null,
      role: invitation.role as Role,
      isTeamMember: true,
      organizationId: invitation.organization_id,
      inviteCode: invitation.code,
    })

    setLoading(false)
    setIsLoaded(true)
    toast.success("Successfully logged in as Team Member!")
    window.location.href = resolveRedirectTarget(redirectTo)
  }

  const resetPassword = async (email: string) => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : ""
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      }
    )
    if (error) throw error
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
  }

  const signOut = async () => {
    setLoading(true)
    deleteCookie("projtrack_team_session")
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore signout error if session was already expired
    }
    setUser(null)
    setLoading(false)
    window.location.href = "/login"
  }

  const refreshSession = async () => {
    await checkSession()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoaded,
        loginAsIndependent,
        signUpAsIndependent,
        loginAsTeamMember,
        resetPassword,
        updatePassword,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

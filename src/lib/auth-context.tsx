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
  loginAsIndependent: (email: string, password: string) => Promise<void>
  signUpAsIndependent: (email: string, password: string, fullName: string) => Promise<void>
  loginAsTeamMember: (email: string, code: string) => Promise<void>
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
  const matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ))
  return matches ? decodeURIComponent(matches[1]) : null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`
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
          console.error("Failed to parse team session cookie", e)
          deleteCookie("projtrack_team_session")
        }
      }

      // 2. Check Supabase Auth Session for Independent User
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          fullName: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Independent User",
          avatarUrl: profile?.avatar_url || null,
          role: "OWNER", // Independent users are OWNERS of their workspace
          isTeamMember: false,
          organizationId: session.user.id, // Their organization ID is their user ID
        })
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Error checking auth session:", error)
      setUser(null)
    } finally {
      setLoading(false)
      setIsLoaded(true)
    }
  }

  useEffect(() => {
    checkSession()

    // Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null)
      } else if (session?.user) {
        // Only trigger checkSession if not currently logged in as a team member
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

  const loginAsIndependent = async (email: string, password: string) => {
    setLoading(true)
    // Clear any existing team session first
    deleteCookie("projtrack_team_session")

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      throw error
    }
    await checkSession()
    window.location.href = "/dashboard"
  }

  const signUpAsIndependent = async (email: string, password: string, fullName: string) => {
    setLoading(true)
    deleteCookie("projtrack_team_session")

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setLoading(false)
      throw error
    }

    if (data.user) {
      // Create profile in profiles table
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        created_at: new Date().toISOString(),
      })
    }

    await checkSession()
    window.location.href = "/dashboard"
  }

  const loginAsTeamMember = async (email: string, code: string) => {
    setLoading(true)
    
    // Check team_invitations table for matching email and code
    const { data: invitation, error } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .eq("code", code.trim())
      .single()

    if (error || !invitation) {
      setLoading(false)
      throw new Error("Invalid email or invitation code. Please check and try again.")
    }

    // Sign out of Supabase Auth if currently signed in
    await supabase.auth.signOut()

    // Ensure they are recorded in the workspace_members table (idempotent)
    try {
      const { data: existingMember } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", invitation.organization_id)
        .eq("email", invitation.email.trim().toLowerCase())
        .maybeSingle()

      if (!existingMember) {
        // First login: create workspace member row
        await supabase.from("workspace_members").insert({
          workspace_id: invitation.organization_id,
          email: invitation.email.trim().toLowerCase(),
          role: invitation.role,
          custom_title: invitation.custom_title,
          created_at: new Date().toISOString()
        })

        // Mark the invitation as accepted only on the first successful login
        await supabase
          .from("team_invitations")
          .update({ accepted: true })
          .eq("id", invitation.id)
      }
      // If existingMember exists, this is a re-login — code is already static & valid, no DB changes needed
    } catch (dbErr) {
      console.warn("Failed to check/insert workspace member in database:", dbErr)
    }

    // Store team member session in cookie
    const sessionData = {
      email: invitation.email,
      role: invitation.role,
      organizationId: invitation.organization_id,
      code: invitation.code,
    }
    
    setCookie("projtrack_team_session", JSON.stringify(sessionData), 7)
    
    // Set user state
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
    window.location.href = "/dashboard"
  }

  const signOut = async () => {
    setLoading(true)
    deleteCookie("projtrack_team_session")
    await supabase.auth.signOut()
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

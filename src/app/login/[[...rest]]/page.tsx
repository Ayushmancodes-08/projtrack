"use client"

import React, { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Shield, Mail, Lock, Key, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function LoginPage() {
  const { loginAsIndependent, loginAsTeamMember } = useAuth()
  const [loginType, setLoginType] = useState<"independent" | "team">("independent")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setIsLoading(true)
    try {
      if (loginType === "independent") {
        if (!password) {
          toast.error("Please enter your password")
          setIsLoading(false)
          return
        }
        await loginAsIndependent(email, password)
        toast.success("Successfully logged in!")
      } else {
        if (!inviteCode) {
          toast.error("Please enter your invite code")
          setIsLoading(false)
          return
        }
        await loginAsTeamMember(email, inviteCode)
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-[#0D2647] to-navy-light px-4">
      {/* Background Decorative Circles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-60 -top-60 h-[500px] w-[500px] rounded-full border border-gold/5 animate-pulse" style={{ animationDuration: "10s" }} />
        <div className="absolute -bottom-60 -right-60 h-[500px] w-[500px] rounded-full border border-gold/5 animate-pulse" style={{ animationDuration: "15s" }} />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.01] blur-3xl" />
      </div>

      <div className="relative z-10 mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold-dark shadow-lg shadow-gold/20 transform transition-transform hover:scale-105 duration-300">
          <Shield className="h-7 w-7 text-navy" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">projectBeacon</h1>
        <p className="mt-1 text-xs text-white/50 font-medium tracking-wide uppercase">
          Autonomous Project Intelligence
        </p>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/15">
        
        {/* Toggle Switch */}
        <div className="mb-6 flex rounded-lg bg-navy/40 p-1 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setLoginType("independent")
              setEmail("")
              setPassword("")
              setInviteCode("")
            }}
            className={`flex-1 rounded-md py-2 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
              loginType === "independent"
                ? "bg-gradient-to-r from-gold to-gold-dark text-navy shadow-sm"
                : "text-white/60 hover:text-white"
            }`}
          >
            Independent User
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType("team")
              setEmail("")
              setPassword("")
              setInviteCode("")
            }}
            className={`flex-1 rounded-md py-2 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
              loginType === "team"
                ? "bg-gradient-to-r from-gold to-gold-dark text-navy shadow-sm"
                : "text-white/60 hover:text-white"
            }`}
          >
            Team Member
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-white/80">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-white/35 focus:border-gold/50 focus:bg-white/10 focus-visible:ring-gold/20"
              />
            </div>
          </div>

          {loginType === "independent" ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-white/80">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-gold hover:text-gold-light transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-white/35 focus:border-gold/50 focus:bg-white/10 focus-visible:ring-gold/20"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-white/80">Invite Code</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="text"
                  placeholder="PT-XXXXXX"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  className="h-10 border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-white/35 font-mono focus:border-gold/50 focus:bg-white/10 focus-visible:ring-gold/20"
                />
              </div>
              <p className="text-[10px] text-white/40 leading-normal mt-1">
                Enter the code sent to you by your team administrator.
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 mt-2 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-navy font-bold text-sm tracking-wide shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              "Authenticating..."
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                {loginType === "independent" ? "Sign In" : "Join Team"}
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        {/* Footer Link */}
        {loginType === "independent" && (
          <div className="mt-5 text-center text-xs text-white/40">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-gold hover:text-gold-light transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      <p className="relative z-10 mt-8 text-[10px] text-white/20 font-medium tracking-wider uppercase">
        &copy; {new Date().getFullYear()} ProjTrack. All rights reserved.
      </p>
    </div>
  )
}

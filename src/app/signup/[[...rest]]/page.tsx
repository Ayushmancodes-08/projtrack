"use client"

import React, { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Shield, Mail, Lock, User, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function SignupPage() {
  const { signUpAsIndependent } = useAuth()
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !fullName || !password) {
      toast.error("Please fill in all fields")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    setIsLoading(true)
    try {
      await signUpAsIndependent(email, password, fullName)
      toast.success("Account created successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to create account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-[#0D2647] to-navy-light px-4">
      {/* Background Decorative Circles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-60 -top-60 h-[500px] w-[500px] rounded-full border border-gold/5 animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute -bottom-60 -right-60 h-[500px] w-[500px] rounded-full border border-gold/5 animate-pulse" style={{ animationDuration: "18s" }} />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.01] blur-3xl" />
      </div>

      <div className="relative z-10 mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold-dark shadow-lg shadow-gold/20 transform transition-transform hover:scale-105 duration-300">
          <Shield className="h-7 w-7 text-navy" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Create Account</h1>
        <p className="mt-1 text-xs text-white/50 font-medium tracking-wide uppercase">
          Start Managing Your Projects Today
        </p>
      </div>

      {/* Main Signup Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/15">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-white/80">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-10 border-white/10 bg-white/5 pl-10 text-sm text-white placeholder:text-white/35 focus:border-gold/50 focus:bg-white/10 focus-visible:ring-gold/20"
              />
            </div>
          </div>

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

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-white/80">Password</Label>
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
            <p className="text-[10px] text-white/35 mt-1">
              Must be at least 6 characters long.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 mt-2 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-navy font-bold text-sm tracking-wide shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              "Creating Account..."
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Register
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-white/40">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-gold hover:text-gold-light transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>

      <p className="relative z-10 mt-8 text-[10px] text-white/20 font-medium tracking-wider uppercase">
        &copy; {new Date().getFullYear()} projectBeacon. All rights reserved.
      </p>
    </div>
  )
}

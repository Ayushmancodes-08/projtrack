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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#151311] px-4">
      {/* Warm Ambient Embers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-60 -top-60 h-[520px] w-[520px] rounded-full bg-orange-600/[0.08] blur-[140px]" />
        <div className="absolute -bottom-60 -right-60 h-[520px] w-[520px] rounded-full bg-amber-600/[0.06] blur-[150px]" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-500/[0.03] blur-[160px]" />
      </div>

      <div className="relative z-10 mb-7 text-center">
        <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 shadow-xl shadow-orange-950/40 transform transition-transform hover:scale-105 duration-300">
          <Shield className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#FAF8F5]">Create Account</h1>
        <p className="mt-1 text-xs text-stone-400 font-medium tracking-wider uppercase">
          Autonomous Project Intelligence
        </p>
      </div>

      {/* Main Signup Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-stone-800/80 bg-[#1F1B18]/85 p-7 backdrop-blur-xl shadow-2xl shadow-black/40 transition-all duration-300 hover:border-stone-700/80">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-300">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
              <Input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-10.5 rounded-xl border-stone-800 bg-stone-900/50 pl-10 text-sm text-[#FAF8F5] placeholder:text-stone-600 focus:border-orange-500/60 focus:bg-stone-900/80 focus-visible:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-300">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10.5 rounded-xl border-stone-800 bg-stone-900/50 pl-10 text-sm text-[#FAF8F5] placeholder:text-stone-600 focus:border-orange-500/60 focus:bg-stone-900/80 focus-visible:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-stone-300">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10.5 rounded-xl border-stone-800 bg-stone-900/50 pl-10 text-sm text-[#FAF8F5] placeholder:text-stone-600 focus:border-orange-500/60 focus:bg-stone-900/80 focus-visible:ring-orange-500/20"
              />
            </div>
            <p className="text-[10px] text-stone-500 mt-1">
              Must be at least 6 characters long.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 mt-3 rounded-xl bg-gradient-to-r from-orange-600 via-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-sm tracking-wide shadow-lg shadow-orange-950/40 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              "Creating Account..."
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Register Account
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-stone-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-orange-400 hover:text-orange-300 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>

      <p className="relative z-10 mt-8 text-[10px] text-stone-600 font-medium tracking-widest uppercase">
        &copy; {new Date().getFullYear()} projectBeacon. Crafted with precision.
      </p>
    </div>
  )
}

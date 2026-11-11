"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Shield, Lock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        throw error
      }

      setSuccess(true)
      toast.success("Password updated successfully!")
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err: any) {
      toast.error(err.message || "Failed to update password. Your reset link may have expired.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#151311] px-4">
      {/* Warm Ambient Radial Embers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-60 -top-60 h-[520px] w-[520px] rounded-full bg-orange-600/[0.08] blur-[140px]" />
        <div className="absolute -bottom-60 -right-60 h-[520px] w-[520px] rounded-full bg-amber-600/[0.06] blur-[150px]" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-500/[0.03] blur-[160px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border border-stone-800/80 bg-[#1F1B18]/85 p-7 backdrop-blur-xl shadow-2xl shadow-black/40">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 shadow-xl shadow-orange-950/40">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#FAF8F5]">Set New Password</h1>
            <p className="mt-1.5 text-xs text-stone-400">
              Please enter your new password below
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 text-center text-xs text-emerald-400">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <p className="font-semibold text-sm text-emerald-300">Password successfully reset!</p>
                <p className="text-xs text-emerald-500">Redirecting you to dashboard...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-stone-300">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-10.5 rounded-xl pl-10 border-stone-800 bg-stone-900/50 text-sm text-[#FAF8F5] focus:border-orange-500/60 focus:bg-stone-900/80"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-stone-300">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-10.5 rounded-xl pl-10 border-stone-800 bg-stone-900/50 text-sm text-[#FAF8F5] focus:border-orange-500/60 focus:bg-stone-900/80"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full mt-2 rounded-xl bg-gradient-to-r from-orange-600 via-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-orange-950/40 transition-all hover:brightness-110"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating Password...</>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>

      <p className="relative z-10 mt-8 text-[10px] text-stone-600 font-medium tracking-widest uppercase">
        &copy; {new Date().getFullYear()} projectBeacon. Crafted with precision.
      </p>
    </div>
  )
}

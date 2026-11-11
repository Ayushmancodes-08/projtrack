"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, ArrowLeft, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo,
        }
      )

      if (error) {
        throw error
      }

      setSent(true)
      toast.success("Password reset instructions sent to your email")
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link. Please try again.")
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
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-stone-400 transition-colors hover:text-stone-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>

          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 shadow-xl shadow-orange-950/40">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#FAF8F5]">Reset password</h1>
            <p className="mt-1.5 text-xs text-stone-400">
              {sent
                ? "Check your email for the reset link"
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-center text-xs text-emerald-400">
                Email sent to <strong>{email}</strong>! Check your inbox for the link.
              </div>
              <Button
                variant="outline"
                className="h-10.5 w-full border-stone-800 bg-stone-900/40 text-stone-300 hover:bg-stone-800 text-xs"
                onClick={() => setSent(false)}
              >
                Send again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-stone-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-10.5 rounded-xl border-stone-800 bg-stone-900/50 pl-3.5 text-sm text-[#FAF8F5] placeholder:text-stone-600 focus:border-orange-500/60 focus:bg-stone-900/80 focus-visible:ring-orange-500/20"
                  required
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-orange-950/40 transition-all hover:brightness-110"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                ) : (
                  "Send Reset Link"
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

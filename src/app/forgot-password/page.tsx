"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, ArrowLeft, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-[#0D2647] to-navy-light">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-60 -top-60 h-[500px] w-[500px] rounded-full border border-gold/5" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.02] blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-modal backdrop-blur-sm">
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-navy"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>

          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-navy-light shadow-lg">
              <Shield className="h-7 w-7 text-gold" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-navy">Reset password</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {sent
                ? "Check your email for the reset link"
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center text-sm text-green-700">
                Email sent! Check your inbox.
              </div>
              <Button
                variant="outline"
                className="h-10 w-full border-gray-200"
                onClick={() => setSent(false)}
              >
                Send again
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setLoading(true)
                setTimeout(() => { setLoading(false); setSent(true) }, 1500)
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-navy/80">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="h-10 border-gray-200 bg-gray-50/50 text-sm transition-all focus:border-gold focus:bg-white focus-visible:ring-gold/30"
                  required
                />
              </div>
              <Button
                type="submit"
                className="h-10 w-full bg-gradient-to-r from-gold to-gold-dark text-sm font-semibold text-navy shadow-sm transition-all hover:shadow-md hover:brightness-110"
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

      <p className="relative z-10 mt-8 text-[11px] text-white/20 font-medium tracking-wider uppercase">
        &copy; {new Date().getFullYear()} projectBeacon. All rights reserved.
      </p>
    </div>
  )
}


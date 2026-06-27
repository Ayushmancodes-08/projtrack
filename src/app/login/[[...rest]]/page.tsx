"use client"

import { SignIn } from "@clerk/nextjs"
import { Shield } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-[#0D2647] to-navy-light">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-60 -top-60 h-[500px] w-[500px] rounded-full border border-gold/5" />
        <div className="absolute -bottom-60 -right-60 h-[500px] w-[500px] rounded-full border border-gold/5" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.02] blur-3xl" />
      </div>

      <div className="relative z-10 mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold-dark shadow-lg shadow-gold/20">
          <Shield className="h-7 w-7 text-navy" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">ProjTrack</h1>
        <p className="mt-1.5 text-sm text-white/50 font-medium tracking-wide">
          Autonomous Project Intelligence
        </p>
      </div>

      <div className="relative z-10">
        <SignIn signUpUrl="/signup" forceRedirectUrl="/dashboard" />
      </div>

      <p className="relative z-10 mt-8 text-[11px] text-white/20 font-medium tracking-wider uppercase">
        &copy; {new Date().getFullYear()} ProjTrack. All rights reserved.
      </p>
    </div>
  )
}

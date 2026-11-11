import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/lib/auth-context"

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "projectBeacon — Autonomous Project Intelligence",
  description: "Enterprise-grade project intelligence platform with automated health monitoring",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthProvider>
      <html lang="en" className={`${jakarta.variable} ${fraunces.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col font-sans">
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </body>
      </html>
    </AuthProvider>
  )
}

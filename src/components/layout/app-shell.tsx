"use client"

import { Sidebar } from "./sidebar"
import { TopNav } from "./top-nav"
import { MobileBottomNav } from "./mobile-bottom-nav"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-surface p-3.5 sm:p-5 lg:p-6 pb-24 lg:pb-6 scroll-smooth">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

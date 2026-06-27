"use client"

// BUG-015 FIXED: Removed unused `cn` import
import { Sidebar } from "./sidebar"
import { TopNav } from "./top-nav"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-surface p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

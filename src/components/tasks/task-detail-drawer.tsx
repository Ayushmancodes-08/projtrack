"use client"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, GitCommit, Plus, X } from "lucide-react"
import { PRIORITIES } from "@/lib/constants"
import { cn } from "@/lib/utils"

type TaskDetailDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailDrawer({ open, onOpenChange }: TaskDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-lg overflow-y-auto border-l border-gray-200 p-0 sm:max-w-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Select defaultValue="in_progress">
              <SelectTrigger className="h-7 w-[120px] border-gray-200 text-[10px] font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["To Do", "In Progress", "Review", "Done"].map((label) => (
                  <SelectItem key={label} value={label.toLowerCase().replace(/\s+/g, "_")} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="HIGH">
              <SelectTrigger className="h-7 w-[85px] border-gray-200 text-[10px] font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button onClick={() => onOpenChange(false)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-gray-100 hover:text-navy transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <input
            defaultValue="Login screen UI implementation"
            className="w-full text-lg font-bold text-navy bg-transparent border-none outline-none p-0 focus:ring-0 placeholder:text-muted-foreground/30"
            placeholder="Task title"
          />

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Description</Label>
            <Textarea
              defaultValue="Implement the login screen with email/password and OAuth options. Must include error handling and loading states."
              className="min-h-[80px] text-sm resize-none border-gray-200 focus-visible:ring-gold/30 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Assignee</Label>
              <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3 py-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[9px] font-bold bg-gradient-to-br from-navy to-navy-lighter text-white">ML</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-navy">Maria Lopez</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Due Date</Label>
              <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-navy">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Jun 28, 2026
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Blocked</Label>
            <div className="flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/[0.03] px-3 py-2">
              <input
                type="text"
                defaultValue="Waiting on design review for the new mockups"
                className="flex-1 bg-transparent text-sm text-gold-dark outline-none placeholder:text-gold/50"
                placeholder="Reason for block..."
              />
              <Badge variant="outline" className="text-[9px] font-semibold bg-gold/10 text-gold-dark border-gold/20">BLOCKED</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Subtasks</Label>
              <Button variant="ghost" size="sm" className="h-6 text-xs font-semibold text-muted-foreground gap-1 hover:text-navy">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            <div className="space-y-1.5">
              {[
                { id: "s1", title: "Design login form layout", done: true },
                { id: "s2", title: "Implement email validation", done: true },
                { id: "s3", title: "Add Google OAuth button", done: false },
                { id: "s4", title: "Error state handling", done: false },
              ].map((sub) => (
                <div key={sub.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors">
                  <Checkbox checked={sub.done} className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
                  <span className={cn("text-sm", sub.done ? "line-through text-muted-foreground/60" : "text-navy/80")}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Linked Commits</Label>
            <div className="rounded-xl border border-green-200 bg-green-50/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-100">
                  <GitCommit className="h-3.5 w-3.5 text-green-600" />
                </div>
                <span className="text-xs font-bold text-green-700">Fixes #t6 — Login screen UI</span>
              </div>
              <p className="mt-1 ml-8 text-xs text-green-600">Implemented login form with OAuth integration</p>
              <p className="mt-0.5 ml-8 text-[10px] text-muted-foreground">main &middot; 2 hours ago</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Comments</Label>
              <span className="text-[10px] font-medium text-muted-foreground/60">5 comments</span>
            </div>

            <div className="space-y-4">
              {[
                { author: "ML", name: "Maria Lopez", text: "I think we should also add the 'remember me' checkbox here.", time: "2h ago", color: "from-gold to-gold-dark text-navy" },
                { author: "AK", name: "Alex Kim", text: "Good point. Let me update the mockup and share it.", time: "1h ago", color: "from-navy to-navy-lighter text-white" },
              ].map((comment, i) => (
                <div key={i} className="flex gap-3">
                  <Avatar className="h-7 w-7 shrink-0 ring-2 ring-white">
                    <AvatarFallback className={cn("text-[9px] font-bold", comment.color)}>
                      {comment.author}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-navy">{comment.name}</span>
                      <span className="text-[10px] text-muted-foreground">{comment.time}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5 pt-2">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[9px] font-bold bg-gradient-to-br from-navy to-navy-lighter text-white">U</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <input
                  placeholder="Write a comment... Use @ to mention someone"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition-all focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
                />
                <Button size="sm" className="h-9 bg-gradient-to-r from-gold to-gold-dark text-navy text-xs font-semibold shadow-sm">
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

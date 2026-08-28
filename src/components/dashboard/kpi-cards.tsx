"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, Info, AlertOctagon, CheckCircle2, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type KPIItemDetail = {
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: string
}

type KPICardProps = {
  title: string
  value: string
  trend: "up" | "down" | "neutral"
  trendLabel: string
  icon: React.ElementType
  accent?: string
  explanation?: string
  signalType?: "active" | "blocked" | "risk" | "tasks"
  items?: KPIItemDetail[]
}

export function KPICard({
  title,
  value,
  trend,
  trendLabel,
  icon: Icon,
  accent = "bg-navy/5",
  explanation,
  signalType,
  items = [],
}: KPICardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const isSignalCard = signalType === "blocked" || signalType === "active" || signalType === "risk"
  const isBlocked = signalType === "blocked" && parseInt(value) > 0
  const isRisk = signalType === "risk" && parseInt(value) > 0

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group relative cursor-pointer border-0 shadow-card transition-all duration-300 ease-out",
          "hover:-translate-y-1 hover:shadow-card-hover",
          isHovered && "ring-2 ring-gold/40 shadow-lg",
          isBlocked && "ring-1 ring-red-200 hover:ring-red-400 bg-gradient-to-br from-white via-white to-red-50/20",
          isRisk && "ring-1 ring-amber-200 hover:ring-amber-400 bg-gradient-to-br from-white via-white to-amber-50/20",
          isOpen && "ring-2 ring-gold shadow-xl"
        )}
      >
        {/* Animated Beacon/Pulsing Dot for Signals */}
        {isBlocked && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white shadow-xs" />
          </span>
        )}
        {signalType === "active" && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white" />
          </span>
        )}

        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {title}
                </p>
                <span className="text-[10px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Info className="h-3 w-3 text-gold-dark" />
                </span>
              </div>
              <p className="mt-1.5 text-3xl font-bold tracking-tight text-navy">{value}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-green-500" />}
                {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-gold-dark" />}
                {trend === "neutral" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    trend === "up" && "text-green-600",
                    trend === "down" && "text-gold-dark",
                    trend === "neutral" && "text-muted-foreground",
                    isBlocked && "text-red-600 font-semibold"
                  )}
                >
                  {trendLabel}
                </span>
              </div>
            </div>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-sm",
                accent,
                isBlocked && "bg-red-100 text-red-600",
                isRisk && "bg-amber-100 text-amber-600"
              )}
            >
              <Icon className={cn("h-5 w-5 text-navy", isBlocked && "text-red-600", isRisk && "text-amber-700")} />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100/80 pt-2 text-[10px] text-muted-foreground/70">
            <span>Hover or click for signal insights</span>
            <ChevronRight className={cn("h-3 w-3 transition-transform duration-200", isOpen || isHovered ? "rotate-90 text-gold-dark" : "text-slate-300")} />
          </div>
        </CardContent>
      </Card>

      {/* Floating Animated Explanation / Reason Card */}
      {(isHovered || isOpen) && explanation && (
        <div
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl transition-all duration-200",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
          )}
          style={{ minWidth: "280px" }}
        >
          <div className="flex items-start gap-2.5 mb-2.5">
            <div className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
              isBlocked ? "bg-red-100 text-red-600" : isRisk ? "bg-amber-100 text-amber-600" : "bg-navy/5 text-navy"
            )}>
              {isBlocked ? <AlertOctagon className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy">{title} — Signal Breakdown</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>

          {items && items.length > 0 ? (
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Current Details ({items.length}):
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 scrollbar-clean pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-navy truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>
                      )}
                    </div>
                    {item.badge && (
                      <span className={cn("shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded", item.badgeColor || "bg-slate-200 text-slate-700")}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-2.5 rounded-lg bg-green-50/70 p-2 border border-green-100 text-[10px] text-green-700 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
              <span>All clear: No critical impediments or risk factors currently active.</span>
            </div>
          )}

          <div className="mt-3 border-t border-slate-100 pt-2 flex items-center justify-between text-[9px] text-muted-foreground">
            <span>💡 Agile PM Health Indicator</span>
            <span className="font-semibold text-gold-dark">Live Realtime Data</span>
          </div>
        </div>
      )}
    </div>
  )
}


"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

type KPICardProps = {
  title: string
  value: string
  trend: "up" | "down" | "neutral"
  trendLabel: string
  icon: React.ElementType
  accent?: string
}

export function KPICard({ title, value, trend, trendLabel, icon: Icon, accent = "bg-navy/5" }: KPICardProps) {
  return (
    <Card className="group border-0 shadow-card transition-all duration-200 hover:shadow-card-hover">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
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
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {trendLabel}
              </span>
            </div>
          </div>
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-110 group-hover:shadow-sm",
            accent
          )}>
            <Icon className="h-5 w-5 text-navy" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

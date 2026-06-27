"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { HEALTH_STATUSES } from "@/lib/constants"
import type { HealthStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

type ProjectHealthCardProps = {
  id: string
  name: string
  healthStatus: HealthStatus
  progress: number
  deadline: string
  memberCount: number
  memberAvatars?: string[]
}

export function ProjectHealthCard({
  id,
  name,
  healthStatus,
  progress,
  deadline,
  memberCount,
  memberAvatars = [],
}: ProjectHealthCardProps) {
  const health = HEALTH_STATUSES.find((h) => h.value === healthStatus)!

  const progressColor =
    healthStatus === "ON_TRACK" ? "bg-green-500"
    : healthStatus === "AT_RISK" ? "bg-gold"
    : "bg-gold-dark"

  return (
    <Link href={`/projects/${id}`}>
      <Card className="group cursor-pointer border-0 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-navy truncate group-hover:text-gold-dark transition-colors">
                {name}
              </h3>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "ml-2 shrink-0 text-[10px] font-semibold tracking-wide px-2 py-0.5",
                health.color
              )}
            >
              {health.label}
            </Badge>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground font-medium">Progress</span>
              <span className="font-semibold text-navy">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  progressColor
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {deadline ? (
                <span>Due {formatDistanceToNow(new Date(deadline), { addSuffix: true })}</span>
              ) : (
                <span>No deadline</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {memberAvatars.length > 0 ? (
                <div className="flex -space-x-1.5">
                  {memberAvatars.slice(0, 3).map((_, i) => (
                    <Avatar key={i} className="h-5 w-5 border-2 border-white">
                      <AvatarFallback className="bg-navy/10 text-[7px] font-medium text-navy">
                        U{i + 1}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              ) : (
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="text-[11px] text-muted-foreground font-medium">{memberCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// checked
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"

interface SectionDurationBadgeProps {
  duration: number
  sectionName: string
  className?: string
  trend?: "up" | "down" | "stable"
  maxDuration?: number
  entryCount?: number
  showDetails?: boolean
}

export default function SectionDurationBadge({
  duration,
  sectionName,
  className,
  trend = "stable",
  maxDuration,
  entryCount,
  showDetails = false,
}: SectionDurationBadgeProps) {
  const formatDuration = (seconds: number) => {
    if (seconds < 1) {
      return `${Math.round(seconds * 1000)}ms`
    }
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`
  }

  const getDurationColor = (seconds: number) => {
    if (seconds < 1) return "text-green-600 bg-green-50 border-green-200"
    if (seconds < 3) return "text-amber-600 bg-amber-50 border-amber-200"
    if (seconds < 60) return "text-orange-600 bg-orange-50 border-orange-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return "↗"
      case "down":
        return "↘"
      default:
        return "→"
    }
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium",
        "shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md",
        getDurationColor(maxDuration || duration),
        className,
      )}
      title={
        showDetails && maxDuration
          ? `Avg: ${formatDuration(duration)} | Max: ${formatDuration(maxDuration)}${entryCount ? ` | ${entryCount} entries` : ""}`
          : `Average: ${formatDuration(duration)}`
      }
    >
      <Clock className="h-3.5 w-3.5" />
      <span className="font-mono">
        {showDetails && maxDuration ? `Max: ${formatDuration(maxDuration)}` : `Avg: ${formatDuration(duration)}`}
      </span>
      <span className="text-xs opacity-70">{getTrendIcon()}</span>
    </div>
  )
}

export { SectionDurationBadge }

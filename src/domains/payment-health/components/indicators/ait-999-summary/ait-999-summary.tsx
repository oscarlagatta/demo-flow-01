import { useGetSplunkTimingsUsWires } from "../../../hooks/use-get-splunk-us-wires/use-get-splunk-timings-us-wires"
import { formatTimingValue } from "../../../utils/timing-data-processor"

interface Ait999Data {
  aitNumber: string
  aitName: string
  averageThruputTime30: number
  sectionName: string
}

interface Ait999Summary {
  totalEntries: number
  averageProcessingTime: number
  maxProcessingTime: number
  minProcessingTime: number
  sectionsAffected: string[]
  entries: Ait999Data[]
}

function calculateAit999Summary(data: any[]): Ait999Summary | null {
  if (!data || data.length === 0) {
    return null
  }

  const ait999Entries: Ait999Data[] = []

  data.forEach((section) => {
    if (section.aitTimingData) {
      section.aitTimingData.forEach((ait: any) => {
        if (ait.aitNumber === "999") {
          ait999Entries.push({
            aitNumber: ait.aitNumber,
            aitName: ait.aitName,
            averageThruputTime30: ait.averageThruputTime30,
            sectionName: section.sectionName,
          })
        }
      })
    }
  })

  if (ait999Entries.length === 0) {
    return null
  }

  const processingTimes = ait999Entries.map((entry) => entry.averageThruputTime30)
  const totalProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0)
  const averageProcessingTime = totalProcessingTime / processingTimes.length
  const maxProcessingTime = Math.max(...processingTimes)
  const minProcessingTime = Math.min(...processingTimes)
  const sectionsAffected = [...new Set(ait999Entries.map((entry) => entry.sectionName))]

  return {
    totalEntries: ait999Entries.length,
    averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
    maxProcessingTime: Math.round(maxProcessingTime * 100) / 100,
    minProcessingTime: Math.round(minProcessingTime * 100) / 100,
    sectionsAffected,
    entries: ait999Entries,
  }
}

export function Ait999Summary() {
  const { data, isLoading, isError, isFetching } = useGetSplunkTimingsUsWires()

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading AIT 999 timing data...</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 rounded-full bg-destructive" />
          <span className="text-sm text-destructive">Failed to load AIT 999 timing data</span>
        </div>
      </div>
    )
  }

  const summary = data ? calculateAit999Summary(data) : null

  if (!summary) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 rounded-full bg-muted" />
          <span className="text-sm text-muted-foreground">No AIT 999 timing data available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">AIT 999 Timing Summary</h3>
          {isFetching && (
            <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
          )}
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Entries</p>
            <p className="text-lg font-semibold">{summary.totalEntries}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Average Time</p>
            <p className="text-lg font-semibold">{formatTimingValue(summary.averageProcessingTime)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Max Time</p>
            <p className="text-lg font-semibold text-destructive">{formatTimingValue(summary.maxProcessingTime)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Min Time</p>
            <p className="text-lg font-semibold text-green-600">{formatTimingValue(summary.minProcessingTime)}</p>
          </div>
        </div>

        {/* Affected Sections */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Affected Sections ({summary.sectionsAffected.length})</p>
          <div className="flex flex-wrap gap-2">
            {summary.sectionsAffected.map((section) => (
              <span key={section} className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {section}
              </span>
            ))}
          </div>
        </div>

        {/* Detailed Entries */}
        <div className="space-y-2">
          <p className="text-sm font-medium">AIT 999 Entries</p>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {summary.entries.map((entry, index) => (
              <div key={index} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs">
                <span className="font-medium">{entry.aitName}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">{entry.sectionName}</span>
                  <span className="font-semibold">{formatTimingValue(entry.averageThruputTime30)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

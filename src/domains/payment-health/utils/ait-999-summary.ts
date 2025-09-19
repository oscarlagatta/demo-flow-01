import type { SectionProcessingTime } from "../hooks/use-get-splunk-us-wires/use-get-splunk-timings-us-wires"

export interface Ait999Summary {
  totalEntries: number
  averageProcessingTime: number
  maxProcessingTime: number
  minProcessingTime: number
  sectionsAffected: string[]
  lastUpdated: Date
  totalProcessingTime: number
}

export function calculateAit999Summary(data: SectionProcessingTime[]): Ait999Summary | null {
  // Early return if no data is provided
  if (!data || data.length === 0) {
    console.log("[v0] No data provided to calculateAit999Summary")
    return null
  }

  console.log("[v0] Processing", data.length, "sections for AIT 999 data")

  const ait999Entries: Array<{ aitData: any; sectionName: string }> = []

  data.forEach((section) => {
    const sectionAit999 = section.aitTimingData?.filter((ait) => ait.aitNumber === "999") || []
    sectionAit999.forEach((ait) => {
      ait999Entries.push({ aitData: ait, sectionName: section.sectionName })
    })
  })

  if (ait999Entries.length === 0) {
    console.log("[v0] No AIT 999 entries found")
    return null
  }

  let totalProcessingTime = 0
  let maxProcessingTime = 0
  let minProcessingTime = Number.POSITIVE_INFINITY
  const sectionsAffected = new Set<string>()

  ait999Entries.forEach(({ aitData, sectionName }) => {
    totalProcessingTime += aitData.averageThruputTime30
    maxProcessingTime = Math.max(maxProcessingTime, aitData.averageThruputTime30)
    minProcessingTime = Math.min(minProcessingTime, aitData.averageThruputTime30)
    sectionsAffected.add(sectionName)
  })

  // Calculate average processing time
  const averageProcessingTime = ait999Entries.length > 0 ? totalProcessingTime / ait999Entries.length : 0

  // Handle case where no valid entries were found
  if (minProcessingTime === Number.POSITIVE_INFINITY) {
    minProcessingTime = 0
  }

  const summary = {
    totalEntries: ait999Entries.length,
    averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
    maxProcessingTime: Math.round(maxProcessingTime * 100) / 100,
    minProcessingTime: Math.round(minProcessingTime * 100) / 100,
    totalProcessingTime: Math.round(totalProcessingTime * 100) / 100,
    sectionsAffected: Array.from(sectionsAffected),
    lastUpdated: new Date(),
  }

  console.log("[v0] AIT 999 Summary calculated:", summary)
  return summary
}

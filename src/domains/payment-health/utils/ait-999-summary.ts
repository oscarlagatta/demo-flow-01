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

  // Filter all sections to find those containing AIT 999 entries
  const sectionsWithAit999 = data.filter((section) => {
    const hasAit999 = section.aitTimingData?.some((ait) => ait.aitNumber === "999")
    if (hasAit999) {
      console.log("[v0] Found AIT 999 data in section:", section.sectionName)
    }
    return hasAit999
  })

  if (sectionsWithAit999.length === 0) {
    console.log("[v0] No sections found with AIT 999 data")
    return null
  }

  let totalEntries = 0
  let totalProcessingTime = 0
  let maxProcessingTime = 0
  let minProcessingTime = Number.POSITIVE_INFINITY
  const sectionsAffected: string[] = []

  // Process each section that contains AIT 999 data
  sectionsWithAit999.forEach((section) => {
    // Extract only AIT 999 entries from the section
    const ait999Entries = section.aitTimingData?.filter((ait) => ait.aitNumber === "999") || []

    console.log("[v0] Processing", ait999Entries.length, "AIT 999 entries from section:", section.sectionName)

    // Aggregate timing data for each AIT 999 entry
    ait999Entries.forEach((ait) => {
      totalEntries++
      totalProcessingTime += ait.averageThruputTime30
      maxProcessingTime = Math.max(maxProcessingTime, ait.averageThruputTime30)
      minProcessingTime = Math.min(minProcessingTime, ait.averageThruputTime30)
    })

    // Track which sections are affected
    if (ait999Entries.length > 0) {
      sectionsAffected.push(section.sectionName)
    }
  })

  // Calculate average processing time
  const averageProcessingTime = totalEntries > 0 ? totalProcessingTime / totalEntries : 0

  // Handle case where no valid entries were found
  if (minProcessingTime === Number.POSITIVE_INFINITY) {
    minProcessingTime = 0
  }

  const summary = {
    totalEntries,
    averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
    maxProcessingTime: Math.round(maxProcessingTime * 100) / 100,
    minProcessingTime: Math.round(minProcessingTime * 100) / 100,
    totalProcessingTime: Math.round(totalProcessingTime * 100) / 100,
    sectionsAffected: [...new Set(sectionsAffected)], // Remove duplicates
    lastUpdated: new Date(),
  }

  console.log("[v0] AIT 999 Summary calculated:", summary)
  return summary
}
